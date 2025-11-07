# Projeto Lista de Compras

## Convenções Gerais

- Utilize TypeScript e Expo SDK 54 com React Navigation.
- Prefira componentes funcionais com hooks.
- Centralize estados compartilhados em contextos ou stores dentro de `src/store`.
- Mantenha os repositórios de banco em `src/database` sem lógica de UI.
- Configure ESLint/Prettier e garanta que `npm run lint` esteja sem erros antes de finalizar alterações.
- Documente comandos relevantes no `README.md`.

## Dependências Alvo

Certifique-se de alinhar as versões principais do app com as bibliotecas a seguir sempre que atualizar o projeto:

- `@expo/vector-icons@^15.0.3`
- `@react-navigation/bottom-tabs@^7.4.0`
- `@react-navigation/elements@^2.6.3`
- `@react-navigation/native@^7.1.8`
- `expo@~54.0.22`
- `expo-constants@~18.0.10`
- `expo-font@~14.0.9`
- `expo-haptics@~15.0.7`
- `expo-image@~3.0.10`
- `expo-linking@~8.0.8`
- `expo-router@~6.0.14`
- `expo-splash-screen@~31.0.10`
- `expo-status-bar@~3.0.8`
- `expo-symbols@~1.0.7`
- `expo-system-ui@~6.0.8`
- `expo-web-browser@~15.0.9`
- `react@19.1.0`
- `react-dom@19.1.0`
- `react-native@0.81.5`
- `react-native-gesture-handler@~2.28.0`
- `react-native-worklets@0.5.1`
- `react-native-reanimated@~4.1.1`
- `react-native-safe-area-context@~5.6.0`
- `react-native-screens@~4.16.0`
- `react-native-web@~0.21.0`

## Fluxo de Trabalho

1. Atualize este arquivo caso novas convenções sejam necessárias.
2. Execute testes e lint aplicáveis antes de abrir PR.
3. Inclua citações nos resumos conforme instruções globais.
