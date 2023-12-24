import { OdooAPI } from "../../api";
import dayjs from 'dayjs';


export interface EventUser {
  id: number;
  name: string;
  isOrganizer: boolean;
}

export interface Event {
  id: number;
  name: string;
  description: string;
  start: string;
  end: string;
  attendees: EventUser[];
}

export async function toEvent(data: Record<string, any>, odoo: OdooAPI): Promise<Event> {
  return {
    id: data.id,
    name: data.display_name,
    description: data.description || '', // consider stripping HTML
    start: dayjs(data.start).format('YYYY-MM-DD HH:mm'),
    end: dayjs(data.stop).format('YYYY-MM-DD HH:mm'),
    attendees: await odoo.getAttendeeDetail(data['partner_ids'], data.id),
  };
}
