import { Field, Float, ObjectType } from "@nestjs/graphql";
import { AIConversationLocale } from "../../../enums/ai.enum";
@ObjectType()
export class AIConciergeAction {
  @Field(() => String) label!: string;
  @Field(() => String) href!: string;
}
@ObjectType()
export class AIConciergeProduct {
  @Field(() => String) _id!: string;
  @Field(() => String) productTitle!: string;
  @Field(() => String) productType!: string;
  @Field(() => Float) productPrice!: number;
  @Field(() => [String]) productImages!: string[];
}
@ObjectType()
export class AIConciergeMessage {
  @Field(() => String) _id!: string;
  @Field(() => String) role!: string;
  @Field(() => String) content!: string;
  @Field(() => AIConversationLocale) locale!: AIConversationLocale;
  @Field(() => Date) createdAt!: Date;
  @Field(() => AIConciergeAction, { nullable: true }) action?: AIConciergeAction;
}
@ObjectType()
export class AIConversationSummary {
  @Field(() => String) _id!: string;
  @Field(() => String) conversationTitle!: string;
  @Field(() => Date) lastMessageAt!: Date;
}
@ObjectType()
export class AIConciergeReply {
  @Field(() => String) answer!: string;
  @Field(() => String, { nullable: true }) conversationId?: string;
  @Field(() => [AIConciergeProduct]) recommendedProducts!: AIConciergeProduct[];
  @Field(() => AIConciergeAction, { nullable: true }) action?: AIConciergeAction;
}
