export const AI_TEXT_PROVIDER = "AI_TEXT_PROVIDER";
export interface AIProductImage {
  mimeType: string;
  base64: string;
}
export interface AIProductContext {
  title: string;
  description: string;
  price: number;
  status: string;
  images: AIProductImage[];
}
export interface AIProvider {
  readonly providerName: string;
  readonly modelName: string;
  answerConcierge(input: {
    systemPrompt: string;
    question: string;
    locale: string;
    products: unknown[];
    services: unknown[];
    history: Array<{ role: string; content: string }>;
  }): Promise<string>;
  reviewProduct(input: {
    systemPrompt: string;
    product: AIProductContext;
  }): Promise<{
    riskLevel: "LOW" | "REVIEW" | "HIGH";
    findings: string[];
    summary: string;
    sellerMessageDraft: string;
  }>;
}
