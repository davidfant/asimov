import { table } from 'table';
import { Sample, OdooSample, Function, EvaluationQuizItem } from './types';
import timekeeper from 'timekeeper';
import { createLogger } from './logger';
// import { restoreOdooSnapshot } from './functions/odoo/snapshot/restore';

const logger = createLogger('asimov');


export class Asimov {
  samples: Sample[];
  odooSnapshotDir: string | null = null;
  defaultDate: string = '2023-11-26';

  _sampleFunctions: Record<number, string[]> = {};
  _sampleQuiz: Record<number, EvaluationQuizItem[]> = {};

  constructor(samples: Sample[]) {
    this.samples = samples;
  }

  prepare(sample: Sample): Function[] {
    if (sample.type === 'odoo') {
      if (!this.odooSnapshotDir) {
        throw new Error('odooSnapshotDir must be set when using OdooSample');
      }
      console.log('TODO: restore', (sample as OdooSample).snapshot);
      // restoreOdooSnapshot((sample as OdooSample).snapshot, this.odooSnapshotDir);
    }

    timekeeper.freeze(new Date(sample.date ?? this.defaultDate));

    const idx = this.samples.indexOf(sample);
    return sample.functions.map((fn) => ({
      ...fn,
      call: (input) => {
        this._sampleFunctions[idx] = [...(this._sampleFunctions[idx] ?? []), fn.slug];
        return fn.call(input);
      }
    }))
  }

  submit(sample: Sample, quiz: EvaluationQuizItem[]): void {
    const idx = this.samples.indexOf(sample);
    this._sampleQuiz[idx] = quiz;
  }

  evaluate(): void {
    if (!(Object.keys(this._sampleFunctions).sort().every((value, index) => Number(value) === index))) {
      throw new Error('_sampleFunctions keys do not match sample indices');
    }

    if (!(Object.keys(this._sampleQuiz).sort().every((value, index) => Number(value) === index))) {
      throw new Error('_sampleQuiz keys do not match sample indices');
    }

    const quizAnswers: any[] = [];
    const results: any[] = [];
    const raw: any[] = [];

    this.samples.forEach((sample, index) => {
      const functionSlugsCalled = this._sampleFunctions[index] ?? [];
      const quiz = this._sampleQuiz[index] ?? [];

      const quizAnswersCorrect = sample.expected.quiz.map((expected, i) => {
        const answer = i < quiz.length ? quiz[i].answer : false;
        return expected.answer === answer;
      });

      quizAnswers.push(...sample.expected.quiz.map((expected, i) => ({
        'Sample': sample.name,
        'Question': expected.question,
        'Expected': expected.answer,
        'Actual': i < quiz.length ? quiz[i].answer : '',
        'Correct': quizAnswersCorrect[i],
      })));

      const expectedFunctionsUsed = new Set(functionSlugsCalled.filter(slug => sample.expected.functions.includes(slug)));

      results.push({
        'Sample': sample.name,
        'Quiz Score': quizAnswersCorrect.reduce((a, b) => a + Number(b), 0) / quizAnswersCorrect.length,
        'Functions Score': expectedFunctionsUsed.size / sample.expected.functions.length,
        'Steps': functionSlugsCalled.length,
      });

      raw.push({
        sample,
        functions: functionSlugsCalled,
        quiz,
      });
    });

    let tableData = table([
      Object.keys(results[0]),
      ...results.map((r) => Object.values(r)),
    ]);
    logger.info('Evaluation:\n' + tableData);

    tableData = table([
      Object.keys(quizAnswers[0]),
      ...quizAnswers.map((r) => Object.values(r)),
    ]);
    logger.info('Quiz Answers:\n' + tableData);

    logger.info('Raw:\n' + JSON.stringify(raw, null, 2));
  }
}