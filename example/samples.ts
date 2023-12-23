import { Sample } from "../src";
import * as functions from "./functions/add";

export const samples: Sample[] = [{
  name: 'Add two numbers',
  instructions: 'What is 1782937829 + 973912412?',
  functions: [functions.add],
  expected: {
    functions: [functions.add.slug],
    quiz: [{
      question: 'What is the first term?',
      answer: '1782937829',
    }, {
      question: 'What is the second term?',
      answer: '973912412',
    }, {
      question: 'What is the sum?',
      answer: '2756850241',
    }],
  },
}];
