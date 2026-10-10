import { Module } from "@nestjs/common";
import { AIConciergeModule } from "./concierge/ai-concierge.module";
import { AIProductReviewModule } from "./product-review/ai-product-review.module";
@Module({ imports: [AIConciergeModule, AIProductReviewModule] })
export class AIModule {}
