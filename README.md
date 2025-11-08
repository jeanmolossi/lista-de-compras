# Lista de Compras IA

Aplicativo Expo que organiza listas de compras por categorias, calcula totais e integra com a API da OpenAI para gerar listas automaticamente.

## Requisitos

- Node.js 18+
- npm 9+
- Expo CLI (instalado automaticamente via `npx`)

## Configuração

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Configure a chave da OpenAI criando um arquivo `.env` na raiz do projeto (ou exportando a variável no seu terminal):

   ```bash
   echo "OPENAI_API_KEY=chave_da_openai" > .env
   ```

   A chave também pode ser definida diretamente no ambiente antes de executar o app.

3. Inicie o app:

   ```bash
   npm start
   ```

   Use o Expo Go ou um emulador para visualizar o aplicativo.

## Scripts

- `npm start`: inicia o bundler do Expo.
- `npm run android`: gera e instala o aplicativo em um dispositivo/emulador Android.
- `npm run ios`: gera e instala o aplicativo em um simulador iOS.
- `npm run web`: abre a versão web no navegador.
- `npm run lint`: executa o ESLint.
- `npm run format`: formata os arquivos com Prettier.

> Sempre execute `npm run lint` antes de enviar alterações.

## Estrutura do projeto

```
App.tsx
src/
  app/RootNavigator.tsx           # Navegação principal (Stack)
  components/                     # Componentes reutilizáveis (botões, modais, chat)
  screens/                        # Telas da aplicação
  store/                          # Contexto global de listas (ShoppingListProvider)
  database/                       # Conexão SQLite e repositórios
  services/ai/                    # Integração com OpenAI
```

As tabelas locais SQLite incluem `shopping_lists`, `categories` e `items`, com migração automática na inicialização do app.

## Desenvolvimento

- Utilize o `ShoppingListProvider` para acessar e manipular dados de listas, categorias e itens em qualquer tela.
- A tela de chat cria listas automaticamente a partir das respostas da OpenAI, preenchendo categorias e itens.
- O botão **Finalizar compra** arquiva a lista ativa, permitindo restauração ou exclusão no histórico.

## Boas práticas

- Siga a formatação automática (`npm run format`).
- Resolva os apontamentos do ESLint (`npm run lint`).
- Atualize o `AGENTS.md` se novas convenções forem definidas.
