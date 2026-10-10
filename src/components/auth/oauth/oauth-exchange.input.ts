import { Field, InputType } from "@nestjs/graphql";
import { IsString, Length } from "class-validator";

@InputType()
export class OAuthExchangeInput {
  @Field(() => String)
  @IsString()
  @Length(32, 200)
  ticket!: string;
}
