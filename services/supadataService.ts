import { Supadata, SupadataError } from "@supadata/js";

const API_KEYS = [
  process.env.NEXT_PUBLIC_SUPADATA_API_KEY,
  process.env.NEXT_PUBLIC_SUPADATA_API_KEY_1,
  process.env.NEXT_PUBLIC_SUPADATA_API_KEY_2,
  process.env.NEXT_PUBLIC_SUPADATA_API_KEY_3,
  process.env.NEXT_PUBLIC_SUPADATA_API_KEY_4,
].filter(Boolean) as string[];

export type SourceType = "youtube" | "social" | "web";

export interface PageTextResult {
  type: SourceType;
  text: string;
  title?: string;
}

export class SupadataService {
  private clients: Supadata[];

  constructor() {
    if (API_KEYS.length === 0) {
      throw new Error("No Supadata API keys found");
    }

    this.clients = API_KEYS.map(
      (key) =>
        new Supadata({
          apiKey: key,
        })
    );
  }

  // ✅ KEEP THIS
  async processUrl(url: string): Promise<PageTextResult> {
    return this.extractTextFromUrl(url);
  }

  // 🔥 MAIN ENTRY WITH FALLBACK
  async extractTextFromUrl(url: string): Promise<PageTextResult> {
    let lastError: any;

    for (const client of this.clients) {
      try {
        if (this.isVideoOrSocial(url)) {
          return await this.extractTranscript(client, url);
        }

        return await this.extractWebPage(client, url);

      } catch (error) {
        console.warn("Supadata key failed, trying next...");
        lastError = error;
      }
    }

    if (lastError instanceof SupadataError) {
      throw new Error(lastError.message);
    }

    throw new Error("All Supadata API keys failed");
  }

  // ----------------------------
  // VIDEO / SOCIAL TRANSCRIPT
  // ----------------------------
  private async extractTranscript(
    client: Supadata,
    url: string
  ): Promise<PageTextResult> {
    let result: any = await client.transcript({
      url,
      text: true,
      mode: "auto",
    });

    if (result && "jobId" in result) {
      result = await this.waitForTranscript(client, result.jobId);
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
  // WEB PAGE SCRAPE
  // ----------------------------
  private async extractWebPage(
    client: Supadata,
    url: string
  ): Promise<PageTextResult> {
    const page = await client.web.scrape(url);

    if (!page?.content || page.content.trim().length === 0) {
      throw new Error("No readable content found");
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
  private async waitForTranscript(client: Supadata, jobId: string) {
    while (true) {
      await this.sleep(2000);
      const job = await client.transcript.getJobStatus(jobId);

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
