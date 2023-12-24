import { Function } from '@asimov/types';
import { OdooAPI } from '@asimov/functions/odoo/api';
import dayjs from 'dayjs';
import { Event, toEvent } from './types';

interface Input {
  startDate: string; // format: 'YYYY-MM-DD'
  endDate: string; // format: 'YYYY-MM-DD'
}

interface Output {
  events: Event[];
}


export const listEvents: Function<Input, Output> = {
  name: 'List Calendar Events',
  slug: 'list_calendar_events',
  description: 'List events in Odoo Calendar',
  icon: 'http://localhost:8069/calendar/static/description/icon.png',
  inputSchema: {
    type: 'object',
    properties: {
      startDate: { type: 'string', format: 'YYYY-MM-DD' },
      endDate: { type: 'string', format: 'YYYY-MM-DD' },
    },
    required: ['startDate', 'endDate'],
  },
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
