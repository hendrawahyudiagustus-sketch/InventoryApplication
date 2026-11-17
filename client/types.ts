export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  price: number;
  image_key?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type InventoryItemInput = Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>;
