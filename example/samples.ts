import { Sample, functions } from "../src";
import * as exampleFunctions from "./functions/add";

export const samples: Sample[] = [{
  name: 'Add two numbers',
  instructions: 'What is 1782937829 + 973912412?',
  functions: [exampleFunctions.add],
  expected: {
    functions: [exampleFunctions.add.slug],
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
}, {
  name: 'Search Wikipedia',
  instructions: 'Research the year 1092. Do not research anything else.',
  functions: [
    functions.wikipedia.search,
    functions.wikipedia.readPage,
  ],
  expected: {
    functions: [
      functions.wikipedia.search.slug,
      functions.wikipedia.readPage.slug,
    ],
    quiz: [{
      question: 'What day of the week did the year start?',
      answer: 'Thursday',
    }, {
      question: 'What did England annex?',
      answer: 'Cumbria',
    }],
  }
}, {
  name: 'Message Friend',
  instructions: 'Send a message to your friend asking them how they are doing.',
  functions: [
    functions.persona.sendMessageWithContext('Say that you recently moved to San Francisco.'),
  ],
  expected: {
    functions: [functions.persona.sendMessage.slug],
    quiz: [{
      question: 'In what city does the friend live?',
      answer: 'San Francisco',
    }],
  },
}];
