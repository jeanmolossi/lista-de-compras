export type ShoppingItem = {
  id: number;
  categoryId: number;
  name: string;
  quantity: number;
  price: number;
  notes?: string | null;
  purchased: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ShoppingCategory = {
  id: number;
  listId: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  items: ShoppingItem[];
};

export type ShoppingList = {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  categories: ShoppingCategory[];
};

export type ShoppingListSuggestion = {
  name: string;
  categories: Array<{
    name: string;
    items: Array<{
      name: string;
      quantity?: number;
      price?: number;
      notes?: string;
    }>;
  }>;
};
