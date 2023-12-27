import { z } from 'zod';
import { Function } from 'asimov/types';
import { OdooAPI, OdooCommand } from 'asimov/functions/odoo/api';
import { eventSchema, toEvent } from './types';


const inputSchema = z.object({
  name: z.string(),
  description: z.string(),
  attendeeIds: z.array(z.number()),
  startDate: z.string().describe('YYYY-MM-DD or YYYY-MM-DD HH:mm'),
  endDate: z.string().describe('YYYY-MM-DD or YYYY-MM-DD HH:mm'),
});

const outputSchema = z.object({
  event: eventSchema,
});

export type Input = z.infer<typeof inputSchema>;
export type Output = z.infer<typeof outputSchema>;


export const createEvent: Function<typeof inputSchema, typeof outputSchema> = {
  name: 'Create Calendar Event',
  slug: 'create_calendar_event',
  description: 'Create an event in Odoo Calendar',
  icon: 'http://localhost:8069/calendar/static/description/icon.png',
  inputSchema,
  outputSchema,
  async call(input) {
    const odoo = new OdooAPI();
    const event = await odoo.create(
      'calendar.event',
      {
        name: input.name,
        description: input.description,
        partner_ids: input.attendeeIds.map((id) => [OdooCommand.LINK, id]),
        start: input.startDate,
        stop: input.endDate,
      },
      ['id', 'display_name', 'description', 'start', 'stop', 'partner_ids', 'allday'],
    );

    return { event: await toEvent(event, odoo) };
  },
};
