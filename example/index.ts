import { ChatCompletionMessageParam, ChatCompletionTool, FunctionParameters } from 'openai/resources';
import { Asimov, EvaluationQuizItem, Function, Sample } from '../src';
import { samples } from './samples';
import { createCompletion } from '../src/util/openai';
import pino from 'pino';

const logger = pino({ name: 'example' });

async function runAgent(
  sample: Sample,
  functions: Function[],
  model: string = 'gpt-4-1106-preview',
): Promise<EvaluationQuizItem[]> {
  const messages: ChatCompletionMessageParam[] = [{
    role: 'system',
    content: 'You are a helpful AI assistant. Follow the instructions and use the available functions to complete the task. Always call functions, and never respond with a text message! Do not make any assumptions about the task, and do not use any outside knowledge.',
  }, {
    role: 'user',
    content: sample.instructions,
  }];

  agentLoop: while (true) {
    const completion = await createCompletion({
      messages,
      model,
      tools: [
        ...functions.map((fn): ChatCompletionTool => ({
          type: 'function',
          function: {
            name: fn.slug,
            description: fn.description,
            parameters: fn.inputSchema as FunctionParameters,
          },
        })),
        {
          type: 'function',
          function: {
            name: 'done',
            description: 'Call this function when you are done with the task.',
            parameters: { 'type': 'object', 'properties': {} },
          }
        }
      ],
    });

    logger.info({ completion }, 'Agent Step');

    const choice = completion.choices[0];
    if (choice.finish_reason !== 'tool_calls') {
      logger.warn({ reason: choice.finish_reason }, 'Unexpected finish reason');
      break;
    }

    messages.push({ role: 'assistant', tool_calls: choice.message.tool_calls });

    for (const tc of choice.message.tool_calls!) {
      if (tc.function.name === 'done') {
        messages.pop();
        break agentLoop;
      }

      const fn = functions.find((fn) => fn.slug === tc.function.name);
      if (!fn) {
        logger.warn({ fn: tc.function.name }, 'Unexpected function call');
        break agentLoop;
      }

      const args = JSON.parse(tc.function.arguments);
      const output = await fn.call(args);
      messages.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: JSON.stringify(output),
      });

      logger.info({ fn: fn.slug, args, output }, 'Function call');
    }
  }

  const completion = await createCompletion({
    messages: [
      {
        role: 'system',
        content: 'You are a helpful AI assistant. Answer the questions based on the messages so far using the answer function. Question:\n' + sample.expected.quiz.map((q, i) => `${i}. ${q.question}`).join('\n'),
      },
      ...messages.slice(1),
    ],
    model,
    tools: [{
      type: 'function',
      function: {
        name: 'answer',
        description: 'Call this function to answer all questions. If you do not know the answer to a specific question, enter an empty string. VERY IMPORTANT: answer all questions, even if you do not know the answer to some of them.',
        parameters: {
          type: 'object',
          properties: {
            num_questions: { 'type': 'integer' },
            answers: {
              type: 'array',
              items: { 'type': 'string' },
            },
          },
          required: ['answers'],
        },
      },
    }],
    tool_choice: { type: 'function', function: { name: 'answer' } },
  });

  logger.info({ completion }, 'Agent Questions');
  const args = JSON.parse(completion.choices[0].message.tool_calls![0].function.arguments);
  const answers: string[] = args.answers;

  return sample.expected.quiz.map((q, i): EvaluationQuizItem => ({
    question: q.question,
    answer: answers[i],
  }))
}

(async () => {
  const asimov = new Asimov(samples);

  for (const sample of asimov.samples) {
    const functions = asimov.prepare(sample);
    logger.info({ name: sample.name }, 'Running sample');
    const quiz = await runAgent(sample, functions);
    logger.info({ name: sample.name, quiz }, 'Finished sample');
    asimov.submit(sample, quiz);
  }

  logger.info(`Finished all samples`);
  asimov.evaluate();
})();
