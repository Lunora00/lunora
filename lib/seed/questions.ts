import { Question } from "../../types/quiz.types";

export const SAMPLE_QUESTIONS: Question[] = [
  {
    id: "q1",
    type: "mcq",
    question: "What is the output of: console.log(typeof []);",
    options: ["object", "array", "undefined", "object[]"],
    correctAnswer: 0,
    explanation: "Arrays are objects in JavaScript; typeof [] === 'object'",
    difficulty: "easy",
    topic: "types",
  },

  {
    id: "q2",
    type: "tf",
    question: "`null === undefined` is true",
    correctAnswer: false,
    explanation: "null === undefined is false; only == compares loosely",
    difficulty: "easy",
    topic: "operators",
  },

  {
    id: "q3",
    type: "fill_blank",
    question: "Fill blank: The method to add an element at the end of an array is ____.",
    correctAnswer: "push",
    explanation: "Array.prototype.push adds element(s) to the end.",
    difficulty: "easy",
    topic: "arrays",
  },

  {
    id: "q4",
    type: "match",
    question: "Match the method to its purpose",
    matchPairs: [
      { left: "map", right: "returns new array by transforming items" },
      { left: "filter", right: "returns subset matching predicate" },
      { left: "reduce", right: "accumulate to single value" },
    ],
    explanation: "Common array helpers",
    difficulty: "medium",
    topic: "arrays",
  },

  {
    id: "q5",
    type: "code",
    question: "Write a function that returns the cube of a number and pass tests",
    testCases: [
      { input: "3", expectedOutput: "27" },
      { input: "0", expectedOutput: "0" },
    ],
    explanation: "Return number*number*number",
    difficulty: "easy",
    topic: "functions",
  },

  {
    id: "q6",
    type: "open",
    question: "Describe how functions improve large-scale web applications.",
    explanation: "Look for modularity, testability, reusability, separation of concerns",
    difficulty: "hard",
    topic: "architecture",
  },
];

export default SAMPLE_QUESTIONS;
