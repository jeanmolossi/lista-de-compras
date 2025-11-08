import React from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useShoppingList } from '../store/ShoppingListProvider';

const formatDate = (value: string | null): string => {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString();
};

const ListHistoryScreen = (): JSX.Element => {
  const { archivedLists, restoreList, deleteList } = useShoppingList();

  const handleRestore = (id: number, name: string) => {
    Alert.alert('Restaurar lista', `Deseja restaurar "${name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Restaurar',
        onPress: () => restoreList(id),
      },
    ]);
  };

  const handleDelete = (id: number, name: string) => {
    Alert.alert('Excluir lista', `Deseja excluir definitivamente "${name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => deleteList(id),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {archivedLists.length === 0 ? (
        <Text style={styles.emptyState}>Nenhuma lista arquivada até o momento.</Text>
      ) : (
        <FlatList
          data={archivedLists}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.title}>{item.name}</Text>
              <Text style={styles.subtitle}>
                Finalizada em {formatDate(item.archivedAt)}
              </Text>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => handleRestore(item.id, item.name)}>
                  <Text style={styles.link}>Restaurar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id, item.name)}>
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
    backgroundColor: '#f6f6f6',
    padding: 20,
  },
  emptyState: {
    marginTop: 32,
    textAlign: 'center',
    color: '#627d98',
    fontSize: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 18,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#102a43',
  },
  subtitle: {
    fontSize: 14,
    color: '#486581',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  link: {
    color: '#1f7a8c',
    fontWeight: '500',
    marginLeft: 16,
  },
  delete: {
    color: '#d64545',
  },
});

export default ListHistoryScreen;
