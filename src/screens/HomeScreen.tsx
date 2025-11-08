import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  LayoutChangeEvent,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import CategorySection from '../components/CategorySection';
import ItemModal from '../components/ItemModal';
import PrimaryButton from '../components/PrimaryButton';
import { useShoppingList } from '../store/ShoppingListProvider';
import { ShoppingItem } from '../store/types';
import { useSnackbar } from '../store/SnackbarProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HomeScreen = (): JSX.Element => {
  const router = useRouter();
  const {
    activeList,
    activeLists,
    total,
    purchasedTotal,
    loading,
    addItem,
    updateItem,
    toggleItemPurchased,
    removeItem,
    archiveActiveList,
    createNewList,
    selectActiveList,
  } = useShoppingList();
  const { showSnackbar } = useSnackbar();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [manualListName, setManualListName] = useState('');
  const [footerHeight, setFooterHeight] = useState(0);
  const insets = useSafeAreaInsets();

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
      }),
    [],
  );

  const formattedEstimatedTotal = useMemo(
    () => currencyFormatter.format(total),
    [currencyFormatter, total],
  );

  const formattedPurchasedTotal = useMemo(
    () => currencyFormatter.format(purchasedTotal),
    [currencyFormatter, purchasedTotal],
  );

  const openModalToAdd = (categoryId: number) => {
    setSelectedCategoryId(categoryId);
    setEditingItem(null);
    setModalVisible(true);
  };

  const openModalToEdit = (item: ShoppingItem) => {
    setSelectedCategoryId(item.categoryId);
    setEditingItem(item);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedCategoryId(null);
    setEditingItem(null);
  };

  const handleSubmitItem = async (data: {
    name: string;
    quantity: number;
    price: number;
    notes?: string;
    purchased: boolean;
  }) => {
    if (!selectedCategoryId) {
      showSnackbar('Selecione uma categoria válida para adicionar o item.', 'error');
      return;
    }
    if (editingItem) {
      const success = await updateItem(editingItem.id, data);
      if (!success) {
        return;
      }
    } else {
      const success = await addItem(selectedCategoryId, data);
      if (!success) {
        return;
      }
    }
    closeModal();
  };

  const handleCreateManualList = async () => {
    const trimmedName = manualListName.trim();
    const success = await createNewList(
      trimmedName.length > 0 ? trimmedName : 'Lista manual',
    );
    if (success) {
      setManualListName('');
    }
  };

  const handleSelectList = useCallback(
    (listId: number) => {
      if (listId === activeList?.id) {
        return;
      }
      selectActiveList(listId).catch(() => undefined);
    },
    [activeList?.id, selectActiveList],
  );

  const handleFooterLayout = useCallback((event: LayoutChangeEvent) => {
    const {
      nativeEvent: {
        layout: { height },
      },
    } = event;

    setFooterHeight((currentHeight) =>
      currentHeight === height ? currentHeight : height,
    );
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(footerHeight + insets.bottom + 24, 120) },
        ]}
      >
        <View style={styles.hero}>
          <Text style={styles.title}>Crie uma lista de compras com IA</Text>
          <Text style={styles.subtitle}>
            Gere listas inteligentes com o assistente, organize por categorias e acompanhe
            seus gastos.
          </Text>
          <PrimaryButton
            title="Gerar com IA"
            onPress={() => router.push('/chat')}
            style={styles.heroButton}
            variant="secondary"
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sua lista atual</Text>
          <TouchableOpacity onPress={() => router.push('/categories')}>
            <Text style={styles.link}>Gerenciar categorias</Text>
          </TouchableOpacity>
        </View>

        {activeLists.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listChipsContainer}
            style={styles.listChipsScroll}
          >
            {activeLists.map((list) => {
              const isSelected = list.id === activeList?.id;
              return (
                <TouchableOpacity
                  key={list.id}
                  style={[styles.listChip, isSelected && styles.listChipSelected]}
                  onPress={() => handleSelectList(list.id)}
                  disabled={isSelected || loading}
                >
                  <Text
                    style={[
                      styles.listChipText,
                      isSelected && styles.listChipTextSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {list.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {loading ? (
          <ActivityIndicator size="large" color="#1f7a8c" style={styles.loading} />
        ) : !activeList ? (
          <View style={styles.manualCreateContainer}>
            <Text style={[styles.emptyState, styles.manualMessage]}>
              Nenhuma lista ativa. Gere uma lista com IA ou crie uma lista manual para
              adicionar categorias e itens.
            </Text>
            <TextInput
              style={styles.manualInput}
              placeholder="Nome da nova lista"
              value={manualListName}
              onChangeText={setManualListName}
              editable={!loading}
              accessibilityLabel="Nome da lista manual"
            />
            <PrimaryButton
              title="Criar lista manual"
              onPress={handleCreateManualList}
              disabled={loading}
              style={styles.manualButton}
            />
          </View>
        ) : activeList.categories.length === 0 ? (
          <Text style={styles.emptyState}>
            Sua lista está vazia. Comece adicionando categorias e itens.
          </Text>
        ) : (
          activeList.categories.map((category) => (
            <CategorySection
              key={category.id}
              category={category}
              onAddItem={openModalToAdd}
              onEditItem={openModalToEdit}
              onToggleItem={toggleItemPurchased}
              onRemoveItem={removeItem}
            />
          ))
        )}
      </ScrollView>

      <View style={styles.footer} onLayout={handleFooterLayout}>
        <View style={styles.totalsContainer}>
          <View style={styles.purchasedTotalBox}>
            <Text style={styles.purchasedTotalLabel}>Total comprado</Text>
            <Text style={styles.purchasedTotalValue}>{formattedPurchasedTotal}</Text>
          </View>
          <Text style={styles.estimatedTotalText}>
            Total estimado:{' '}
            <Text style={styles.estimatedTotalValue}>{formattedEstimatedTotal}</Text>
          </Text>
        </View>
        <PrimaryButton
          title="Finalizar compra"
          onPress={() => {
            archiveActiveList().catch(() => undefined);
          }}
          disabled={!activeList || loading}
          style={styles.finishButton}
        />
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => router.push('/history')}
        >
          <Text style={styles.link}>Ver histórico de compras</Text>
        </TouchableOpacity>
      </View>

      <ItemModal
        visible={modalVisible}
        title={editingItem ? 'Editar item' : 'Adicionar item'}
        onClose={closeModal}
        onSubmit={handleSubmitItem}
        initialValues={editingItem ?? undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f6f6',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  manualCreateContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },
  listChipsScroll: {
    marginBottom: 16,
  },
  listChipsContainer: {
    paddingHorizontal: 4,
    columnGap: 8,
  },
  listChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1f7a8c',
    backgroundColor: '#ffffff',
  },
  listChipSelected: {
    backgroundColor: '#1f7a8c',
  },
  listChipText: {
    color: '#1f7a8c',
    fontWeight: '600',
  },
  listChipTextSelected: {
    color: '#ffffff',
  },
  hero: {
    backgroundColor: '#1f7a8c',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: '#e0f2f1',
    fontSize: 16,
    marginBottom: 16,
  },
  heroButton: {
    backgroundColor: '#ffffff',
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#102a43',
  },
  link: {
    color: '#1f7a8c',
    fontWeight: '500',
  },
  loading: {
    marginTop: 32,
  },
  emptyState: {
    color: '#627d98',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 24,
  },
  manualInput: {
    borderWidth: 1,
    borderColor: '#d9e2ec',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f8f9fb',
    color: '#102a43',
    marginTop: 16,
  },
  manualButton: {
    marginTop: 16,
  },
  manualMessage: {
    marginTop: 0,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 12,
    elevation: 10,
  },
  totalsContainer: {
    marginBottom: 12,
  },
  purchasedTotalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  purchasedTotalLabel: {
    color: '#102a43',
    fontSize: 16,
    fontWeight: '600',
  },
  purchasedTotalValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#102a43',
  },
  estimatedTotalText: {
    marginTop: 6,
    color: '#486581',
    fontSize: 14,
  },
  estimatedTotalValue: {
    color: '#486581',
    fontWeight: '600',
  },
  historyButton: {
    alignItems: 'center',
    marginTop: 12,
  },
  finishButton: {
    marginTop: 16,
  },
});

export default HomeScreen;
