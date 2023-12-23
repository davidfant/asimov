import crypto from 'crypto';
import * as fs from 'fs';
import OpenAI from 'openai';
import { ChatCompletion, ChatCompletionCreateParamsNonStreaming } from 'openai/resources';
import * as os from 'os';
import * as path from 'path';
import pino from 'pino';

const openai = new OpenAI();
const logger = pino({ name: 'openai' });


export async function createCompletion(body: ChatCompletionCreateParamsNonStreaming): Promise<ChatCompletion> {
  const hash = crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
  const cachePath = path.join(os.homedir(), '.cache', 'asimov', 'openai', `${hash}.json`);

  if (fs.existsSync(cachePath)) {
    logger.info({ cachePath }, 'Using cached completion');
    return JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  }

  const res = await openai.chat.completions.create(body);
  fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  fs.writeFileSync(cachePath, JSON.stringify(res));
  return res;
}

