import { Supadata, SupadataError } from "@supadata/js";

const API_KEY = process.env.NEXT_PUBLIC_SUPADATA_API_KEY!;

export type SourceType = "youtube" | "social" | "web";

export interface PageTextResult {
  type: SourceType;
  text: string;
  title?: string;
}

export class SupadataService {
  private supadata: Supadata;

  constructor() {
    if (!API_KEY) {
      throw new Error("SUPADATA API KEY missing");
    }

    this.supadata = new Supadata({
      apiKey: API_KEY,
    });
  }

  // ✅ KEEP THIS — your app expects it
  async processUrl(url: string): Promise<PageTextResult> {
    return this.extractTextFromUrl(url);
  }

  // 🔥 MAIN ENTRY
  async extractTextFromUrl(url: string): Promise<PageTextResult> {
    try {
      if (this.isVideoOrSocial(url)) {
        return await this.extractTranscript(url);
      }

      return await this.extractWebPage(url);

    } catch (error) {
      console.error("Supadata error:", error);

      if (error instanceof SupadataError) {
        throw new Error(error.message);
      }

      throw new Error("Failed to extract text from URL");
    }
  }

  // ----------------------------
  // VIDEO / SOCIAL TRANSCRIPT
  // ----------------------------
  private async extractTranscript(url: string): Promise<PageTextResult> {
    let result: any = await this.supadata.transcript({
      url,
      text: true,
      mode: "auto",
    });

    // Handle async job
    if (result && "jobId" in result) {
      result = await this.waitForTranscript(result.jobId);
    }

    if (!result?.content) {
      throw new Error("Transcript not available");
    }

    return {
      type: url.includes("youtube.com") || url.includes("youtu.be")
        ? "youtube"
        : "social",
      text: this.normalizeText(result.content),
      title: result.title || "Untitled",
    };
  }

  // ----------------------------
  // SINGLE WEB PAGE SCRAPE
  // ----------------------------
  private async extractWebPage(url: string): Promise<PageTextResult> {
    const page = await this.supadata.web.scrape(url);

    if (!page?.content || page.content.trim().length === 0) {
      throw new Error("No readable content found on page");
    }

    return {
      type: "web",
      text: this.normalizeText(page.content),
      title: page.name,
    };
  }

  // ----------------------------
  // HELPERS
  // ----------------------------
  private async waitForTranscript(jobId: string) {
    while (true) {
      await this.sleep(2000);
      const job = await this.supadata.transcript.getJobStatus(jobId);

      if (job.status === "completed") return job.result;
      if (job.status === "failed") {
        throw new Error("Transcript job failed");
      }
    }
  }

  private isVideoOrSocial(url: string): boolean {
    return (
      url.includes("youtube.com") ||
      url.includes("youtu.be") ||
      url.includes("tiktok.com") ||
      url.includes("instagram.com") ||
      url.includes("x.com")
    );
  }

  private normalizeText(content: any): string {
    if (typeof content === "string") return content;
    return JSON.stringify(content);
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
