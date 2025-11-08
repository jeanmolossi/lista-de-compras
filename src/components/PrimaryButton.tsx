import React from 'react';
import {
  GestureResponderEvent,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';

type PrimaryButtonProps = {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  variant?: 'primary' | 'secondary';
};

const PrimaryButton = ({
  title,
  onPress,
  disabled = false,
  style,
  variant = 'primary',
}: PrimaryButtonProps) => {
  const isSecondary = variant === 'secondary';
  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        isSecondary && styles.buttonSecondary,
        disabled && styles.buttonDisabled,
        style,
      ]}
    >
      <Text style={[styles.text, isSecondary && styles.textSecondary]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#1f7a8c',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#1f7a8c',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  text: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  textSecondary: {
    color: '#1f7a8c',
  },
});

export default PrimaryButton;
