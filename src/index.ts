import { search } from './functions/wikipedia/search';
import { readPage } from './functions/wikipedia/readPage';


export * from './asimov';
export * from './types';

export const functions = {
  wikipedia: { search, readPage },
};
