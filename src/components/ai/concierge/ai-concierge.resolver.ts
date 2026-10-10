import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";
import { AuthMember } from "../../auth/decorators/authMember.decorator";
import { AuthGuard } from "../../auth/guards/auth.guard";
import { WithoutGuard } from "../../auth/guards/without.guard";
import { AIConciergeMessageInput } from "../../../libs/dto/ai/concierge/ai-concierge.input";
import {
  AIConciergeMessage,
  AIConciergeReply,
  AIConversationSummary,
} from "../../../libs/dto/ai/concierge/ai-concierge";
import { AIConciergeService } from "./ai-concierge.service";
@Resolver()
export class AIConciergeResolver {
  constructor(private readonly concierge: AIConciergeService) {}
  @UseGuards(WithoutGuard)
  @Mutation(() => AIConciergeReply)
  sendAIConciergeMessage(
    @Args("input") input: AIConciergeMessageInput,
    @AuthMember("_id") memberId?: string,
  ) {
    return this.concierge.send(memberId, input);
  }
  @UseGuards(AuthGuard)
  @Query(() => [AIConversationSummary])
  getMyAIConversations(@AuthMember("_id") memberId: string) {
    return this.concierge.conversations(memberId);
  }
  @UseGuards(AuthGuard)
  @Query(() => [AIConciergeMessage])
  getMyAIConversationMessages(
    @Args("conversationId") conversationId: string,
    @AuthMember("_id") memberId: string,
  ) {
    return this.concierge.messages(memberId, conversationId);
  }
}
