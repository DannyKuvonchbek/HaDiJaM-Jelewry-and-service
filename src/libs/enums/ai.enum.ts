import { registerEnumType } from "@nestjs/graphql";
export enum AIConversationLocale {
  EN = "en",
  UZ = "uz",
  KO = "ko",
  RU = "ru",
}
registerEnumType(AIConversationLocale, { name: "AIConversationLocale" });
export enum AIProductRiskLevel {
  LOW = "LOW",
  REVIEW = "REVIEW",
  HIGH = "HIGH",
}
registerEnumType(AIProductRiskLevel, { name: "AIProductRiskLevel" });
