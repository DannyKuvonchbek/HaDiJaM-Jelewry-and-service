import { Field, InputType } from "@nestjs/graphql";
import { IsMongoId, IsNotEmpty } from "class-validator";
@InputType()
export class AIProductReviewInput {
  @IsMongoId() @IsNotEmpty() @Field(() => String) productId!: string;
}
