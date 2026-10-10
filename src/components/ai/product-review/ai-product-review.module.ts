import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import ProductSchema from "../../../schemas/Product.model";
import AIProductReviewSchema from "../../../schemas/AIProductReview.model";
import { AuthModule } from "../../auth/auth.module";
import { AIProviderModule } from "../shared/ai-provider.module";
import { AIProductReviewResolver } from "./ai-product-review.resolver";
import { AIProductReviewService } from "./ai-product-review.service";
@Module({
  imports: [
    AuthModule,
    AIProviderModule,
    MongooseModule.forFeature([
      { name: "Product", schema: ProductSchema },
      { name: "AIProductReview", schema: AIProductReviewSchema },
    ]),
  ],
  providers: [AIProductReviewResolver, AIProductReviewService],
})
export class AIProductReviewModule {}
