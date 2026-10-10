import { Module } from "@nestjs/common";
import { AI_TEXT_PROVIDER } from "./ai-provider.interface";
import { AIProviderService } from "./ai-provider.service";
import { OpenAIProvider } from "./openai/openai-provider";

@Module({
  providers: [
    AIProviderService,
    OpenAIProvider,
    { provide: AI_TEXT_PROVIDER, useExisting: OpenAIProvider },
  ],
  exports: [AIProviderService],
})
export class AIProviderModule {}
