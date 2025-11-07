import { extractInsertId, getAll, getFirst, runQuery } from './index';
import { ShoppingList, ShoppingCategory, ShoppingItem } from '../store/types';

type ShoppingListRow = {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

type CategoryRow = {
  id: number;
  list_id: number;
  name: string;
  created_at: string;
  updated_at: string;
};

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

type ItemJoinedRow = ItemRow & { list_id: number };

const toItem = (row: ItemRow): ShoppingItem => ({
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

const buildListsGraph = async (listRows: ShoppingListRow[]): Promise<ShoppingList[]> => {
  if (listRows.length === 0) {
    return [];
  }

  const listIds = listRows.map((row) => row.id);
  const placeholders = listIds.map(() => '?').join(',');
  const categoriesRows = await getAll<CategoryRow>(
    `SELECT * FROM categories WHERE list_id IN (${placeholders}) ORDER BY created_at ASC`,
    ...listIds,
  );
  const itemsRows = await getAll<ItemJoinedRow>(
    `SELECT items.*, categories.list_id as list_id
     FROM items
     INNER JOIN categories ON categories.id = items.category_id
     WHERE categories.list_id IN (${placeholders})
     ORDER BY items.created_at ASC`,
    ...listIds,
  );

  const categoriesByList = new Map<number, ShoppingCategory[]>();
  const categoryById = new Map<number, ShoppingCategory>();

  for (const row of categoriesRows) {
    const category: ShoppingCategory = {
      id: row.id,
      listId: row.list_id,
      name: row.name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      items: [],
    };
    categoryById.set(row.id, category);
    const listCategories = categoriesByList.get(row.list_id) ?? [];
    listCategories.push(category);
    categoriesByList.set(row.list_id, listCategories);
  }

  for (const row of itemsRows) {
    const category = categoryById.get(row.category_id);
    if (category) {
      category.items.push(toItem(row));
    }
  }

  return listRows.map<ShoppingList>((row) => ({
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
    categories: categoriesByList.get(row.id) ?? [],
  }));
};

export const createShoppingList = async (name: string): Promise<ShoppingList> => {
  const result = await runQuery(
    `INSERT INTO shopping_lists (name, created_at, updated_at) VALUES (?, datetime('now'), datetime('now'))`,
    name,
  );
  const listId = extractInsertId(result);
  const list = await getShoppingListById(listId);
  if (!list) {
    throw new Error('Falha ao criar lista de compras');
  }
  return list;
};

export const updateShoppingListName = async (id: number, name: string): Promise<void> => {
  await runQuery(
    `UPDATE shopping_lists SET name = ?, updated_at = datetime('now') WHERE id = ?`,
    name,
    id,
  );
};

export const archiveShoppingList = async (id: number): Promise<void> => {
  await runQuery(
    `UPDATE shopping_lists SET archived_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
    id,
  );
};

export const restoreShoppingList = async (id: number): Promise<void> => {
  await runQuery(
    `UPDATE shopping_lists SET archived_at = NULL, updated_at = datetime('now') WHERE id = ?`,
    id,
  );
};

export const deleteShoppingList = async (id: number): Promise<void> => {
  await runQuery(`DELETE FROM shopping_lists WHERE id = ?`, id);
};

export const getShoppingListById = async (id: number): Promise<ShoppingList | null> => {
  const row = await getFirst<ShoppingListRow>(
    `SELECT * FROM shopping_lists WHERE id = ?`,
    id,
  );
  if (!row) {
    return null;
  }
  const [list] = await buildListsGraph([row]);
  return list ?? null;
};

const getListsByArchiveStatus = async (archived: boolean): Promise<ShoppingList[]> => {
  const condition = archived ? 'archived_at IS NOT NULL' : 'archived_at IS NULL';
  const rows = await getAll<ShoppingListRow>(
    `SELECT * FROM shopping_lists WHERE ${condition} ORDER BY created_at DESC`,
  );
  return buildListsGraph(rows);
};

export const getActiveShoppingLists = async (): Promise<ShoppingList[]> =>
  getListsByArchiveStatus(false);

export const getArchivedShoppingLists = async (): Promise<ShoppingList[]> =>
  getListsByArchiveStatus(true);

export const getLatestActiveShoppingList = async (): Promise<ShoppingList | null> => {
  const lists = await getActiveShoppingLists();
  return lists.length > 0 ? lists[0] : null;
};
