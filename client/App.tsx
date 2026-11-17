import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  Image as ImageIcon, 
  Database, 
  HardDrive, 
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Upload
} from 'lucide-react';
import { InventoryItem, InventoryItemInput } from './types';

export const App: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<InventoryItemInput>({
    name: '',
    sku: '',
    category: 'Electronics',
    quantity: 1,
    price: 0,
    image_key: null,
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/items');
      const json = await res.json();
      if (json.success) {
        setItems(json.data);
      }
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ type: 'error', text: 'Gagal memuat data dari D1 Database' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const data = new FormData();
      data.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: data,
      });
      const json = await res.json();
      if (json.success) {
        setFormData((prev) => ({ ...prev, image_key: json.key }));
        setStatusMsg({ type: 'success', text: `Gambar tersimpan ke Storage (${json.storage})` });
      } else {
        alert(json.error || 'Upload failed');
      }
    } catch (err: any) {
      alert('Upload error: ' + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        const res = await fetch(`/api/items/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const json = await res.json();
        if (json.success) {
          setStatusMsg({ type: 'success', text: 'Item berhasil diupdate!' });
        }
      } else {
        const res = await fetch('/api/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const json = await res.json();
        if (json.success) {
          setStatusMsg({ type: 'success', text: 'Item baru berhasil disimpan ke D1!' });
        }
      }

      setIsModalOpen(false);
      setEditingId(null);
      setFormData({
        name: '',
        sku: '',
        category: 'Electronics',
        quantity: 1,
        price: 0,
        image_key: null,
      });
      fetchItems();
    } catch (err: any) {
      alert('Error saving item: ' + err.message);
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      sku: item.sku,
      category: item.category,
      quantity: item.quantity,
      price: item.price,
      image_key: item.image_key || null,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah yakin ingin menghapus item ini?')) return;
    try {
      const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setStatusMsg({ type: 'success', text: 'Item berhasil dihapus' });
        fetchItems();
      }
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    }
  };

  const categories = ['All', ...Array.from(new Set(items.map((i) => i.category)))];

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const totalStock = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 16px' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', borderBottom: '1px solid #1e293b', paddingBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#3b82f6', padding: '10px', borderRadius: '12px', display: 'flex' }}>
              <Package size={28} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f8fafc' }}>Cloudflare Inventory System</h1>
              <p style={{ fontSize: '14px', color: '#94a3b8' }}>
                Tech stack: <strong style={{ color: '#38bdf8' }}>Bun + React + Vite + TypeScript + Hono + D1 + R2</strong>
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => {
              setEditingId(null);
              setFormData({
                name: '',
                sku: '',
                category: 'Electronics',
                quantity: 1,
                price: 0,
                image_key: null,
              });
              setIsModalOpen(true);
            }}
            style={{
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 18px',
              cursor: 'pointer',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Plus size={18} /> Tambah Item
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginBottom: '8px' }}>
            <span>Total Produk</span>
            <Package size={20} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700' }}>{items.length}</div>
        </div>

        <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginBottom: '8px' }}>
            <span>Total Kuantitas Stok</span>
            <Database size={20} color="#4ade80" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700' }}>{totalStock} pcs</div>
        </div>

        <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginBottom: '8px' }}>
            <span>Estimasi Nilai Total</span>
            <HardDrive size={20} color="#fbbf24" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700' }}>${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      {/* Notifications */}
      {statusMsg && (
        <div
          style={{
            background: statusMsg.type === 'success' ? '#064e3b' : '#7f1d1d',
            color: statusMsg.type === 'success' ? '#a7f3d0' : '#fecaca',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{statusMsg.text}</span>
          <button onClick={() => setStatusMsg(null)} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
          <Search size={18} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Cari berdasarkan nama atau SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 38px',
              borderRadius: '8px',
              border: '1px solid #334155',
              background: '#1e293b',
              color: '#fff',
              fontSize: '14px',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                background: selectedCategory === cat ? '#3b82f6' : '#1e293b',
                color: selectedCategory === cat ? '#fff' : '#94a3b8',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '8px 14px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: selectedCategory === cat ? '600' : '400',
              }}
            >
              {cat}
            </button>
          ))}
          <button
            onClick={fetchItems}
            title="Refresh Data"
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '8px 12px',
              color: '#94a3b8',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Items Table */}
      <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Memuat data inventaris...</div>
        ) : filteredItems.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Belum ada item inventaris yang sesuai.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155', background: '#0f172a' }}>
                <th style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '13px' }}>FOTO</th>
                <th style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '13px' }}>ITEM & SKU</th>
                <th style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '13px' }}>KATEGORI</th>
                <th style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '13px' }}>STOK</th>
                <th style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '13px' }}>HARGA</th>
                <th style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '13px', textAlign: 'right' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #334155' }}>
                  <td style={{ padding: '14px 16px' }}>
                    {item.image_key ? (
                      <img
                        src={`/api/images/${item.image_key}`}
                        alt={item.name}
                        style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          background: '#334155',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#64748b',
                        }}
                      >
                        <ImageIcon size={20} />
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: '600', color: '#f8fafc' }}>{item.name}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{item.sku}</div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span
                      style={{
                        background: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '16px',
                        padding: '4px 10px',
                        fontSize: '12px',
                        color: '#cbd5e1',
                      }}
                    >
                      {item.category}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span
                      style={{
                        fontWeight: '600',
                        color: item.quantity < 10 ? '#f87171' : '#4ade80',
                      }}
                    >
                      {item.quantity} pcs
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: '600' }}>
                    ${item.price.toFixed(2)}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button
                        onClick={() => handleEdit(item)}
                        style={{
                          background: '#334155',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          color: '#93c5fd',
                          cursor: 'pointer',
                        }}
                        title="Edit Item"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        style={{
                          background: '#334155',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          color: '#f87171',
                          cursor: 'pointer',
                        }}
                        title="Hapus Item"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
          }}
        >
          <div
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '12px',
              padding: '24px',
              width: '100%',
              maxWidth: '480px',
            }}
          >
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>
              {editingId ? 'Edit Item Inventaris' : 'Tambah Item Baru'}
            </h2>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>Nama Produk</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #334155',
                    background: '#0f172a',
                    color: '#fff',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>SKU Code</label>
                <input
                  type="text"
                  required
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #334155',
                    background: '#0f172a',
                    color: '#fff',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>Kategori</label>
                <input
                  type="text"
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #334155',
                    background: '#0f172a',
                    color: '#fff',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>Kuantitas</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #334155',
                      background: '#0f172a',
                      color: '#fff',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>Harga ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #334155',
                      background: '#0f172a',
                      color: '#fff',
                    }}
                  />
                </div>
              </div>

              {/* Upload Foto ke R2 */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>
                  Foto Produk (R2 Storage)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ fontSize: '13px', color: '#94a3b8' }}
                  />
                  {uploadingImage && <span style={{ fontSize: '12px', color: '#38bdf8' }}>Mengunggah...</span>}
                </div>
                {formData.image_key && (
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img
                      src={`/api/images/${formData.image_key}`}
                      alt="Preview"
                      style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                    />
                    <span style={{ fontSize: '12px', color: '#4ade80' }}>Key: {formData.image_key}</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    background: '#334155',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    cursor: 'pointer',
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{
                    background: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    cursor: 'pointer',
                    fontWeight: '600',
                  }}
                >
                  Simpan Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
