import { z } from "zod";
import { OdooAPI } from "../../api";
import dayjs from 'dayjs';


export const eventSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  start: z.string(),
  end: z.string(),
  attendees: z.array(z.object({
    id: z.number(),
    name: z.string(),
    isOrganizer: z.boolean(),
  })),
});

export type Event = z.infer<typeof eventSchema>;
export type EventUser = Event['attendees'][number];

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
