import { Field, ObjectType } from "@nestjs/graphql";
import { AIProductRiskLevel } from "../../../enums/ai.enum";
@ObjectType()
export class AIProductReview {
  @Field(() => String) _id!: string;
  @Field(() => String) productId!: string;
  @Field(() => AIProductRiskLevel) riskLevel!: AIProductRiskLevel;
  @Field(() => [String]) findings!: string[];
  @Field(() => String) analysisSummary!: string;
  @Field(() => String) sellerMessageDraft!: string;
  @Field(() => String) provider!: string;
  @Field(() => String) model!: string;
  @Field(() => Date) updatedAt!: Date;
}
