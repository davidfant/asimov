import { Client } from '@elastic/elasticsearch';
import { Function } from '../../types';
import { ElasticSearchRecord } from './types';

interface Input {
  link: string;
}

interface Page {
  title: string;
  content: string; // 'Markdown content'
}

interface Output {
  page: Page | null;
}

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

export const readPage: Function<Input, Output> = {
  name: 'Read Wikipedia Page',
  slug: 'read_wikipedia_page',
  description: 'Read a Wikipedia page by a link',
  call: readPageCall,
  inputSchema: {
    type: 'object',
    properties: {
      link: {
        type: 'string',
        description: 'Link to a Wikipedia page',
      },
    },
    required: ['link'],
  },
};
