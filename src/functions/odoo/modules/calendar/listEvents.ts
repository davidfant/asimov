import { z } from 'zod';
import { Function } from 'asimov/types';
import { OdooAPI } from 'asimov/functions/odoo/api';
import dayjs from 'dayjs';
import { eventSchema, toEvent } from './types';

const inputSchema = z.object({
  startDate: z.string().describe('YYYY-MM-DD'),
  endDate: z.string().describe('YYYY-MM-DD'),
});

const outputSchema = z.object({
  events: z.array(eventSchema),
});

export type Input = z.infer<typeof inputSchema>;
export type Output = z.infer<typeof outputSchema>;


export const listEvents: Function<typeof inputSchema, typeof outputSchema> = {
  name: 'List Calendar Events',
  slug: 'listCalendarEvents',
  description: 'List events in Odoo Calendar',
  icon: 'http://localhost:8069/calendar/static/description/icon.png',
  inputSchema,
  outputSchema,
  async call(input) {
    const odoo = new OdooAPI();
    const startDate = dayjs(input.startDate).startOf('day').format('YYYY-MM-DD HH:mm:ss');
    const endDate = dayjs(input.endDate).endOf('day').format('YYYY-MM-DD HH:mm:ss');
    const results = await odoo.searchRead(
      'calendar.event',
      ['id', 'display_name', 'description', 'start', 'stop', 'partner_ids', 'allday'],
      [
        { field: 'start', op: '>=', value: startDate },
        { field: 'stop', op: '<', value: endDate },
      ],
    );
    const events = await Promise.all(results.map(r => toEvent(r, odoo)));
    return { events }
  },
};
