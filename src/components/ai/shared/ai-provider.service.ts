import {
  Inject,
  Injectable,
  Optional,
  ServiceUnavailableException,
} from "@nestjs/common";
import {
  AIProvider,
  AI_TEXT_PROVIDER,
  AIProductContext,
} from "./ai-provider.interface";
@Injectable()
export class AIProviderService {
  constructor(
    @Optional()
    @Inject(AI_TEXT_PROVIDER)
    private readonly provider?: AIProvider,
  ) {}
  public get isConfigured(): boolean {
    const configuredProvider = process.env.AI_PROVIDER ?? this.provider?.providerName;
    const configuredModel = process.env.AI_MODEL ?? this.provider?.modelName;
    return Boolean(
      this.provider &&
      configuredProvider === this.provider.providerName &&
      configuredModel &&
      process.env.AI_API_KEY,
    );
  }
  public get providerName(): string {
    return (
      this.provider?.providerName ?? process.env.AI_PROVIDER ?? "not-configured"
    );
  }
  public get modelName(): string {
    return this.provider?.modelName ?? process.env.AI_MODEL ?? "not-configured";
  }
  public answerConcierge(input: {
    systemPrompt: string;
    question: string;
    locale: string;
    products: unknown[];
    services: unknown[];
    history: Array<{ role: string; content: string }>;
  }): Promise<string> {
    if (!this.isConfigured || !this.provider)
      throw new ServiceUnavailableException(
        "AI provider is not configured. Add a provider adapter and server-side credentials to enable AI replies.",
      );
    return this.provider.answerConcierge(input);
  }
  public reviewProduct(input: {
    systemPrompt: string;
    product: AIProductContext;
  }) {
    if (!this.isConfigured || !this.provider)
      throw new ServiceUnavailableException(
        "AI provider is not configured. Add a provider adapter and server-side credentials to enable product reviews.",
      );
    return this.provider.reviewProduct(input);
  }
}
