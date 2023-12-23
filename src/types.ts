
export interface Function<Input extends {} = {}, Output extends {} = {}> {
  name: string;
  description: string;
  icon?: string;
  slug: string;
  call(input: Input): Promise<Output>;
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

