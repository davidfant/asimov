import { z } from 'zod';
import { Function } from 'asimov/types';
import { OdooAPI } from 'asimov/functions/odoo/api';


enum Stage {
  'new' = 1,
  'qualified' = 2,
  'proposition' = 3,
  'won' = 4,
}

const inputSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  website: z.string().optional(),
  stage: z.enum(['new', 'qualified', 'proposition', 'won']).optional(),
});

const outputSchema = z.object({
  leadId: z.number(),
});

export type Input = z.infer<typeof inputSchema>;
export type Output = z.infer<typeof outputSchema>;


export const createLead: Function<typeof inputSchema, typeof outputSchema> = {
  name: 'Create Lead',
  slug: 'createLead',
  description: 'Create lead in Odoo CRM',
  icon: 'http://localhost:8069/crm/static/description/icon.png',
  inputSchema,
  outputSchema,
  async call(input) {
    const odoo = new OdooAPI();
    const record = await odoo.create(
      'crm.lead',
      {
        name: input.name,
        description: input.description,
        website: input.website,
        stage_id: Stage[input.stage ?? Stage.new],
      },
      ['id'],
    );

    return { leadId: record['id'] };
  },
};
