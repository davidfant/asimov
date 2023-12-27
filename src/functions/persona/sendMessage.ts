import { z } from 'zod';
import pino from 'pino';
import { Function } from 'asimov/types';
import { createCompletion } from 'asimov/util/openai';
import { ChatCompletionMessageParam } from 'openai/resources';

const logger = pino({ name: 'persona' });

const inputSchema = z.object({
  message: z.string(),
}).required();

const outputSchema = z.object({
  message: z.string().nullable(),
});

export type Input = z.infer<typeof inputSchema>;
export type Output = z.infer<typeof outputSchema>;

interface Context {
  persona: string;
  history: { source: 'input' | 'output'; message: string }[];
}

interface PersonaResponse {
  reasoning: string;
  message: string | null;
}

async function sendMessageCall(input: Input, context: Context): Promise<Output> {
  context.history?.push({ source: 'input', message: input.message });

  const completion = await createCompletion({
    messages: [
      {
        role: 'system',
        content: `You are role playing the following persona: ${context.persona}. Use the process function to either respond with a message or not when someone sends you a message. Make sure to closely follow the persona.`,
      },
      ...context.history.map(({ source, message }): ChatCompletionMessageParam => ({
        role: source === 'input' ? 'user' : 'assistant',
        content: message,
      })),
    ],
    tools: [
      {
        type: 'function',
        function: {
          name: 'process',
          description: 'Process a message by either responding with a message or not.',
          parameters: {
            type: 'object',
            properties: {
              reasoning: { type: 'string' },
              message: { type: ['string', 'null'] },
            },
            required: ['reasoning', 'message'],
          },
        },
      },
    ],
    model: 'gpt-4-1106-preview',
    tool_choice: { type: 'function', function: { name: 'process' } },
  });

  try {
    const args = completion.choices[0].message.tool_calls?.[0].function.arguments;
    if (!args) throw new Error('No args')
    const response: PersonaResponse = JSON.parse(args);
    logger.debug({ response }, 'Persona Response');

    if (!!response.message) {
      context.history.push({ source: 'output', message: response.message });
    }

    return { message: response.message };
  } catch (error) {
    logger.error({ completion, error }, 'Failed to parse persona response');
    throw error;
  }
}

export function sendMessageWithContext(persona: string, history: Context['history'] = []): Function<typeof inputSchema, typeof outputSchema> {
  const context: Context = { persona, history };
  return {
    name: 'Send Message',
    slug: 'send_message',
    description: 'Send a message',
    inputSchema,
    outputSchema,
    call: (input: Input) => sendMessageCall(input, context),
  };
}

export const sendMessage = sendMessageWithContext('Helpful assistant');
