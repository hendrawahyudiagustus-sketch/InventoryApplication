import { Hono } from 'hono';
import { cors } from 'hono/cors';

export type Bindings = {
  DB: D1Database;
  BUCKET?: R2Bucket;
  ASSETS?: Fetcher;
};

// In-memory fallback for images if R2 is not activated yet in user account
const memoryImageStore = new Map<string, { data: ArrayBuffer; type: string }>();

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors());

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', runtime: 'Cloudflare Workers + Hono' });
});

// GET all items
app.get('/api/items', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM items ORDER BY created_at DESC'
    ).all();
    return c.json({ success: true, data: results });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// GET single item
app.get('/api/items/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const item = await c.env.DB.prepare('SELECT * FROM items WHERE id = ?')
      .bind(id)
      .first();
    if (!item) {
      return c.json({ success: false, error: 'Item not found' }, 404);
    }
    return c.json({ success: true, data: item });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// POST create item
app.post('/api/items', async (c) => {
  try {
    const body = await c.req.json();
    const { name, sku, category, quantity, price, image_key } = body;

    if (!name || !sku || !category) {
      return c.json(
        { success: false, error: 'Name, SKU, and Category are required' },
        400
      );
    }

    const id = 'item-' + crypto.randomUUID().slice(0, 8);
    const qty = parseInt(quantity) || 0;
    const prc = parseFloat(price) || 0;

    await c.env.DB.prepare(
      `INSERT INTO items (id, name, sku, category, quantity, price, image_key)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(id, name, sku, category, qty, prc, image_key || null)
      .run();

    const created = await c.env.DB.prepare('SELECT * FROM items WHERE id = ?')
      .bind(id)
      .first();

    return c.json({ success: true, data: created }, 201);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// PUT update item
app.put('/api/items/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const { name, sku, category, quantity, price, image_key } = body;

    const existing = await c.env.DB.prepare('SELECT * FROM items WHERE id = ?')
      .bind(id)
      .first();
    if (!existing) {
      return c.json({ success: false, error: 'Item not found' }, 404);
    }

    const qty = quantity !== undefined ? parseInt(quantity) : existing.quantity;
    const prc = price !== undefined ? parseFloat(price) : existing.price;

    await c.env.DB.prepare(
      `UPDATE items 
       SET name = ?, sku = ?, category = ?, quantity = ?, price = ?, image_key = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
      .bind(
        name ?? existing.name,
        sku ?? existing.sku,
        category ?? existing.category,
        qty,
        prc,
        image_key !== undefined ? image_key : existing.image_key,
        id
      )
      .run();

    const updated = await c.env.DB.prepare('SELECT * FROM items WHERE id = ?')
      .bind(id)
      .first();
    return c.json({ success: true, data: updated });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// DELETE item
app.delete('/api/items/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const existing: any = await c.env.DB.prepare('SELECT * FROM items WHERE id = ?')
      .bind(id)
      .first();
    if (!existing) {
      return c.json({ success: false, error: 'Item not found' }, 404);
    }

    // Delete image from R2/memory if exists
    if (existing.image_key) {
      if (c.env.BUCKET) {
        await c.env.BUCKET.delete(existing.image_key);
      } else {
        memoryImageStore.delete(existing.image_key);
      }
    }

    await c.env.DB.prepare('DELETE FROM items WHERE id = ?').bind(id).run();
    return c.json({ success: true, message: 'Item deleted successfully' });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// R2 Storage: Upload image
app.post('/api/upload', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return c.json({ success: false, error: 'No file provided' }, 400);
    }

    const fileExt = file.name.split('.').pop() || 'png';
    const key = `img-${crypto.randomUUID()}.${fileExt}`;
    const arrayBuffer = await file.arrayBuffer();

    if (c.env.BUCKET) {
      await c.env.BUCKET.put(key, arrayBuffer, {
        httpMetadata: { contentType: file.type || 'image/jpeg' },
      });
    } else {
      // Memory store fallback
      memoryImageStore.set(key, { data: arrayBuffer, type: file.type || 'image/jpeg' });
    }

    return c.json({
      success: true,
      key,
      url: `/api/images/${key}`,
      storage: c.env.BUCKET ? 'R2' : 'Local Memory (R2 ready)',
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// R2 Storage: Retrieve image
app.get('/api/images/:key', async (c) => {
  const key = c.req.param('key');
  try {
    if (c.env.BUCKET) {
      const object = await c.env.BUCKET.get(key);
      if (!object) {
        return c.text('Image not found', 404);
      }
      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set('etag', object.httpEtag);
      return new Response(object.body, { headers });
    } else {
      const stored = memoryImageStore.get(key);
      if (!stored) {
        return c.text('Image not found', 404);
      }
      return new Response(stored.data, {
        headers: { 'Content-Type': stored.type },
      });
    }
  } catch (err: any) {
    return c.text('Error retrieving image: ' + err.message, 500);
  }
});

// Fallback to static assets (Vite client)
app.get('*', async (c) => {
  if (c.env.ASSETS) {
    return c.env.ASSETS.fetch(c.req.raw);
  }
  return c.text('Vite assets not found. Run bun run build first.');
});

export default app;
