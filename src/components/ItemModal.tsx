import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import PrimaryButton from './PrimaryButton';

type ItemModalProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    quantity: number;
    price: number;
    notes?: string;
    purchased: boolean;
  }) => Promise<void> | void;
  initialValues?: {
    name?: string;
    quantity?: number;
    price?: number;
    notes?: string;
    purchased?: boolean;
  };
};

const ItemModal = ({
  visible,
  title,
  onClose,
  onSubmit,
  initialValues,
}: ItemModalProps) => {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [price, setPrice] = useState('0');
  const [notes, setNotes] = useState('');
  const [purchased, setPurchased] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(initialValues?.name ?? '');
      setQuantity(String(initialValues?.quantity ?? 1));
      setPrice(String(initialValues?.price ?? 0));
      setNotes(initialValues?.notes ?? '');
      setPurchased(Boolean(initialValues?.purchased));
    }
  }, [initialValues, visible]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      return;
    }
    const parsedQuantity = Number(quantity.replace(',', '.'));
    const parsedPrice = Number(price.replace(',', '.'));
    await onSubmit({
      name: name.trim(),
      quantity: Number.isNaN(parsedQuantity) ? 1 : parsedQuantity,
      price: Number.isNaN(parsedPrice) ? 0 : parsedPrice,
      notes: notes.trim().length ? notes.trim() : undefined,
      purchased,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.select({ ios: 16, android: 0 })}
          style={styles.wrapper}
        >
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
          <View style={styles.container}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.title}>{title}</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Nome do item"
              />
              <View style={styles.row}>
                <View style={[styles.rowItem, styles.rowItemSpacing]}>
                  <Text style={styles.label}>Quantidade</Text>
                  <TextInput
                    style={styles.input}
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.rowItem}>
                  <Text style={styles.label}>Preço</Text>
                  <TextInput
                    style={styles.input}
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
              <Text style={styles.label}>Observações</Text>
              <TextInput
                style={[styles.input, styles.notesInput]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Ex: marca preferida, tamanho"
                multiline
              />
              <View style={styles.switchRow}>
                <Text style={styles.label}>Item comprado</Text>
                <Switch value={purchased} onValueChange={setPurchased} />
              </View>
              <PrimaryButton
                title="Salvar"
                onPress={handleSubmit}
                style={styles.submitButton}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  wrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  container: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  content: {
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#102a43',
  },
  label: {
    fontSize: 14,
    color: '#334e68',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d9e2ec',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f8f9fb',
    color: '#102a43',
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    marginVertical: 12,
  },
  rowItem: {
    flex: 1,
  },
  rowItemSpacing: {
    marginRight: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  submitButton: {
    marginTop: 24,
  },
});

export default ItemModal;
