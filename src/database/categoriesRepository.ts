import { extractInsertId, getAll, getFirst, runQuery } from './index';
import { ShoppingCategory } from '../store/types';

type CategoryRow = {
  id: number;
  list_id: number;
  name: string;
  created_at: string;
  updated_at: string;
};

export const createCategory = async (
  listId: number,
  name: string,
): Promise<ShoppingCategory> => {
  const result = await runQuery(
    `INSERT INTO categories (list_id, name, created_at, updated_at)
     VALUES (?, ?, datetime('now'), datetime('now'))`,
    listId,
    name,
  );
  const categoryId = extractInsertId(result);
  const row = await getFirst<CategoryRow>(
    `SELECT * FROM categories WHERE id = ?`,
    categoryId,
  );
  if (!row) {
    throw new Error('Falha ao criar categoria');
  }
  return {
    id: row.id,
    listId: row.list_id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items: [],
  };
};

export const updateCategory = async (id: number, name: string): Promise<void> => {
  await runQuery(
    `UPDATE categories SET name = ?, updated_at = datetime('now') WHERE id = ?`,
    name,
    id,
  );
};

export const deleteCategory = async (id: number): Promise<void> => {
  await runQuery(`DELETE FROM categories WHERE id = ?`, id);
};

export const getCategoriesByListId = async (listId: number): Promise<CategoryRow[]> =>
  getAll<CategoryRow>(
    `SELECT * FROM categories WHERE list_id = ? ORDER BY created_at ASC`,
    listId,
  );
