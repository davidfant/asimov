import { search } from './functions/wikipedia/search';
import { readPage } from './functions/wikipedia/readPage';
import { sendMessage, sendMessageWithContext } from './functions/persona/sendMessage';


export * from './asimov';
export * from './types';

export const functions = {
  wikipedia: { search, readPage },
  persona: { sendMessage, sendMessageWithContext },
};
