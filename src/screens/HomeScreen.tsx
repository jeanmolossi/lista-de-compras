import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import CategorySection from '../components/CategorySection';
import ItemModal from '../components/ItemModal';
import PrimaryButton from '../components/PrimaryButton';
import { useShoppingList } from '../store/ShoppingListProvider';
import { ShoppingItem } from '../store/types';
import { RootStackParamList } from '../app/RootNavigator';

const HomeScreen = (): JSX.Element => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    activeList,
    total,
    loading,
    addItem,
    updateItem,
    toggleItemPurchased,
    removeItem,
    archiveActiveList,
  } = useShoppingList();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);

  const formattedTotal = useMemo(() => `R$ ${total.toFixed(2)}`, [total]);

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
      return;
    }
    if (editingItem) {
      await updateItem(editingItem.id, data);
    } else {
      await addItem(selectedCategoryId, data);
    }
    closeModal();
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.hero}>
          <Text style={styles.title}>Crie uma lista de compras com IA</Text>
          <Text style={styles.subtitle}>
            Gere listas inteligentes com o assistente, organize por categorias e acompanhe
            seus gastos.
          </Text>
          <PrimaryButton
            title="Gerar com IA"
            onPress={() => navigation.navigate('Chat')}
            style={styles.heroButton}
            variant="secondary"
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sua lista atual</Text>
          <TouchableOpacity onPress={() => navigation.navigate('CategoryManagement')}>
            <Text style={styles.link}>Gerenciar categorias</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#1f7a8c" style={styles.loading} />
        ) : !activeList ? (
          <Text style={styles.emptyState}>
            Nenhuma lista ativa. Gere uma lista com IA ou crie manualmente pelas
            categorias.
          </Text>
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

      <View style={styles.footer}>
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Total estimado</Text>
          <Text style={styles.totalValue}>{formattedTotal}</Text>
        </View>
        <PrimaryButton
          title="Finalizar compra"
          onPress={() => archiveActiveList()}
          disabled={!activeList || loading}
          style={styles.finishButton}
        />
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => navigation.navigate('ListHistory')}
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
  totalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    color: '#486581',
    fontSize: 16,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#102a43',
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
