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
import { useSnackbar } from './SnackbarProvider';

interface ShoppingListContextValue {
  loading: boolean;
  activeList: ShoppingList | null;
  activeLists: ShoppingList[];
  archivedLists: ShoppingList[];
  total: number;
  refresh: () => Promise<boolean>;
  createNewList: (name: string) => Promise<boolean>;
  createListFromSuggestion: (suggestion: ShoppingListSuggestion) => Promise<boolean>;
  selectActiveList: (listId: number) => Promise<boolean>;
  addCategory: (name: string) => Promise<boolean>;
  renameCategory: (categoryId: number, name: string) => Promise<boolean>;
  removeCategory: (categoryId: number) => Promise<boolean>;
  addItem: (
    categoryId: number,
    data: { name: string; quantity?: number; price?: number; notes?: string },
  ) => Promise<boolean>;
  updateItem: (
    itemId: number,
    data: {
      name: string;
      quantity: number;
      price: number;
      notes?: string;
      purchased: boolean;
    },
  ) => Promise<boolean>;
  toggleItemPurchased: (itemId: number, purchased: boolean) => Promise<boolean>;
  removeItem: (itemId: number) => Promise<boolean>;
  archiveActiveList: () => Promise<boolean>;
  restoreList: (listId: number) => Promise<boolean>;
  deleteList: (listId: number) => Promise<boolean>;
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
  const [activeLists, setActiveLists] = useState<ShoppingList[]>([]);
  const [archivedLists, setArchivedLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { showSnackbar } = useSnackbar();

  const refreshAll = useCallback(
    async (preferredActiveId?: number | null) => {
      const [active, archived] = await Promise.all([
        getActiveShoppingLists(),
        getArchivedShoppingLists(),
      ]);
      setActiveLists(active);
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
    async (
      fn: () => Promise<void>,
      getPreferredActiveId?: () => number | null,
    ): Promise<boolean> => {
      setLoading(true);
      try {
        await fn();
        const preferredActiveId = getPreferredActiveId
          ? getPreferredActiveId()
          : undefined;
        await refreshAll(preferredActiveId);
        return true;
      } catch (error) {
        console.error('Erro ao executar operação', error);
        const message =
          error instanceof Error
            ? error.message
            : 'Não foi possível concluir a operação.';
        showSnackbar(message, 'error');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [refreshAll, showSnackbar],
  );

  const createNewList = useCallback(
    async (name: string) => {
      return withLoading(async () => {
        await createShoppingList(name);
      });
    },
    [withLoading],
  );

  const createListFromSuggestionHandler = useCallback(
    async (suggestion: ShoppingListSuggestion) => {
      let createdListId: number | null = null;
      return withLoading(
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
        showSnackbar('Nenhuma lista ativa disponível.', 'error');
        return false;
      }
      return withLoading(
        async () => {
          await createCategory(activeList.id, name);
        },
        () => activeList.id,
      );
    },
    [activeList, showSnackbar, withLoading],
  );

  const renameCategory = useCallback(
    async (categoryId: number, name: string) => {
      return withLoading(
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
      return withLoading(
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
      return withLoading(
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
      return withLoading(
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
        showSnackbar('Item não encontrado na lista selecionada.', 'error');
        return false;
      }
      return updateItem(itemId, {
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes ?? undefined,
        purchased,
      });
    },
    [activeList, showSnackbar, updateItem],
  );

  const removeItem = useCallback(
    async (itemId: number) => {
      return withLoading(
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
      showSnackbar('Nenhuma lista ativa para arquivar.', 'error');
      return false;
    }
    return withLoading(async () => {
      await archiveShoppingList(activeList.id);
    });
  }, [activeList, showSnackbar, withLoading]);

  const restoreList = useCallback(
    async (listId: number) => {
      return withLoading(
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
      return withLoading(async () => {
        await deleteShoppingList(listId);
      });
    },
    [withLoading],
  );

  const selectActiveList = useCallback(
    async (listId: number) => {
      return withLoading(
        async () => {},
        () => listId,
      );
    },
    [withLoading],
  );

  const refresh = useCallback(async () => {
    return withLoading(async () => {});
  }, [withLoading]);

  const value = useMemo<ShoppingListContextValue>(
    () => ({
      loading,
      activeList,
      activeLists,
      archivedLists,
      total,
      refresh,
      createNewList,
      createListFromSuggestion: createListFromSuggestionHandler,
      selectActiveList,
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
      activeLists,
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
      selectActiveList,
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
