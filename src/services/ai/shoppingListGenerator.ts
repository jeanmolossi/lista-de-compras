import Constants from 'expo-constants';
import { ChatMessage } from '../../store/ChatSessionProvider';
import { ShoppingListSuggestion } from '../../store/types';

type ExtraConfig = {
  openAiApiKey?: string;
};

const SYSTEM_PROMPT = `Você é um assistente que gera listas de compras detalhadas com base em toda a conversa do usuário.
Responda SOMENTE com JSON no seguinte formato:
{
  "name": "Nome da lista",
  "categories": [
    {
      "name": "Categoria",
      "items": [
        {
          "name": "Produto",
          "quantity": 1,
          "price": 0,
          "notes": "Observações opcionais"
        }
      ]
    }
  ]
}

Regras obrigatórias:
- Sempre converta quantidades de itens vendidos por peso para quilogramas com ponto decimal. Exemplo: "2,5 kg" -> quantity: 2.5 e price igual ao valor por quilo.
- Para itens vendidos em pacotes, a quantidade deve representar o número de pacotes e o preço deve ser o valor de cada pacote, mesmo que a descrição mencione o conteúdo interno.
- Para itens individuais (como frutas avulsas ou produtos unitários), a quantidade deve refletir o número de unidades e o preço deve ser o valor de uma unidade.
- Informe apenas preços unitários, nunca multiplique pelo total da quantidade.
- Crie novas categorias e itens conforme necessário, mesmo quando o usuário estiver começando do zero.
- Nunca inclua nenhum texto fora do JSON.`;
const GENERAL_PROMPT = `Você é um assistente especializado em planejamento de compras. Conduza uma conversa cordial, faça perguntas apenas quando informações essenciais estiverem faltando e compartilhe dicas úteis. Se o usuário indicar que já forneceu o necessário ou solicitar que a lista seja gerada, responda confirmando e siga o pedido sem insistir em novas perguntas.`;

type ChatCompletionMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

const getApiKey = (): string => {
  const extra = (Constants.expoConfig?.extra ?? {}) as ExtraConfig;
  const apiKey = extra.openAiApiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'OPENAI_API_KEY não configurada. Defina a variável antes de usar o chat.',
    );
  }
  return apiKey;
};

const mapConversationToMessages = (
  conversation: ChatMessage[],
): ChatCompletionMessage[] =>
  conversation.map((message) => ({ role: message.sender, content: message.text }));

const parseContent = (content: unknown): string => {
  if (!content) {
    return '';
  }
  if (typeof content === 'string') {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') {
          return part;
        }
        if (typeof part === 'object' && part && 'text' in part) {
          return String((part as { text?: string }).text ?? '');
        }
        return '';
      })
      .join('');
  }
  return '';
};

const requestChatCompletion = async (
  messages: ChatCompletionMessage[],
  responseFormat?: 'json_object' | 'text',
): Promise<string> => {
  const apiKey = getApiKey();
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      ...(responseFormat ? { response_format: { type: responseFormat } } : {}),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro na API da OpenAI: ${errorText}`);
  }

  const data = await response.json();
  const content = parseContent(data.choices?.[0]?.message?.content);
  if (!content) {
    throw new Error('Resposta inválida da API da OpenAI.');
  }
  return content;
};

export const getAssistantReply = async (conversation: ChatMessage[]): Promise<string> => {
  const messages: ChatCompletionMessage[] = [
    { role: 'system', content: GENERAL_PROMPT },
    ...mapConversationToMessages(conversation),
  ];
  return requestChatCompletion(messages, 'text');
};

export const generateShoppingListFromConversation = async (
  conversation: ChatMessage[],
): Promise<ShoppingListSuggestion> => {
  const messages: ChatCompletionMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...mapConversationToMessages(conversation),
  ];
  const content = await requestChatCompletion(messages, 'json_object');
  try {
    const suggestion = JSON.parse(content) as ShoppingListSuggestion;
    return suggestion;
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Não foi possível interpretar a resposta da IA: ${error.message}`
        : 'Não foi possível interpretar a resposta da IA.',
    );
  }
};
