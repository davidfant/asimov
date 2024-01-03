import { z } from 'zod';
import { Function } from 'asimov/types';
import { OdooAPI } from 'asimov/functions/odoo/api';

const address = z.object({
  street: z.string(),
  city: z.string(),
  zip: z.string(),
});

const inputSchema = z.object({
  name: z.string(),
  address: address.optional(),
});

const outputSchema = z.object({
  customer: z.object({
    id: z.number(),
    name: z.string(),
    address: address.optional(),
  }),
});

export type Input = z.infer<typeof inputSchema>;
export type Output = z.infer<typeof outputSchema>;


export const createCustomer: Function<typeof inputSchema, typeof outputSchema> = {
  name: 'Create Customer',
  slug: 'createCustomer',
  description: 'Create customer in Odoo eCommerce',
  icon: 'http://localhost:8069/website_sale/static/description/icon.png',
  inputSchema,
  outputSchema,
  async call(input) {
    const odoo = new OdooAPI();
    const record = await odoo.create(
      'res.partner',
      {
        name: input.name,
        street: input.address?.street || false,
        city: input.address?.city || false,
        zip: input.address?.zip || false,
      },
      ['id', 'name', 'street', 'city', 'zip'],
    );

    return {
      customer: {
        id: record['id'],
        name: record['name'],
        address: record['street'] && record['city'] && record['zip'] ? {
          street: record['street'],
          city: record['city'],
          zip: record['zip'],
        } : undefined,
      },
    };
  },
};
