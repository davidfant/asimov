import { Function } from '../../src';
 
export const add: Function<{ a: number; b: number }, { result: number }> = {
  slug: 'add',
  name: 'Add two numbers',
  description: 'Add two numbers',
  call: ({ a, b }) => Promise.resolve({ result: a + b }),
  inputSchema: {
    type: 'object',
    properties: {
      a: { type: 'number' },
      b: { type: 'number' },
    },
    required: ['a', 'b'],
  },
};
