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
  // Plain-text content stored in session.content so flashcards/summary/blast
  // all work. Always a string — never undefined.
  extractedContent: string;
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

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getMimeTypeFromFile(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf":
      return "application/pdf";
    case "mp3":
      return "audio/mpeg";
    case "wav":
      return "audio/wav";
    case "mp4":
      return "video/mp4";
    case "mov":
      return "video/quicktime";
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "txt":
      return "text/plain";
    default:
      return "application/octet-stream";
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

// Extract DOCX text via mammoth (browser-compatible, zero server calls)
async function extractDocxText(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

// ─────────────────────────────────────────────────────────────────────────────
// JSON repair — fixes truncated responses by closing open structures
// ─────────────────────────────────────────────────────────────────────────────
function repairTruncatedJson(raw: string): string {
  // Trim to last closing brace first (existing approach)
  let text = raw.trim();
  const lastBrace = text.lastIndexOf("}");
  if (lastBrace !== -1 && lastBrace < text.length - 1) {
    text = text.substring(0, lastBrace + 1);
  }

  // Try parsing as-is first
  try {
    JSON.parse(text);
    return text;
  } catch {
    // Count open brackets/braces to figure out what needs closing
    let openBraces = 0;
    let openBrackets = 0;
    let inString = false;
    let escape = false;

    for (const ch of text) {
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\" && inString) {
        escape = true;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;
      if (ch === "{") openBraces++;
      else if (ch === "}") openBraces--;
      else if (ch === "[") openBrackets++;
      else if (ch === "]") openBrackets--;
    }

    // Remove trailing comma before we close structures
    text = text.replace(/,\s*$/, "");

    // Close any open string first (edge case: truncated mid-string)
    if (inString) text += '"';

    // Close open arrays then objects
    for (let i = 0; i < openBrackets; i++) text += "]";
    for (let i = 0; i < openBraces; i++) text += "}";

    return text;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Safe JSON parse — tries repair if initial parse fails
// ─────────────────────────────────────────────────────────────────────────────
function safeParseJson<T>(raw: string, label: string): T {
  // Strip markdown code fences
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    console.warn(
      `⚠️ ${label} — initial JSON parse failed, attempting repair...`,
    );
    const repaired = repairTruncatedJson(cleaned);
    try {
      const parsed = JSON.parse(repaired) as T;
      console.log(`✅ ${label} — JSON repaired successfully`);
      return parsed;
    } catch (e) {
      console.error(`❌ ${label} — JSON repair failed`, e);
      console.error("Raw text (first 500):", cleaned.slice(0, 500));
      throw new Error(`${label}: Could not parse Gemini response as JSON`);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GeminiService
// ─────────────────────────────────────────────────────────────────────────────
export class GeminiService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "NEXT_PUBLIC_GEMINI_API_KEY is not set in environment variables",
      );
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  private async generateWithFallback(requestFn: (model: any) => Promise<any>) {
    const GEMINI_MODEL_FALLBACKS = [
      "gemini-2.0-flash",
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-2.0-flash-lite",
      "gemini-2.5-pro",
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
      `All Gemini models failed. Last error: ${lastError?.message}`,
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // generateQuestions
  //
  // URL sessions  (content = string):
  //   • Single Gemini call for questions only.
  //   • extractedContent = "" — caller already has scrapedContent.
  //
  // FILE sessions (content = File):
  //   • File is converted to base64 ONCE then shared.
  //   • Two Gemini calls fire IN PARALLEL via Promise.all:
  //       1. Questions call
  //       2. Content-extraction call
  //   • extractedContent on the return value carries the extracted text so
  //     the caller can write session.content with no extra round-trip.
  // ───────────────────────────────────────────────────────────────────────────
  async generateQuestions(
    content: string | File,
    subject: string,
    lessonTopic?: string,
  ): Promise<GeminiQuizOutput> {
    try {
      const isFile = content instanceof File;

      let textContent: string | null = null;
      let fileBase64: string | null = null;
      let fileMimeType: string | null = null;

      if (isFile) {
        const file = content as File;
        const ext = file.name.split(".").pop()?.toLowerCase();

        if (ext === "docx") {
          console.log("📄 DOCX — mammoth extraction...");
          textContent = await extractDocxText(file);
          if (!textContent.trim()) {
            throw new Error("Could not extract text from the DOCX file.");
          }
        } else if (ext === "txt") {
          console.log("📝 TXT — plain text read...");
          textContent = await file.text();
          if (!textContent.trim()) {
            throw new Error("The text file appears to be empty.");
          }
        } else {
          console.log(
            `📦 ${(content as File).name.split(".").pop()?.toUpperCase()} — base64 (shared for parallel calls)...`,
          );
          fileBase64 = await fileToBase64(file);
          fileMimeType = getMimeTypeFromFile(file);
        }
      } else {
        textContent = (content as string)
          .replace(/[\u201C\u201D]/g, '"')
          .replace(/[\u2018\u2019]/g, "'")
          .replace(/\\/g, "\\\\")
          .slice(0, 150000);
      }

      const wordCount = textContent ? textContent.length : 50000;
      const targetCount = Math.min(
        Math.max(Math.floor((wordCount / 1000) * 15), 10),
        25,
      );

      const questionsPrompt = this._buildQuestionsPrompt(
        subject,
        targetCount,
        fileBase64 ? null : textContent,
      );

      const contentExtractionPrompt = isFile
        ? this._buildContentExtractionPrompt(subject, lessonTopic || "")
        : null;

      // ── Questions Gemini call ─────────────────────────────────────────────
      const makeQuestionsCall = () =>
        this.generateWithFallback(async (model) => {
          const parts: any[] =
            fileBase64 && fileMimeType
              ? [
                  { inlineData: { mimeType: fileMimeType, data: fileBase64 } },
                  { text: questionsPrompt },
                ]
              : [{ text: questionsPrompt }];

          return await model.generateContent({
            contents: [{ role: "user", parts }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 65536, // high ceiling — prevents JSON truncation
              responseMimeType: "application/json",
            },
          });
        });

      // ── Content-extraction Gemini call (file sessions only) ───────────────
      const makeContentCall = () =>
        this.generateWithFallback(async (model) => {
          const parts: any[] =
            fileBase64 && fileMimeType
              ? [
                  { inlineData: { mimeType: fileMimeType, data: fileBase64 } },
                  { text: contentExtractionPrompt! },
                ]
              : [
                  {
                    text: `${contentExtractionPrompt!}\n\nCONTENT:\n${(
                      textContent || ""
                    ).slice(0, 150000)}`,
                  },
                ];

          return await model.generateContent({
            contents: [{ role: "user", parts }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 65536, // plain text — give it full room
            },
          });
        });

      // ── Fire in parallel for file sessions, single call for URL sessions ──
      let questionsResult: any;
      let extractedContent = "";

      if (isFile) {
        console.log("🚀 Firing questions + content extraction in parallel...");
        const [qResult, cResult] = await Promise.all([
          makeQuestionsCall(),
          makeContentCall(),
        ]);
        questionsResult = qResult;
        // Guard: ensure extractedContent is always a non-undefined string
        extractedContent = cResult.response.text()?.trim() ?? "";
        console.log(
          `✅ Parallel done — content: ${extractedContent.length} chars`,
        );
      } else {
        questionsResult = await makeQuestionsCall();
        extractedContent = ""; // URL sessions: caller uses scrapedContent
      }

      const parsed = this._parseQuestionsResponse(
        await questionsResult.response,
        subject,
      );
      // Always assign — never leave as undefined
      parsed.extractedContent = extractedContent;
      return parsed;
    } catch (error: any) {
      console.error("Error generating questions:", error);
      throw error;
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // generateFlashcards — reads from session.content plain text
  // ───────────────────────────────────────────────────────────────────────────
  async generateFlashcards(
    subtopicName: string,
    fullContent: string,
  ): Promise<GeminiFlashcardOutput> {
    try {
      const prompt = `You are an expert educator AI.
Generate exactly 20 flashcards** based strictly and only on the content provided.
Do NOT pull information from outside the content.
Focus ONLY on the subtopic: "${subtopicName}"

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
    { "term": "string", "definition": "string", "subtopic": "${subtopicName}" }
  ]
}

Now generate exactly **20** flashcards.`;

      const result = await this.generateWithFallback(async (model) => {
        return await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${prompt}\n\nCONTENT TO STUDY:\n${fullContent.slice(0, 50000)}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
          },
        });
      });

      const response = await result.response;
      const rawText = response.text();
      if (!rawText) throw new Error("Empty response from Gemini");

      const flashcardOutput = safeParseJson<GeminiFlashcardOutput>(
        rawText,
        "generateFlashcards",
      );

      if (!flashcardOutput || !Array.isArray(flashcardOutput.flashcards)) {
        throw new Error("Invalid flashcard structure from Gemini");
      }
      return flashcardOutput;
    } catch (error: any) {
      console.error("Error generating flashcards:", error);
      throw error;
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // generateSummary — reads from session.content plain text
  // ───────────────────────────────────────────────────────────────────────────
  async generateSummary(
    subtopicName: string,
    fullContent: string,
  ): Promise<string> {
    try {
      const prompt = `You are a concise, analytical AI.
Produce ONLY valid JSON (no markdown, no comments, no formatting outside JSON).
Your job: summarize the given subtopic into 3 panels + 1 analogy + 3 short key takeaways.
subtopicName: ${subtopicName}

OUTPUT JSON SCHEMA:
{
  "subtopic": "<subtopicName>",
  "panels": {
    "panel1": { "trigger": "...", "function": "..." },
    "panel2": { "mechanism1": "...", "mechanism2": "..." },
    "panel3": { "goal1": "...", "goal2": "...", "conclusion": "..." }
  },
  "analogy": "<1–2 line analogy>",
  "takeaways": ["Short takeaway 1", "Short takeaway 2", "Short takeaway 3"]
}

RULES:
1) Use ONLY the provided content.
2) Keep outputs short, crisp, and compact.
3) No markdown, no backticks, no code fences, no extra keys.`;

      const result = await this.generateWithFallback(async (model) => {
        return await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${prompt}\n\nCONTENT:\n${fullContent.slice(0, 50000)}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
          },
        });
      });

      const response = await result.response;
      const generatedText = response.text();
      if (!generatedText || typeof generatedText !== "string")
        throw new Error("Invalid response from Gemini");
      return generatedText.trim();
    } catch (error: any) {
      console.error("Error generating summary:", error);
      throw error;
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // generateSimilarQuestions — reads from session.content plain text
  // ───────────────────────────────────────────────────────────────────────────
  async generateSimilarQuestions(
    subtopicName: string,
    fullContent: string,
  ): Promise<GeminiSimilarQuestionsOutput> {
    try {
      const prompt = `You are an expert examiner.
Generate exactly 20 high-quality, unique multiple-choice questions based ONLY on the subtopic: "${subtopicName}" from the content provided.

### RULES:
1. Use ONLY the provided content. Do not use outside knowledge.
2. Style: Questions clear and concise (under 15 words).
3. Options: Exactly 4 options per question (1-4 words each).
4. Difficulty: Vary between Easy, Medium, Hard.
5. Format: Return ONLY valid JSON. No markdown, no backticks.

### SCHEMA:
{
  "topic": "${subtopicName}",
  "questionList": [
    { "question": "string", "options": ["option1","option2","option3","option4"], "correctAnswer": 0, "explanation": "string", "difficulty": "Easy" }
  ]
}`;

      const result = await this.generateWithFallback(async (model) => {
        return await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${prompt}\n\nCONTENT:\n${fullContent.slice(0, 50000)}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
          },
        });
      });

      const response = await result.response;
      const parsed = safeParseJson<GeminiSimilarQuestionsOutput>(
        response.text(),
        "generateSimilarQuestions",
      );

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

  // ───────────────────────────────────────────────────────────────────────────
  // generateExtraQuestions — reads from session.content plain text
  // ───────────────────────────────────────────────────────────────────────────
  async generateExtraQuestions(
    subtopicName: string,
    fullContent: string,
    existingQuestions: string[],
  ): Promise<Question[]> {
    try {
      const prompt = `
You are an Advanced Academic MCQ Generator.

Generate EXACTLY 10 NEW and UNIQUE multiple-choice questions 
for the subtopic: "${subtopicName}".

These are ADDITIONAL questions for the SAME section.
Do NOT regenerate foundational or already-covered ideas.

=====================
STRICT RULES
=====================

1. Do NOT repeat or rephrase these existing questions:
${existingQuestions?.length ? existingQuestions.join(" | ") : "None"}

2. Extend coverage deeper into the subtopic.
3. Focus on higher-order thinking where possible.
4. Avoid repeating definitions unless necessary.
5. Questions must feel like continuation, not restart.

=====================
DIFFICULTY MIX
=====================

Include balanced mix of:
- Easy (core understanding)
- Medium (why/how reasoning)
- Hard (application / analytical / scenario)

Do NOT arrange in predictable order.

=====================
FORMAT RULES
=====================

• All questions must be MCQ.
• 4 options only.
• Only ONE correct answer.
• Plausible distractors.
• Clear explanation required.
• Avoid trivial wording.
• Avoid repetitive patterns.

=====================
OUTPUT RULES
=====================

1. Output ONLY raw JSON.
2. No markdown.
3. No comments.
4. Use double quotes only.
5. No trailing commas.
6. Total questions MUST equal 10.
7. Final character MUST be "}".

=====================
SCHEMA
=====================

{
  "questions": [
    {
      "question": "string",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Clear academic explanation",
      "difficulty": "Easy | Medium | Hard"
    }
  ]
}
`;

      const result = await this.generateWithFallback(async (model) => {
        return await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${prompt}\n\nSOURCE:\n${fullContent.slice(0, 50000)}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
          },
        });
      });

      const response = await result.response;
      const data = safeParseJson<{ questions: any[] }>(
        response.text(),
        "generateExtraQuestions",
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

  // ───────────────────────────────────────────────────────────────────────────
  // generateBlastPairs — reads from session.content plain text
  // ───────────────────────────────────────────────────────────────────────────
  async generateBlastPairs(
    content: string,
  ): Promise<{ term: string; definition: string }[]> {
    try {
      const prompt = `Generate exactly 20 term-definition pairs based ONLY on the given content.
Each "term" must be short (1–2 words).
Each "definition" must be simple (3-4 words).
Output ONLY pure JSON. No markdown. No extra text.

SCHEMA:
{
  "pairs": [
    { "term": "string", "definition": "string" }
  ]
}`;

      const result = await this.generateWithFallback(async (model) => {
        return await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${prompt}\n\nCONTENT:\n${content.slice(0, 50000)}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 4096,
            responseMimeType: "application/json",
          },
        });
      });

      const response = await result.response;
      const data = safeParseJson<{
        pairs: { term: string; definition: string }[];
      }>(response.text(), "generateBlastPairs");
      return data.pairs;
    } catch (error: any) {
      console.error("Error generating blast pairs:", error);
      throw error;
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ───────────────────────────────────────────────────────────────────────────

  private _buildQuestionsPrompt(
    subject: string,
    targetCount: number,
    textContent: string | null,
  ): string {
    return `You are a Professional Academic Assessment Designer.

### INSTRUCTION:
Carefully examine the SOURCE below.
Ignore navigation links, UI elements, ads, headers, footers, and noise and do not say in quesiton lke according to this doc or file or video just straight quesitons.
Focus ONLY on the core educational concepts of ${subject}.

${
  textContent
    ? `--- SOURCE ---\n${textContent}\n--- END ---`
    : "--- SOURCE FILE (attached as inlineData above) ---"
}

---

### STRUCTURE STRATEGY:

1. FIRST analyze whether the source already contains clear sections or headings.
2. If clear sections exist → follow them exactly.
3. If not → divide logically based on conceptual boundaries.
4. Do NOT force a fixed number of sections.
5. Ensure COMPLETE coverage of the entire source.

---

### QUESTION DISTRIBUTION STRATEGY:

Generate EXACTLY ${targetCount} questions.

Distribute questions proportionally across sections based on content weight.

Within EACH section:

• First 30% → Basic understanding (definitions, direct ideas)
• Next 40% → Conceptual reasoning (why/how)
• Final 30% → Application, scenario-based, analytical

Difficulty progression must occur INSIDE every section individually.

Each section must contain a balanced mix of:
"Easy" | "Medium" | "Hard"

Do NOT arrange difficulty progressively across the entire quiz.
Progression must reset within each section.

Example (per section):
Easy → Medium → Hard  
Easy → Medium → Hard  
(not globally from start to end)

Ensure difficulty labeling reflects actual cognitive demand.

### QUESTION TYPE MIX (ALL MUST BE MCQ FORMAT):

Include a balanced mix of:

1. Direct conceptual questions
2. Why / How /What /Who questions
3. Fill-in-the-blank (converted into 4-option MCQ)
4. True/False (converted into 4-option MCQ)
5. Application-based scenarios
6. Small case-based reasoning
7. Assertion-Reason style
8. Multi-step reasoning questions

IMPORTANT:
- Even True/False and Fill blanks MUST have 4 selectable options.
- No typing answers.
- Only one correct answer.
- Avoid making ALL questions too long.
- Avoid making ALL questions too short.
- Keep natural variation in length.

---

### STYLE GUIDELINES:

• Some questions can be short try to keep it short simple.
• Some can be medium-length try to keep short simle.
• A few can be descriptive try to keep short simple.
• Options should be meaningful and plausible try to keep short simple.
• Avoid trivial distractors.
• Avoid repeating patterns.
• Explanation must clearly justify the correct answer.
• Analogy should simplify the idea in real-world terms.


---

### CRITICAL JSON RULES:

You MUST:

1. Output ONLY valid raw JSON.
2. Do NOT wrap in markdown.
3. Do NOT include comments.
4. Use double quotes only.
5. No trailing commas.
6. Close all brackets and braces.
7. Ensure total question count = ${targetCount}.
8. Ensure JSON is syntactically valid before finishing.

The final character MUST be "}".

---

### SCHEMA:

{
  "mainTopic": "string",
  "majorSubject": "string",
  "svgTopicTitle": "string",
  "subtopicGroups": [
    {
      "subtopicName": "Section Name",
      "questions": [
        {
          "question": "string",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": NUMBER (0-3),
          "explanation": "Clear explanation",
          "difficulty": "Easy | Medium | Hard",
          "analogy": "Simple real-world comparison"
        }
      ]
    }
  ]
}
`;
  }
  private _buildContentExtractionPrompt(
    subject: string,
    lessonTopic: string,
  ): string {
    return `You are an expert academic content extractor.
Your job is to extract and preserve ALL important educational content from the provided material.

Subject: ${subject}
Topic: ${lessonTopic}

EXTRACTION RULES:
1. Extract EVERY concept, definition, fact, process, formula, example, and explanation present.
2. Be EXHAUSTIVE — do not skip any section, chapter, slide, scene, or spoken segment.
3. Organize by subtopics or chapters as they appear in the material.
4. Include ALL of: definitions, key terms, full explanations, examples, data, processes, relationships, conclusions, analogies, numerical values, and formulas.
5. AUDIO / VIDEO: transcribe and extract all spoken educational content including stories, examples, and figures mentioned.
6. IMAGES: describe and extract all visible educational information — diagrams, labels, charts, text, annotations, tables.
7. PDF / DOCX / TXT: extract all body text, captions, tables, footnotes, headers, and sidebars.
8. Write in clear dense prose organized by subtopic. Plain text only — no bullet points, no markdown headers, no JSON.
9. Output must be comprehensive enough to independently generate:
   25+ unique multiple-choice quiz questions, 20+ flashcard term-definition pairs,
   a detailed multi-panel summary for each subtopic, and 8+ blast word-definition pairs.
10. Length: Be as long as necessary. DO NOT truncate or abbreviate anything.
11. Cover EVERY corner — leave no concept, example, or explanation out.

Output ONLY the extracted educational content as plain text. No JSON. No preamble. No closing remarks.`;
  }

  private _parseQuestionsResponse(
    response: any,
    subject: string,
  ): GeminiQuizOutput {
    const rawText = response.text() ?? "";

    // Use safeParseJson which handles truncation repair automatically
    const rawOutput = safeParseJson<any>(rawText, "generateQuestions");

    const flattenedQuestions: any[] = [];
    const subtopicSummaries: any[] = [];

    const groups: any[] = Array.isArray(rawOutput.subtopicGroups)
      ? rawOutput.subtopicGroups
      : [];

    groups.forEach((group: any) => {
      if (!group || typeof group !== "object") return;
      const questions: any[] = Array.isArray(group.questions)
        ? group.questions
        : [];
      subtopicSummaries.push({
        name: group.subtopicName || "General",
        totalQuestions: questions.length,
        weakness: 0,
      });
      questions.forEach((q: any) => {
        if (!q || typeof q !== "object") return;
        flattenedQuestions.push({
          ...q,
          id: Math.random().toString(36).substr(2, 9),
          subtopic: group.subtopicName || "General",
          topic: rawOutput.mainTopic || subject,
          type: "Multiple Choice",
          // Ensure required fields are never undefined
          question: q.question ?? "",
          options: Array.isArray(q.options) ? q.options : ["A", "B", "C", "D"],
          correctAnswer:
            typeof q.correctAnswer === "number" ? q.correctAnswer : 0,
          explanation: q.explanation ?? "",
          difficulty: q.difficulty ?? "Medium",
          analogy: q.analogy ?? "",
        });
      });
    });

    return {
      mainTopic: rawOutput.mainTopic ?? subject,
      majorSubject: rawOutput.majorSubject ?? subject,
      svgTopicTitle: rawOutput.svgTopicTitle ?? subject,
      subject,
      subtopics: subtopicSummaries,
      questionList: flattenedQuestions,
      extractedContent: "", // filled in generateQuestions() after parallel call
    };
  }
}
