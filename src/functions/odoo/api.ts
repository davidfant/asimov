import * as xmlrpc from 'xmlrpc';
import pino from 'pino';

const logger = pino({ name: 'odoo.api' });

export enum Command {
  CREATE = 0,
  UPDATE = 1,
  DELETE = 2,
  UNLINK = 3,
  LINK = 4,
  CLEAR = 5,
  SET = 6,
}

interface SearchFilter {
  field: string;
  op: string;
  value: any;
}

interface AttendeeDetail {
  id: number;
  name: string;
  status: string;
  isOrganizer: boolean;
}

type Specification = Record<string, { fields?: Specification }>;

export class OdooAPI {
  url: string = 'http://localhost:8069';
  username: string = 'admin';
  password: string = 'admin';
  db: string = 'odoo';
  _userId?: number;

  async getUserId(): Promise<number> {
    if (!!this._userId) return this._userId;

    logger.info({ db: this.db, username: this.username, password: this.password }, 'Authenticating');
    const client = xmlrpc.createClient({ host: 'localhost', port: 8069, path: '/xmlrpc/2/common' });
    const userId = await new Promise<number>((resolve, reject) => {
      client.methodCall('authenticate', [this.db, this.username, this.password, {}], (error, value) => {
        if (error) {
          reject(error);
        } else {
          resolve(value);
        }
      });
    });
    logger.info({ userId }, 'Authenticated');
    this._userId = userId;
    return userId;
  }

  fieldsToSpecification(fields: string[]): Specification {
    let specification: Specification = {};
    for (let field of fields) {
      let fieldSpec = specification;
      let parts = field.split('.');
      parts.forEach((part, idx) => {
        if (!(part in fieldSpec)) {
          fieldSpec[part] = {};
        }

        let isLast = idx === parts.length - 1;
        if (!isLast) {
          fieldSpec[part]['fields'] = {};
          fieldSpec = fieldSpec[part]['fields']!;
        }
      });
    }
    return specification;
  }

  async request<T>(model: string, op: string, args: any[], options: Record<string, any> = {}): Promise<T> {
    const client = xmlrpc.createClient({ host: 'localhost', port: 8069, path: '/xmlrpc/2/object' });
    const userId = await this.getUserId();
    return new Promise((resolve, reject) => {
      client.methodCall('execute_kw', [this.db, userId, this.password, model, op, args, options], (error, value) => {
        if (error) {
          reject(error);
        } else {
          resolve(value);
        }
      });
    });
  }

  async searchRead(model: string, fields: string[], filters: SearchFilter[] = []): Promise<Record<string, any>[]> {
    const response = await this.request<{ records: Record<string, any>[] }>(
      model, 
      'web_search_read', 
      [filters.map(f => [f.field, f.op, f.value])], 
      { specification: this.fieldsToSpecification(fields) }
    );
    return response.records;
  }

  async create(model: string, data: Record<string, any>, fields: string[]): Promise<Record<string, any>> {
    const response: Record<string, any>[] = await this.request<Record<string, any>[]>(
      model, 
      'web_save', 
      [[], data], 
      { specification: this.fieldsToSpecification(fields) }
    );
    return response[0]
  }

  async getAttendeeDetail(partnerIds: number[], modelId: number): Promise<AttendeeDetail[]> {
    if (!partnerIds.length) {
      return [];
    }

    const details: Record<string, any>[] = await this.request(
      'res.partner', 
      'get_attendee_detail', 
      [partnerIds, [modelId]],
    );

    return details.map((detail): AttendeeDetail => ({
      id: detail.id,
      name: detail.name,
      status: detail.status,
      isOrganizer: !!detail.is_organizer,
    }));
  }
}

