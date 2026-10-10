import { Field, Int, ObjectType } from '@nestjs/graphql';
import { TotalCounter } from '../member/member';

@ObjectType()
export class AtelierChatMessage {
	@Field(() => String) _id!: string;
	@Field(() => String) atelier!: string;
	@Field(() => String) senderId!: string;
	@Field(() => String) senderNick!: string;
	@Field(() => String, { nullable: true }) senderImage?: string;
	@Field(() => String) recipientId!: string;
	@Field(() => String) messageContent!: string;
	@Field(() => [String]) attachments!: string[];
	@Field(() => Date) createdAt!: Date;
}

@ObjectType()
export class AtelierChatMessages {
	@Field(() => [AtelierChatMessage]) list!: AtelierChatMessage[];
	@Field(() => [TotalCounter], { nullable: true }) metaCounter?: TotalCounter[];
}

@ObjectType()
export class AtelierConversation {
	@Field(() => String) customerId!: string;
	@Field(() => String, { nullable: true }) customerNick?: string;
	@Field(() => String, { nullable: true }) customerImage?: string;
	@Field(() => String) lastMessage!: string;
	@Field(() => Date) lastMessageAt!: Date;
	@Field(() => Int) unreadCount!: number;
}
