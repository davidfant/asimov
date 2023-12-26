import { Client } from '@elastic/elasticsearch';
import { Function } from 'asimov/types';

export interface Input {
  query: string;
}

interface Result {
  link: string;
  title: string;
  snippet: string;
}

export interface Output {
  results: Result[];
}

async function searchCall(
  input: Input,
  indexName: string = 'wikipedia',
  host: string = 'http://localhost:9200',
  snippetSize: number = 300,
): Promise<Output> {
  const es = new Client({ node: host });

  const response = await es.search({
    index: indexName,
    body: {
      query: {
        multi_match: {
          query: input.query,
          fields: ['title^2', 'text'],
        },
      },
      highlight: {
        fields: {
          title: { pre_tags: [''], post_tags: [''] },
          text: { pre_tags: [''], post_tags: [''], fragment_size: snippetSize },
        },
      },
      size: 10
    }
  });

  es.close();

  return {
    results: response.hits.hits.map((hit: any) => ({
      link: '/wiki/' + hit._source.slug,
      title: hit._source.title,
      snippet: hit.highlight.text ? hit.highlight.text[0] : hit._source.text.substring(0, snippetSize)
    }))
  };
}


export const search: Function<Input, Output> = {
  name: 'Search Wikipedia',
  slug: 'search_wikipedia',
  description: 'Search Wikipedia by a query',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string' },
    },
    required: ['query'],
  },
  call: searchCall,
};
