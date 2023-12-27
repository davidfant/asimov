import { z } from "zod";

export interface Function<
  Input extends z.ZodObject<any, any, any, any> = z.ZodObject<any, any, any, any>,
  Output extends z.ZodObject<any, any, any, any> = z.ZodObject<any, any, any, any>
> {
  name: string;
  description: string;
  icon?: string;
  slug: string;
  inputSchema: Input;
  outputSchema: Output;
  call(input: z.infer<Input>): Promise<z.infer<Output>>;
}

export interface EvaluationQuizItem {
  question: string;
  answer: string;
}

export interface Evaluation {

  functions: string[];
  quiz: EvaluationQuizItem[];
}

export interface Sample<Input extends {} = {}> {
  type?: string;
  name: string;
  instructions: string;
  date?: string;
  functions: Function[];
  expected: Evaluation;
  input?: Input;
}

export interface OdooSample extends Sample {
  type: 'odoo';
  snapshot: string;
}

