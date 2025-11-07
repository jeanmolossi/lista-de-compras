import { ConfigContext, ExpoConfig } from 'expo/config';

type ExtraConfig = {
  openAiApiKey?: string;
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Lista de Compras IA',
  slug: 'lista-de-compras-ia',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  scheme: 'lista-de-compras',
  extra: {
    ...(config.extra as ExtraConfig),
    openAiApiKey: process.env.OPENAI_API_KEY,
  },
  ios: {
    supportsTablet: true,
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#ffffff',
    },
  },
  web: {
    bundler: 'metro',
    output: 'static',
  },
});
