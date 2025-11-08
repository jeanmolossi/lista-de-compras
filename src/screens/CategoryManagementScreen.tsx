import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import { useShoppingList } from '../store/ShoppingListProvider';
import { ShoppingCategory } from '../store/types';

const CategoryManagementScreen = (): JSX.Element => {
  const { activeList, addCategory, renameCategory, removeCategory } = useShoppingList();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editing, setEditing] = useState<Record<number, string>>({});

  const handleAddCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      return;
    }
    const success = await addCategory(trimmed);
    if (success) {
      setNewCategoryName('');
    }
  };

  const handleRename = async (category: ShoppingCategory) => {
    const value = editing[category.id]?.trim();
    if (!value || value === category.name) {
      return;
    }
    const success = await renameCategory(category.id, value);
    if (success) {
      setEditing((prev) => {
        const next = { ...prev };
        delete next[category.id];
        return next;
      });
    }
  };

  const confirmDelete = (categoryId: number, name: string) => {
    Alert.alert('Remover categoria', `Deseja remover ${name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => {
          removeCategory(categoryId).catch(() => undefined);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Categorias da lista</Text>
      <View style={styles.newCategoryRow}>
        <TextInput
          value={newCategoryName}
          onChangeText={setNewCategoryName}
          placeholder="Nova categoria"
          style={styles.input}
        />
        <PrimaryButton
          title="Adicionar"
          onPress={handleAddCategory}
          style={styles.addButton}
        />
      </View>

      {!activeList || activeList.categories.length === 0 ? (
        <Text style={styles.emptyState}>Nenhuma categoria cadastrada.</Text>
      ) : (
        <FlatList
          data={activeList.categories}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={styles.categoryItem}>
              <TextInput
                style={styles.categoryInput}
                value={editing[item.id] ?? item.name}
                onChangeText={(text) =>
                  setEditing((prev) => ({ ...prev, [item.id]: text }))
                }
                onEndEditing={() => {
                  handleRename(item).catch(() => undefined);
                }}
              />
              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={() => {
                    handleRename(item).catch(() => undefined);
                  }}
                >
                  <Text style={styles.link}>Salvar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    confirmDelete(item.id, item.name);
                  }}
                >
                  <Text style={[styles.link, styles.delete]}>Excluir</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f6f6f6',
  },
  header: {
    fontSize: 20,
    fontWeight: '700',
    color: '#102a43',
    marginBottom: 16,
  },
  newCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d9e2ec',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    marginRight: 12,
  },
  addButton: {
    paddingHorizontal: 16,
  },
  emptyState: {
    color: '#627d98',
    fontSize: 16,
    marginTop: 24,
  },
  categoryItem: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
  },
  categoryInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#d9e2ec',
    paddingVertical: 8,
    marginBottom: 12,
    color: '#102a43',
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  link: {
    color: '#1f7a8c',
    fontWeight: '500',
    marginLeft: 12,
  },
  delete: {
    color: '#d64545',
  },
});

export default CategoryManagementScreen;
