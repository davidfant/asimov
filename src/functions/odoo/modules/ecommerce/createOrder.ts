import { z } from 'zod';
import { Function } from 'asimov/types';
import { OdooAPI, OdooCommand } from 'asimov/functions/odoo/api';


const inputSchema = z.object({
  customerId: z.number(),
  lineItems: z.array(z.object({
    productId: z.number(),
    quantity: z.number(),
  })),
});

const outputSchema = z.object({
  orderId: z.number(),
});

export type Input = z.infer<typeof inputSchema>;
export type Output = z.infer<typeof outputSchema>;


export const createOrder: Function<typeof inputSchema, typeof outputSchema> = {
  name: 'Create Order',
  slug: 'createOrder',
  description: 'Create order in Odoo eCommerce',
  icon: 'http://localhost:8069/website_sale/static/description/icon.png',
  inputSchema,
  outputSchema,
  async call(input) {
    const odoo = new OdooAPI();
    // see command[1] here: https://github.com/odoo/odoo/blob/20ddb74a8aefbde137f5c47a769f26ec8a4f7113/odoo/fields.py#L4186
    const ref = `virtual_${Math.round(Date.now() / 1000)}`;
    const record = await odoo.create(
      'sale.order',
      {
        order_line: input.lineItems.map((li) => [OdooCommand.CREATE, ref, {
          name: `Product ${li.productId}`,
          product_id: li.productId,
          product_uom_qty: li.quantity,
        }]),
        partner_id: input.customerId,
        state: 'sale',
      },
      ['id'],
    );

    return { orderId: record['id'] };
  },
};
