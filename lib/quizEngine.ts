import { Question } from "../types/quiz.types";

export interface GradeResult {
  score: number;
  maxScore: number;
  isCorrect: boolean;
  feedback?: string;
  confidence?: number; // 0-1 auto-grader confidence
}

export function gradeQuestion(question: Question, answer: any): GradeResult {
  const maxScore = 1;
  if (!question) return { score: 0, maxScore, isCorrect: false, feedback: "No question" };

  switch (question.type) {
    case "mcq": {
      const correct = typeof question.correctAnswer === "number" ? question.correctAnswer : undefined;
      const isCorrect = correct !== undefined && answer === correct;
      return {
        score: isCorrect ? 1 : 0,
        maxScore,
        isCorrect,
        feedback: isCorrect ? "Correct" : (question.explanation || "Incorrect"),
        confidence: isCorrect ? 1 : 0.9,
      };
    }

    case "tf": {
      const correct = question.correctAnswer === true || question.correctAnswer === 1 || question.correctAnswer === "true";
      const isCorrect = String(answer).toLowerCase().startsWith(String(correct).toLowerCase());
      return { score: isCorrect ? 1 : 0, maxScore, isCorrect, feedback: isCorrect ? "Correct" : (question.explanation || "Incorrect"), confidence: isCorrect ? 1 : 0.8 };
    }

    case "fill_blank": {
      // Accept string or array of strings; support simple case-insensitive match
      const expected = question.correctAnswer;
      const normalize = (v: any) => (String(v || "").trim().toLowerCase());
      if (Array.isArray(expected)) {
        // multiple blanks: compute fraction correct
        const provided = Array.isArray(answer) ? answer : [answer];
        const total = expected.length;
        let correctCount = 0;
        for (let i = 0; i < total; i++) {
          if (normalize(expected[i]) === normalize(provided[i])) correctCount++;
        }
        const score = total ? correctCount / total : 0;
        return { score, maxScore, isCorrect: score === 1, feedback: question.explanation, confidence: 0.6 + score * 0.4 };
      } else {
        const isCorrect = normalize(expected) === normalize(answer);
        return { score: isCorrect ? 1 : 0, maxScore, isCorrect, feedback: question.explanation, confidence: isCorrect ? 0.95 : 0.5 };
      }
    }

    case "match": {
      // question.matchPairs expected; answer is array of right indices or pairs
      const pairs = question.matchPairs || [];
      const provided: any[] = Array.isArray(answer) ? answer : [];
      const total = pairs.length;
      let correct = 0;
      for (let i = 0; i < total; i++) {
        // provided should be array of rights matched to left index
        if (provided[i] === pairs[i]?.right || provided[i] === i || String(provided[i]) === String(pairs[i]?.right)) correct++;
      }
      const score = total ? correct / total : 0;
      return { score, maxScore, isCorrect: score === 1, feedback: question.explanation, confidence: 0.6 + score * 0.4 };
    }

    case "code": {
      // Stub: real implementation runs testCases in a secure sandbox
      // Here we only mark as needs-review unless testCases empty
      const tests = question.testCases || [];
      if (!tests.length) return { score: 0, maxScore, isCorrect: false, feedback: "No tests provided", confidence: 0 };
      // cannot execute code here; return needs manual review with low confidence
      return { score: 0, maxScore, isCorrect: false, feedback: "Submitted for manual/code review (sandbox required)", confidence: 0 };
    }

    case "open":
    case "assert_reason":
    default:
      return { score: 0, maxScore, isCorrect: false, feedback: "Requires manual grading", confidence: 0 };
  }
}

export default { gradeQuestion };
