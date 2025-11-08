import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

type SnackbarType = 'info' | 'error';

type SnackbarContextValue = {
  showSnackbar: (message: string, type?: SnackbarType) => void;
};

type SnackbarState = {
  id: number;
  message: string;
  type: SnackbarType;
};

const SnackbarContext = createContext<SnackbarContextValue | undefined>(undefined);

const SnackbarProvider = ({ children }: { children: React.ReactNode }): JSX.Element => {
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const hideSnackbar = useCallback(() => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setSnackbar(null);
    });
  }, [opacity]);

  const showSnackbar = useCallback<SnackbarContextValue['showSnackbar']>(
    (message, type = 'info') => {
      if (!message) {
        return;
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      const nextSnackbar: SnackbarState = {
        id: Date.now(),
        message,
        type,
      };

      setSnackbar(nextSnackbar);

      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      timeoutRef.current = setTimeout(() => {
        hideSnackbar();
      }, 4000);
    },
    [hideSnackbar, opacity],
  );

  const value = useMemo<SnackbarContextValue>(
    () => ({
      showSnackbar,
    }),
    [showSnackbar],
  );

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      {snackbar ? (
        <Animated.View
          style={[
            styles.container,
            snackbar.type === 'error' ? styles.error : styles.info,
            { opacity },
          ]}
          pointerEvents="none"
        >
          <View style={styles.content}>
            <Text style={styles.message}>{snackbar.message}</Text>
          </View>
        </Animated.View>
      ) : null}
    </SnackbarContext.Provider>
  );
};

export const useSnackbar = (): SnackbarContextValue => {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar deve ser usado dentro de SnackbarProvider');
  }
  return context;
};

export { SnackbarProvider };

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 32,
    left: 16,
    right: 16,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  message: {
    color: '#ffffff',
    fontSize: 15,
    flex: 1,
  },
  info: {
    backgroundColor: '#1f7a8c',
  },
  error: {
    backgroundColor: '#d64545',
  },
});
