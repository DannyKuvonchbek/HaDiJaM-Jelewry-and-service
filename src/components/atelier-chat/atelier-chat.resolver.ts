import { Args, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AtelierChatInquiry } from '../../libs/dto/atelier-chat/atelier-chat.input';
import { AtelierChatMessages, AtelierConversation } from '../../libs/dto/atelier-chat/atelier-chat';
import { AtelierChatService } from './atelier-chat.service';

@Resolver()
export class AtelierChatResolver {
	constructor(private readonly chatService: AtelierChatService) {}

	@UseGuards(AuthGuard)
	@Query(() => [AtelierConversation])
	getAtelierConversations(@Args('atelier') atelier: string, @AuthMember() member: any) {
		return this.chatService.conversations(member, atelier);
	}

	@UseGuards(AuthGuard)
	@Query(() => AtelierChatMessages)
	getAtelierChatMessages(@Args('atelier') atelier: string, @Args('customerId') customerId: string, @Args('input') input: AtelierChatInquiry, @AuthMember() member: any) {
		return this.chatService.messages(member, atelier, customerId, input);
	}
}
