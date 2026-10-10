import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";
import { AuthMember } from "../../auth/decorators/authMember.decorator";
import { Roles } from "../../auth/decorators/roles.decorator";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { MemberType } from "../../../libs/enums/member.enum";
import { AIProductReviewInput } from "../../../libs/dto/ai/product-review/ai-product-review.input";
import { AIProductReview } from "../../../libs/dto/ai/product-review/ai-product-review";
import { AIProductReviewService } from "./ai-product-review.service";
@Resolver()
export class AIProductReviewResolver {
  constructor(private readonly reviewService: AIProductReviewService) {}
  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation(() => AIProductReview)
  analyzeProductWithAI(
    @Args("input") input: AIProductReviewInput,
    @AuthMember("_id") adminId: string,
  ) {
    return this.reviewService.analyze(adminId, input);
  }
  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Query(() => AIProductReview, { nullable: true })
  getAIProductReview(@Args("productId") productId: string) {
    return this.reviewService.get(productId);
  }
}
