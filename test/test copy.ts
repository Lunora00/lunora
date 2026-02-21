import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function run() {
  try {
    // 👇 CHANGE FILE PATH HERE
    const filePath = "./clown1.png"; 
    const prompt = "Explain this file in detail";

    if (!fs.existsSync(filePath)) {
      console.log("File not found");
      return;
    }

    const fileBuffer = fs.readFileSync(filePath);
    const base64Data = fileBuffer.toString("base64");

    const mimeType = getMimeType(filePath);

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro"
    });

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
    case ".doc":
    case ".docx":
      return "application/msword";
    default:
      return "application/octet-stream";
  }
}
