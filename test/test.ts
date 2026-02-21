import fs from "fs";
import path from "path";
import mammoth from "mammoth";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyA8QpQSP7jxehj6C22_blFKvEo7uAnu7cw");

async function run() {
  try {
    const filePath = "./audio.wav";
    const prompt = "give me a detailed summaary of this file each corner should be covered";

    if (!fs.existsSync(filePath)) {
      console.log("File not found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
    });

    // 🧠 DOCX handling via Mammoth
    if (ext === ".docx") {
      console.log("Reading DOCX via Mammoth...\n");

      const result = await mammoth.extractRawText({ path: filePath });
      const extractedText = result.value;

      const response = await model.generateContent([
        {
          text: `
          ${prompt}

          CONTENT:
          ${extractedText}
          `
        }
      ]);

      console.log("\n===== GEMINI RESPONSE =====\n");
      console.log(response.response.text());
      return;
    }

    // 📦 Other files → normal inline upload
    const fileBuffer = fs.readFileSync(filePath);
    const base64Data = fileBuffer.toString("base64");
    const mimeType = getMimeType(filePath);

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
      {
        text: prompt
      }
    ]);

    const response = await result.response;

    console.log("\n===== GEMINI RESPONSE =====\n");
    console.log(response.text());

  } catch (err) {
    console.error("Error:", err);
  }
}

run();


// Detect file type automatically
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();

  switch (ext) {
    case ".pdf":
      return "application/pdf";
    case ".mp3":
      return "audio/mpeg";
    case ".wav":
      return "audio/wav";
    case ".mp4":
      return "video/mp4";
    case ".mov":
      return "video/quicktime";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".txt":
      return "text/plain";
    default:
      return "application/octet-stream";
  }
}
