import { z } from 'zod';
import { Client } from '@elastic/elasticsearch';
import { Function } from 'asimov/types';

const inputSchema = z.object({
  query: z.string(),
});

const outputSchema = z.object({
  results: z.array(
    z.object({
      link: z.string(),
      title: z.string(),
      snippet: z.string(),
    }),
  ),
});

export type Input = z.infer<typeof inputSchema>;
export type Output = z.infer<typeof outputSchema>;

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


export const search: Function<typeof inputSchema, typeof outputSchema> = {
  name: 'Search Wikipedia',
  slug: 'searchWikipedia',
  description: 'Search Wikipedia by a query',
  inputSchema,
  outputSchema,
  call: searchCall,
};
