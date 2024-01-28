import { search } from './functions/wikipedia/search';
import { readPage } from './functions/wikipedia/readPage';
import { listEvents } from './functions/odoo/modules/calendar/listEvents';
import { createEvent } from './functions/odoo/modules/calendar/createEvent';
import { createCustomer } from './functions/odoo/modules/ecommerce/createCustomer';
import { createOrder } from './functions/odoo/modules/ecommerce/createOrder';
import { searchProducts } from './functions/odoo/modules/ecommerce/searchProducts';
import { sendMessage, sendMessageWithContext } from './functions/persona/sendMessage';
import { createLead } from './functions/odoo/modules/crm/createLead';


export * from './asimov';
export * from './types';

export const functions = {
  wikipedia: { search, readPage },
  persona: { sendMessage, sendMessageWithContext },
  odoo: {
    calendar: { listEvents, createEvent },
    ecommerce: { createCustomer, createOrder, searchProducts },
    crm: { createLead },
  },
};
