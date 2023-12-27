import { z } from 'zod';
import { Function } from '../../src';

const inputSchema = z.object({
  a: z.number(),
  b: z.number(),
});

const outputSchema = z.object({
  result: z.number(),
});
 
export const add: Function<typeof inputSchema, typeof outputSchema> = {
  slug: 'add',
  name: 'Add two numbers',
  description: 'Add two numbers',
  inputSchema,
  outputSchema,
  call: ({ a, b }) => Promise.resolve({ result: a + b }),
};
