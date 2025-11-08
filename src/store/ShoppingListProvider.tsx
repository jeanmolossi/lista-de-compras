import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  archiveShoppingList,
  createShoppingList,
  deleteShoppingList,
  getActiveShoppingLists,
  getArchivedShoppingLists,
  restoreShoppingList,
} from '../database/shoppingListsRepository';
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from '../database/categoriesRepository';
import {
  createItem as createItemRepository,
  deleteItem as deleteItemRepository,
  updateItem as updateItemRepository,
} from '../database/itemsRepository';
import { ShoppingList, ShoppingListSuggestion } from './types';

interface ShoppingListContextValue {
  loading: boolean;
  activeList: ShoppingList | null;
  archivedLists: ShoppingList[];
  total: number;
  refresh: () => Promise<void>;
  createNewList: (name: string) => Promise<void>;
  createListFromSuggestion: (suggestion: ShoppingListSuggestion) => Promise<void>;
  addCategory: (name: string) => Promise<void>;
  renameCategory: (categoryId: number, name: string) => Promise<void>;
  removeCategory: (categoryId: number) => Promise<void>;
  addItem: (
    categoryId: number,
    data: { name: string; quantity?: number; price?: number; notes?: string },
  ) => Promise<void>;
  updateItem: (
    itemId: number,
    data: {
      name: string;
      quantity: number;
      price: number;
      notes?: string;
      purchased: boolean;
    },
  ) => Promise<void>;
  toggleItemPurchased: (itemId: number, purchased: boolean) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  archiveActiveList: () => Promise<void>;
  restoreList: (listId: number) => Promise<void>;
  deleteList: (listId: number) => Promise<void>;
}

const ShoppingListContext = createContext<ShoppingListContextValue | undefined>(
  undefined,
);

const ShoppingListProvider = ({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element => {
  const [activeList, setActiveList] = useState<ShoppingList | null>(null);
  const [archivedLists, setArchivedLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshAll = useCallback(
    async (preferredActiveId?: number | null) => {
      const [active, archived] = await Promise.all([
        getActiveShoppingLists(),
        getArchivedShoppingLists(),
      ]);
      setArchivedLists(archived);
      const preferredId = preferredActiveId ?? activeList?.id ?? null;
      const nextActive =
        preferredId != null
          ? (active.find((list) => list.id === preferredId) ?? active[0] ?? null)
          : (active[0] ?? null);
      setActiveList(nextActive ?? null);
    },
    [activeList?.id],
  );

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      try {
        await refreshAll();
      } finally {
        setLoading(false);
      }
    };
    bootstrap().catch((error) => {
      console.error('Erro ao carregar listas', error);
    });
  }, [refreshAll]);

  const total = useMemo(() => {
    if (!activeList) {
      return 0;
    }
    return activeList.categories.reduce((categoryAcc, category) => {
      const categoryTotal = category.items.reduce((itemAcc, item) => {
        return itemAcc + item.price * item.quantity;
      }, 0);
      return categoryAcc + categoryTotal;
    }, 0);
  }, [activeList]);

  const withLoading = useCallback(
    async <T,>(
      fn: () => Promise<T>,
      getPreferredActiveId?: () => number | null,
    ): Promise<T> => {
      setLoading(true);
      try {
        const result = await fn();
        const preferredActiveId = getPreferredActiveId
          ? getPreferredActiveId()
          : undefined;
        await refreshAll(preferredActiveId);
        return result;
      } finally {
        setLoading(false);
      }
    },
    [refreshAll],
  );

  const createNewList = useCallback(
    async (name: string) => {
      await withLoading(async () => {
        await createShoppingList(name);
      });
    },
    [withLoading],
  );

  const createListFromSuggestionHandler = useCallback(
    async (suggestion: ShoppingListSuggestion) => {
      let createdListId: number | null = null;
      await withLoading(
        async () => {
          const listName = suggestion.name?.trim().length
            ? suggestion.name
            : 'Lista gerada';
          const list = await createShoppingList(listName);
          createdListId = list.id;

          for (const category of suggestion.categories ?? []) {
            const createdCategory = await createCategory(list.id, category.name);
            for (const item of category.items ?? []) {
              await createItemRepository(createdCategory.id, {
                name: item.name,
                quantity: item.quantity ?? 1,
                price: item.price ?? 0,
                notes: item.notes,
              });
            }
          }
        },
        () => createdListId,
      );
    },
    [withLoading],
  );

  const addCategory = useCallback(
    async (name: string) => {
      if (!activeList) {
        throw new Error('Nenhuma lista ativa disponível');
      }
      await withLoading(
        async () => {
          await createCategory(activeList.id, name);
        },
        () => activeList.id,
      );
    },
    [activeList, withLoading],
  );

  const renameCategory = useCallback(
    async (categoryId: number, name: string) => {
      await withLoading(
        async () => {
          await updateCategory(categoryId, name);
        },
        () => activeList?.id ?? null,
      );
    },
    [activeList?.id, withLoading],
  );

  const removeCategory = useCallback(
    async (categoryId: number) => {
      await withLoading(
        async () => {
          await deleteCategory(categoryId);
        },
        () => activeList?.id ?? null,
      );
    },
    [activeList?.id, withLoading],
  );

  const addItem = useCallback(
    async (
      categoryId: number,
      data: { name: string; quantity?: number; price?: number; notes?: string },
    ) => {
      await withLoading(
        async () => {
          await createItemRepository(categoryId, data);
        },
        () => activeList?.id ?? null,
      );
    },
    [activeList?.id, withLoading],
  );

  const updateItem = useCallback(
    async (
      itemId: number,
      data: {
        name: string;
        quantity: number;
        price: number;
        notes?: string;
        purchased: boolean;
      },
    ) => {
      await withLoading(
        async () => {
          await updateItemRepository(itemId, data);
        },
        () => activeList?.id ?? null,
      );
    },
    [activeList?.id, withLoading],
  );

  const toggleItemPurchased = useCallback(
    async (itemId: number, purchased: boolean) => {
      const item = activeList?.categories
        .flatMap((category) => category.items)
        .find((current) => current.id === itemId);
      if (!item) {
        throw new Error('Item não encontrado na lista ativa');
      }
      await updateItem(itemId, {
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes ?? undefined,
        purchased,
      });
    },
    [activeList, updateItem],
  );

  const removeItem = useCallback(
    async (itemId: number) => {
      await withLoading(
        async () => {
          await deleteItemRepository(itemId);
        },
        () => activeList?.id ?? null,
      );
    },
    [activeList?.id, withLoading],
  );

  const archiveActiveList = useCallback(async () => {
    if (!activeList) {
      throw new Error('Nenhuma lista ativa para arquivar');
    }
    await withLoading(async () => {
      await archiveShoppingList(activeList.id);
    });
  }, [activeList, withLoading]);

  const restoreList = useCallback(
    async (listId: number) => {
      await withLoading(
        async () => {
          await restoreShoppingList(listId);
        },
        () => listId,
      );
    },
    [withLoading],
  );

  const deleteList = useCallback(
    async (listId: number) => {
      await withLoading(async () => {
        await deleteShoppingList(listId);
      });
    },
    [withLoading],
  );

  const refresh = useCallback(async () => {
    await withLoading(async () => {});
  }, [withLoading]);

  const value = useMemo<ShoppingListContextValue>(
    () => ({
      loading,
      activeList,
      archivedLists,
      total,
      refresh,
      createNewList,
      createListFromSuggestion: createListFromSuggestionHandler,
      addCategory,
      renameCategory,
      removeCategory,
      addItem,
      updateItem,
      toggleItemPurchased,
      removeItem,
      archiveActiveList,
      restoreList,
      deleteList,
    }),
    [
      activeList,
      addCategory,
      addItem,
      archiveActiveList,
      archivedLists,
      createListFromSuggestionHandler,
      createNewList,
      deleteList,
      loading,
      removeCategory,
      removeItem,
      refresh,
      renameCategory,
      restoreList,
      toggleItemPurchased,
      total,
      updateItem,
    ],
  );

  return (
    <ShoppingListContext.Provider value={value}>{children}</ShoppingListContext.Provider>
  );
};

export const useShoppingList = (): ShoppingListContextValue => {
  const context = useContext(ShoppingListContext);
  if (!context) {
    throw new Error('useShoppingList deve ser usado dentro de ShoppingListProvider');
  }
  return context;
};

export { ShoppingListProvider };
