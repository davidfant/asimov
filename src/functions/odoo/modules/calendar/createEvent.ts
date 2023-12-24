import { Function } from '@asimov/types';
import { OdooAPI, OdooCommand } from '@asimov/functions/odoo/api';
import dayjs from 'dayjs';
import { Event, toEvent } from './types';

interface Input {
  name: string;
  description: string;
  attendeeIds: number[];
  startDate: string; // format: 'YYYY-MM-DD' or 'YYYY-MM-DD HH:mm'
  endDate: string; // format: 'YYYY-MM-DD' or 'YYYY-MM-DD HH:mm'
}

interface Output {
  events: Event;
}


export const createEvent: Function<Input, Output> = {
  name: 'Create Calendar Event',
  slug: 'create_calendar_event',
  description: 'Create an event in Odoo Calendar',
  icon: 'http://localhost:8069/calendar/static/description/icon.png',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      description: { type: 'string' },
      attendeeIds: { type: 'array', items: { type: 'number' } },
      startDate: { type: 'string', format: 'YYYY-MM-DD' },
      endDate: { type: 'string', format: 'YYYY-MM-DD' },
    },
    required: ['name', 'description', 'attendeeIds', 'startDate', 'endDate'],
  },
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
