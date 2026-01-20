import { GoogleGenerativeAI } from "@google/generative-ai";

// --- INTERFACES ---

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: "Easy" | "Medium" | "Hard" | string;
  topic: string;
  type?: "Multiple Choice" | string;
  hint?: string;
  analogy?: string;
  subtopic?: string;
}

export interface Flashcard {
  term: string;
  definition: string;
  subtopic: string;
}

export interface GeminiQuizOutput {
  svgTopicTitle: any;
  majorSubject: string;
  mainTopic: string;
  subtopics: {
    name: string;
    totalQuestions: number;
    weakness: number;
  }[];
  subject: string;
  questionList: Question[];
}

export interface GeminiFlashcardOutput {
  topic: string;
  flashcards: Flashcard[];
}

export interface GeminiSimilarQuestionsOutput {
  topic: string;
  questionList: Question[];
}

// --- END INTERFACES ---

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  constructor() {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error(
        "NEXT_PUBLIC_GEMINI_API_KEY is not set in environment variables"
      );
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }


  private async generateWithFallback(
    requestFn: (model: any) => Promise<any>
  ) {
    const GEMINI_MODEL_FALLBACKS = [
      "gemini-2.0-flash",
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-2.0-flash-lite",
      "gemini-2.5-pro",
      "gemini-2.5-flash-preview",
    ];

    let lastError: any = null;

    for (const modelName of GEMINI_MODEL_FALLBACKS) {
      try {
        const model = this.genAI.getGenerativeModel({ model: modelName });
        const result = await requestFn(model);

        console.log(`✅ Gemini success with model: ${modelName}`);
        return result;
      } catch (error: any) {
        console.warn(`❌ Gemini failed: ${modelName}`, error?.message);
        lastError = error;
      }
    }

    throw new Error(
      `All Gemini models failed. Last error: ${lastError?.message}`
    );
  }


  async generateQuestions(
    content: string,
    subject: string
  ): Promise<GeminiQuizOutput> {
    try {
      const wordCount = content.length;
      const sanitizedContent = content
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/\\/g, "\\\\")
        .slice(0, 150000);
      const targetCount = Math.min(
        Math.max(Math.floor((wordCount / 1000) * 15), 10),
        25
      );

      const prompt = `You are an Academic Architect. 
### INSTRUCTION:
Examine the SOURCE below. Ignore all navigation links, localization requests, and header/footer noise. 
Focus ONLY on the core educational concepts of ${subject}.

--- SOURCE ---
${sanitizedContent}
--- END ---

### STRATEGY:
1. Divide the core educational content into 8-10 logical chapters.
2. Generate EXACTLY ${targetCount} questions. 
3. Distribute questions evenly: ~10 questions per chapter to ensure full document coverage.

### RULES:
1. Style: Ultra-Short (Q < 10 words, Options < 3 words).
3. Output: Valid JSON only.
### SCHEMA:
{
  "mainTopic": "string",
  "majorSubject": "string",
  "svgTopicTitle": "string",
  "subtopicGroups": [
    {
      "subtopicName": "Chapter Name",
      "questions": [
        {
          "question": "string",
          "options": ["A", "B", "C", "D"],
          "correctAnswer": NUMBER ANY(0-3),
          "explanation": "string",
          "difficulty": "Easy",
          "analogy": "string"
        }
      ]
    }
  ]
}`;

      const result = await this.generateWithFallback(async (model) => {
        return await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
          },
        });
      });

      const response = await result.response;
      let rawText = response.text();

      const lastBrace = rawText.lastIndexOf("}");
      if (lastBrace !== -1 && lastBrace < rawText.length - 1) {
        rawText = rawText.substring(0, lastBrace + 1);
      }

      const rawOutput = JSON.parse(rawText);

      const flattenedQuestions: any[] = [];
      const subtopicSummaries: any[] = [];

      rawOutput.subtopicGroups.forEach((group: any) => {
        subtopicSummaries.push({
          name: group.subtopicName,
          totalQuestions: group.questions?.length || 0,
          weakness: 0,
        });
        group.questions.forEach((q: any) => {
          flattenedQuestions.push({
            ...q,
            id: Math.random().toString(36).substr(2, 9),
            subtopic: group.subtopicName,
            topic: rawOutput.mainTopic,
            type: "Multiple Choice",
          });
        });
      });

      return {
        mainTopic: rawOutput.mainTopic,
        majorSubject: rawOutput.majorSubject,
        svgTopicTitle: rawOutput.svgTopicTitle,
        subject: subject,
        subtopics: subtopicSummaries,
        questionList: flattenedQuestions,
      };
    } catch (error: any) {
      console.error("Error generating questions:", error);
      throw error;
    }
  }

  async generateExtraQuestions(
    subtopicName: string,
    fullContent: string,
    existingQuestions: string[]
  ): Promise<Question[]> {
    try {
      const prompt = `
Based on the SOURCE below, generate exactly 10 NEW and UNIQUE multiple-choice questions for the subtopic: "${subtopicName}" and from ${fullContent} only not from outside.

CRITICAL RULES:
1. Do NOT repeat these existing questions: ${existingQuestions.join(" | ")}
2. Style: Ultra-Short (Q < 10 words, Options < 3 words).
3. **Complexity:** Academic focus, no trivial repetition.
4. Output: Valid JSON only.

### SCHEMA:
{
  "questions": [
    { "question": "string", "options": ["A", "B", "C", "D"], "correctAnswer": 0, "explanation": "string", "difficulty": "Easy" }
  ]
}`;

      const result = await this.generateWithFallback(async (model) => {
        return await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt + "\n\nSOURCE:\n" + fullContent.slice(0, 50000) }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            responseMimeType: "application/json",
          },
        });
      });

      const response = await result.response;
      const data = JSON.parse(
        response
          .text()
          .trim()
          .replace(/```json/g, "")
          .replace(/```/g, "")
      );

      return data.questions.map((q: any) => ({
        ...q,
        id: Math.random().toString(36).substr(2, 9),
        subtopic: subtopicName,
        type: "Multiple Choice",
      }));
    } catch (error: any) {
      console.error("Error generating extra questions:", error);
      throw error;
    }
  }

  async generateSummary(
    subtopicName: string,
    fullContent: string
  ): Promise<string> {
    try {
      const prompt = `You are a concise, analytical AI. 
Produce ONLY valid JSON (no markdown, no comments, no formatting outside JSON).

Your job: summarize the given subtopic into 3 panels + 1 analogy + 3 short key takeaways.

INPUT VARIABLES:
- subtopicName: ${subtopicName}
- fullContent: ${fullContent}

Generate only from subtopicname not from whole content

OUTPUT JSON SCHEMA:
{
  "subtopic": "<subtopicName>",
  "panels": {
    "panel1": { "trigger": "...", "function": "..." },
    "panel2": { "mechanism1": "...", "mechanism2": "..." },
    "panel3": { "goal1": "...", "goal2": "...", "conclusion": "..." }
  },
  "analogy": "<1–2 line analogy in one string, use \\n for line breaks>",
  "takeaways": [
    "Short takeaway 1",
    "Short takeaway 2",
    "Short takeaway 3"
  ]
}

RULES:
1) Use ONLY the provided subtopic text.
2) Keep outputs short, crisp, and compact.
3) No markdown, no backticks, no code fences, no extra keys.
4) DO NOT style output — styling will be done externally in React.
5) The JSON must be clean, minimal, and strictly follow the schema.
`;

      const result = await this.generateWithFallback(async (model) => {
        return await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            responseMimeType: "application/json",
          },
        });
      });

      const response = await result.response;

      const generatedText = response.text();

      if (!generatedText || typeof generatedText !== "string") {
        throw new Error("Invalid response");
      }

      return generatedText.trim();
    } catch (error: any) {
      console.error("Error generating summary:", error);
      throw error;
    }
  }

  async generateSimilarQuestions(
    subtopicName: string,
    fullContent: string
  ): Promise<GeminiSimilarQuestionsOutput> {
    try {
      const prompt = `You are an expert examiner. 
Generate exactly 5 high-quality, unique multiple-choice questions based ONLY on the subtopic: "${subtopicName}" from the content provided.

### RULES:
1. Source: Use ONLY the provided content. Do not use outside knowledge.
2. Style: Questions should be clear and concise (under 15 words).
3. Options: Provide exactly 4 options per question. Options should be short (1-4 words).
4. Difficulty: Vary the difficulty between Easy, Medium, and Hard.
5. Format: Return ONLY a valid JSON object. No markdown, no backticks.

### SCHEMA:
{
  "topic": "${subtopicName}",
  "questionList": [
    {
      "question": "string",
      "options": ["option1", "option2", "option3", "option4"],
      "correctAnswer": 0,
      "explanation": "string",
      "difficulty": "Easy"
    }
  ]
}`;

      const result = await this.generateWithFallback(async (model) => {
        return await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [
                { text: prompt + "\n\nCONTENT:\n" + fullContent.slice(0, 50000) },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            responseMimeType: "application/json",
          },
        });
      });

      const response = await result.response;
      let rawText = response.text().trim();

      rawText = rawText.replace(/```json/g, "").replace(/```/g, "");

      const parsed: GeminiSimilarQuestionsOutput = JSON.parse(rawText);

      parsed.questionList = parsed.questionList.map((q: any) => ({
        ...q,
        id: Math.random().toString(36).substr(2, 9),
        subtopic: subtopicName,
        topic: subtopicName,
        type: "Multiple Choice",
      }));

      return parsed;
    } catch (error: any) {
      console.error("Error generating similar questions:", error);
      throw error;
    }
  }

  async generateFlashcards(
    subtopicName: string,
    fullContent: string
  ): Promise<GeminiFlashcardOutput> {
    try {
      const prompt = `You are an expert educator AI.  
Generate exactly **5 flashcards** based strictly and only on the content provided below.  
Do NOT pull information from outside the content.

Focus ONLY on the subtopic: "${subtopicName}"

CONTENT TO STUDY:
-----------------
${fullContent.slice(0, 50000)}
-----------------

OUTPUT INSTRUCTIONS:
- Output MUST be valid JSON.
- Follow the schema EXACTLY.
- Each flashcard must be factual, precise, and directly supported by the content.
- "term" should be short and punchy.
- "definition" should be clear, simple, and focused.
- Do NOT include extra commentary.

### STRICT JSON SCHEMA:
{
  "topic": "${subtopicName}",
  "flashcards": [
    {
      "term": "string",
      "definition": "string",
      "subtopic": "${subtopicName}"
    }
  ]
}

Now generate exactly **5** flashcards.
`;

      const result = await this.generateWithFallback(async (model) => {
        return await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            responseMimeType: "application/json",
          },
        });
      });

      const response = await result.response;

      const rawText = response.text();

      if (!rawText) {
        throw new Error("Empty response");
      }

      let text = rawText;
      text = text
        .trim()
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "");

      const flashcardOutput: GeminiFlashcardOutput = JSON.parse(text);

      if (!flashcardOutput || !Array.isArray(flashcardOutput.flashcards)) {
        throw new Error("Invalid structure");
      }
      return flashcardOutput;
    } catch (error: any) {
      console.error("Error generating flashcards:", error);
      throw error;
    }
  }

  async generateBlastPairs(
    content: string
  ): Promise<{ term: string; definition: string }[]> {
    try {
      const prompt = `
Generate exactly 8 term-definition pairs based ONLY on the given content below.
Each "term" must be short (1–2 words).
Each "definition" must be simple (3-4 words).
Output ONLY pure JSON. No markdown. No extra text.

SCHEMA:
{
  "pairs": [
    { "term": "string", "definition": "string" }
  ]
}

CONTENT:
${content.slice(0, 50000)}
`;

      const result = await this.generateWithFallback(async (model) => {
        return await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            responseMimeType: "application/json",
          },
        });
      });

      const response = await result.response;

      let text = response.text() ?? "";
      text = text
        .trim()
        .replace(/```json/g, "")
        .replace(/```/g, "");

      return JSON.parse(text).pairs;
    } catch (error: any) {
      console.error("Error generating blast pairs:", error);
      throw error;
    }
  }
}