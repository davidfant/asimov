import { Asimov, EvaluationQuizItem, Function, Sample } from '../src';
import { createLogger } from '../src/logger';
import { samples } from './samples';

const logger = createLogger('example');

async function runAgent(sample: Sample, functions: Function[]): Promise<EvaluationQuizItem[]> {
  console.log('TODO', sample, functions);
  return [];
}

(async () => {
  const asimov = new Asimov(samples);

  for (const sample of asimov.samples) {
    const functions = asimov.prepare(sample);
    logger.info(`Running sample`, { name: sample.name });
    const quiz = await runAgent(sample, functions);
    logger.info(`Finished sample`, { name: sample.name, quiz });
    asimov.submit(sample, quiz);
  }

  logger.info(`Finished all samples`);
  asimov.evaluate();
})();
