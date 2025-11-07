import { extractInsertId, getAll, getFirst, runQuery } from './index';
import { ShoppingItem } from '../store/types';

type ItemRow = {
  id: number;
  category_id: number;
  name: string;
  quantity: number | null;
  price: number | null;
  notes: string | null;
  purchased: number | null;
  created_at: string;
  updated_at: string;
};

const mapItem = (row: ItemRow): ShoppingItem => ({
  id: row.id,
  categoryId: row.category_id,
  name: row.name,
  quantity: row.quantity ?? 1,
  price: row.price ?? 0,
  notes: row.notes,
  purchased: Boolean(row.purchased),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const createItem = async (
  categoryId: number,
  data: {
    name: string;
    quantity?: number;
    price?: number;
    notes?: string;
    purchased?: boolean;
  },
): Promise<ShoppingItem> => {
  const result = await runQuery(
    `INSERT INTO items (category_id, name, quantity, price, notes, purchased, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    categoryId,
    data.name,
    data.quantity ?? 1,
    data.price ?? 0,
    data.notes ?? null,
    data.purchased ? 1 : 0,
  );
  const itemId = extractInsertId(result);
  const row = await getFirst<ItemRow>(`SELECT * FROM items WHERE id = ?`, itemId);
  if (!row) {
    throw new Error('Falha ao criar item');
  }
  return mapItem(row);
};

export const updateItem = async (
  id: number,
  data: {
    name: string;
    quantity: number;
    price: number;
    notes?: string;
    purchased: boolean;
  },
): Promise<void> => {
  await runQuery(
    `UPDATE items
     SET name = ?, quantity = ?, price = ?, notes = ?, purchased = ?, updated_at = datetime('now')
     WHERE id = ?`,
    data.name,
    data.quantity,
    data.price,
    data.notes ?? null,
    data.purchased ? 1 : 0,
    id,
  );
};

export const deleteItem = async (id: number): Promise<void> => {
  await runQuery(`DELETE FROM items WHERE id = ?`, id);
};

export const getItemsByCategoryId = async (
  categoryId: number,
): Promise<ShoppingItem[]> => {
  const rows = await getAll<ItemRow>(
    `SELECT * FROM items WHERE category_id = ? ORDER BY created_at ASC`,
    categoryId,
  );
  return rows.map(mapItem);
};
