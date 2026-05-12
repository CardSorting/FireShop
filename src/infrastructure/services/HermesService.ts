/**
 * [LAYER: INFRASTRUCTURE]
 * Hermes Service for AI-powered completions.
 * Connects to a local or remote Hermes gateway (OpenAI-compatible).
 */
import { ChatMessage, ClientChatMessage } from '@domain/concierge/types';
import { CONCIERGE_SYSTEM_PROMPT } from '@domain/concierge/systemPrompt';

export class HermesConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HermesConfigurationError';
  }
}

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const getHermesConfig = () => {
  const baseUrl = process.env.HERMES_API_BASE_URL || 'http://127.0.0.1:8642/v1';
  const apiKey = process.env.HERMES_API_KEY || 'local-dev-key';
  const model = process.env.HERMES_MODEL || 'hermes-agent';

  return {
    apiBaseUrl: trimTrailingSlash(baseUrl),
    apiKey,
    model,
  };
};

export async function createHermesChatCompletionStream(
  messages: ClientChatMessage[],
  systemPrompt?: string,
  contextString?: string
) {
  const config = getHermesConfig();
  
  const fullPrompt = `${systemPrompt || CONCIERGE_SYSTEM_PROMPT}

${contextString ? `### CURRENT CONTEXT\n${contextString}` : ''}
`;

  const requestMessages: ChatMessage[] = [
    { role: 'system', content: fullPrompt },
    ...messages,
  ];

  const res = await fetch(`${config.apiBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      stream: true,
      messages: requestMessages,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error');
    throw new Error(`Hermes API error (${res.status}): ${errorText}`);
  }

  return res;
}

export async function createHermesChatCompletion(
  messages: ClientChatMessage[],
  systemPrompt?: string,
  contextString?: string
) {
  const config = getHermesConfig();
  
  const fullPrompt = `${systemPrompt || CONCIERGE_SYSTEM_PROMPT}

${contextString ? `### CURRENT CONTEXT\n${contextString}` : ''}
`;

  const requestMessages: ChatMessage[] = [
    { role: 'system', content: fullPrompt },
    ...messages,
  ];

  const res = await fetch(`${config.apiBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      stream: false,
      messages: requestMessages,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error');
    throw new Error(`Hermes API error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}
