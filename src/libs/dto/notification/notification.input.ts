import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, Length } from 'class-validator';

@InputType()
export class AdminProductReviewMessageInput {
  @IsString()
  @IsNotEmpty()
  @Field(() => String)
  productId!: string;

  @IsString()
  @Length(10, 2000)
  @Field(() => String)
  message!: string;
}
