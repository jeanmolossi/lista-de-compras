import React from 'react';
import { Pressable, StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { ShoppingCategory, ShoppingItem } from '../store/types';

interface CategorySectionProps {
  category: ShoppingCategory;
  onAddItem: (categoryId: number) => void;
  onEditItem: (item: ShoppingItem) => void;
  onToggleItem: (itemId: number, purchased: boolean) => void;
  onRemoveItem: (itemId: number) => void;
}

const CategorySection = ({
  category,
  onAddItem,
  onEditItem,
  onToggleItem,
  onRemoveItem,
}: CategorySectionProps): JSX.Element => {
  const handleRemoveItem = (item: ShoppingItem) => {
    Alert.alert('Remover item', `Deseja remover ${item.name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => onRemoveItem(item.id),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{category.name}</Text>
        <TouchableOpacity onPress={() => onAddItem(category.id)}>
          <Text style={styles.actionText}>Adicionar item</Text>
        </TouchableOpacity>
      </View>
      {category.items.length === 0 ? (
        <Text style={styles.emptyMessage}>Nenhum item nesta categoria.</Text>
      ) : (
        category.items.map((item) => (
          <Pressable
            key={item.id}
            style={[styles.item, item.purchased && styles.itemPurchased]}
            onPress={() => onToggleItem(item.id, !item.purchased)}
          >
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDetails}>
                {item.quantity} x R$ {item.price.toFixed(2)}
              </Text>
            </View>
            <View style={styles.itemActions}>
              <TouchableOpacity onPress={() => onEditItem(item)}>
                <Text style={styles.linkText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleRemoveItem(item)}
                style={styles.deleteButton}
              >
                <Text style={[styles.linkText, styles.deleteText]}>Remover</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#102a43',
  },
  actionText: {
    color: '#1f7a8c',
    fontWeight: '500',
  },
  emptyMessage: {
    color: '#7b8794',
    fontStyle: 'italic',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#d9e2ec',
    paddingVertical: 12,
  },
  itemPurchased: {
    opacity: 0.6,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    color: '#102a43',
  },
  itemDetails: {
    fontSize: 14,
    color: '#486581',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkText: {
    color: '#1f7a8c',
    fontWeight: '500',
  },
  deleteText: {
    color: '#d64545',
  },
  deleteButton: {
    marginLeft: 12,
  },
});

export default CategorySection;
