# Documento do Produto - Lista de Compras Inteligente

## Visão Geral
O aplicativo "Lista de Compras" ajuda usuários a planejar compras, gerar listas assistidas por IA e acompanhar histórico de listas concluídas. É construído com Expo, React Native e integrações com SQLite local para persistência offline.

## Objetivos Principais
- **Criação rápida de listas**: permitir que usuários montem listas manualmente ou através de sugestões automáticas vindas do assistente de IA.
- **Organização por categorias**: estruturar itens por categorias configuráveis, facilitando a navegação no supermercado.
- **Gestão de histórico**: registrar listas finalizadas para consulta posterior, com opção de restauração.

## Principais Funcionalidades
1. **Tela Inicial**
   - Mensagem de boas-vindas "Crie uma lista de compras com IA".
   - Visualização da lista ativa agrupada por categorias.
   - Botões para abrir o chat IA, gerenciar categorias e acessar histórico.
2. **Modal de Item**
   - Inclusão e edição de itens com preço, quantidade e categoria.
   - Cálculo automático do total acumulado da lista.
3. **Chat IA**
   - Interface de chat para solicitar sugestões de compras.
   - Integração com serviço `services/ai/shoppingListGenerator.ts` usando OpenAI.
   - Parseamento da resposta JSON para preencher listas no `ShoppingListProvider`.
4. **Gestão de Categorias**
   - CRUD completo de categorias através de `CategoryManagementScreen`.
5. **Histórico de Listas**
   - Exibição de listas arquivadas, com ações de restauração ou exclusão definitiva.

## Arquitetura Técnica
- **Camada de Dados**: SQLite via `expo-sqlite`, com repositórios em `src/database/` gerenciando tabelas `shopping_lists`, `categories` e `items`.
- **Camada de Estado**: Contexto `ShoppingListProvider` em `src/store/` controlando sincronização de operações e hooks de consumo.
- **Camada de UI**: componentes reutilizáveis em `src/components/` e telas em `src/screens/`.
- **Serviços de IA**: módulo `src/services/ai/` responsável por consumir a API da OpenAI.

## Dependências-Chave
- Expo SDK 54 com React Native 0.81.
- React Navigation 7 para navegação stack e tabs.
- Integrações expo para ícones, fontes, haptics, splash screen e web browser.
- OpenAI API para geração de listas inteligentes.

## Considerações de Experiência do Usuário
- Interface otimizada para dispositivos móveis com suporte a gestos (`react-native-gesture-handler`).
- Feedbacks táteis (Expo Haptics) para ações críticas.
- Temas e ícones consistentes usando `@expo/vector-icons` e `expo-system-ui`.

## Futuras Evoluções
- Sincronização em nuvem das listas para múltiplos dispositivos.
- Suporte a múltiplos perfis de usuário.
- Sugestões contextuais baseadas em histórico de compras e sazonalidade.
