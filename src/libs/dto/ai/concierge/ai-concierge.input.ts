import { Field, InputType } from "@nestjs/graphql";
import { IsEnum, IsNotEmpty, IsOptional, MaxLength } from "class-validator";
import { AIConversationLocale } from "../../../enums/ai.enum";
@InputType()
export class AIConciergeMessageInput {
  @IsOptional()
  @Field(() => String, { nullable: true })
  conversationId?: string;
  @IsNotEmpty() @MaxLength(2000) @Field(() => String) message!: string;
  @IsEnum(AIConversationLocale)
  @Field(() => AIConversationLocale)
  locale!: AIConversationLocale;
}
