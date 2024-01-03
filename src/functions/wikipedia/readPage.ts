import { z } from 'zod';
import { Client } from '@elastic/elasticsearch';
import { Function } from 'asimov/types';
import { ElasticSearchRecord } from './types';

const inputSchema = z.object({
  link: z.string().describe('Link to a Wikipedia page, starting with /wiki/'),
}).required();

const outputSchema = z.object({
  page: z.object({
    title: z.string(),
    content: z.string(),
  }).nullable(),
});

export type Input = z.infer<typeof inputSchema>;
export type Output = z.infer<typeof outputSchema>;

// Function to read a page
async function readPageCall(
  input: Input,
  indexName: string = 'wikipedia',
  host: string = 'http://localhost:9200',
): Promise<Output> {
  const es = new Client({ node: host });
  const slug = input.link.replace('/wiki/', '');

  const response = await es.search({
    index: indexName,
    body: {
      query: {
        match: { slug: slug },
      },
    },
    size: 1
  });

  es.close();

  if (response.hits.hits.length === 0) {
    return { page: null };
  }

  const hit = response.hits.hits[0]._source as ElasticSearchRecord;
  return {
    page: {
      title: hit.title,
      content: hit.markdown,
    }
  };
}

export const readPage: Function<typeof inputSchema, typeof outputSchema> = {
  name: 'Read Wikipedia Page',
  slug: 'readWikipediaPage',
  description: 'Read a Wikipedia page by a link',
  call: readPageCall,
  inputSchema,
  outputSchema,
};
