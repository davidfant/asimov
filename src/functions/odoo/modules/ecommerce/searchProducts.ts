import { z } from 'zod';
import { Function } from 'asimov/types';
import { OdooAPI, OdooSearchFilter } from 'asimov/functions/odoo/api';


const inputSchema = z.object({
  query: z.string().nullable(),
});

const outputSchema = z.object({
  products: z.array(z.object({
    id: z.number(),
    name: z.string(),
    description: z.string(),
    price: z.number(),
    available: z.boolean(),
  })),
});

export type Input = z.infer<typeof inputSchema>;
export type Output = z.infer<typeof outputSchema>;


export const searchProducts: Function<typeof inputSchema, typeof outputSchema> = {
  name: 'Search Products',
  slug: 'searchProducts',
  description: 'Search products by name',
  icon: 'http://localhost:8069/website_sale/static/description/icon.png',
  inputSchema,
  outputSchema,
  async call(input) {
    const odoo = new OdooAPI();
    const filters: OdooSearchFilter[] = [
      { field: 'type', op: 'in', value: ['product', 'consu'] },
      { field: 'is_published', op: '=', value: true },
    ];
    if (!!input.query) {
      filters.push({ field: 'name', op: 'ilike', value: input.query });
    }

    const results = await odoo.searchRead(
      'product.template',
      ['name', 'description', 'list_price', 'purchase_ok'],
      filters,
    );

    return {
      products: results.map(product => ({
        id: product['id'],
        name: product['name'],
        description: product['description'] || '',
        price: product['list_price'],
        available: !!product['purchase_ok'],
      })),
    };
  },
};
