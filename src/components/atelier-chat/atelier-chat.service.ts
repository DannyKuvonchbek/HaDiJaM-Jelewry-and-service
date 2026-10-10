import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AtelierChatInquiry } from '../../libs/dto/atelier-chat/atelier-chat.input';
import { AtelierChatMessages, AtelierConversation } from '../../libs/dto/atelier-chat/atelier-chat';
import { MemberType } from '../../libs/enums/member.enum';

export const ATELIER_SLUGS = ['kang-and-sons', 'aurum-gemological-lab', 'milano-heritage-restoration'];

@Injectable()
export class AtelierChatService {
	constructor(
		@InjectModel('AtelierChatMessage') private readonly messageModel: Model<any>,
		@InjectModel('Member') private readonly memberModel: Model<any>,
	) {}

	public isOwner(member: any): boolean { return member.memberType === MemberType.SELLER && String(member.memberNick).toLowerCase() === 'danny'; }

	public async owner() {
		const owner: any = await this.memberModel.findOne({ memberType: MemberType.SELLER, memberNick: /^DANNY$/i, memberStatus: 'ACTIVE' }).lean().exec();
		if (!owner) throw new InternalServerErrorException('Atelier inbox is unavailable.');
		return owner;
	}

	public async canSellerOpenCustomer(customerId: string): Promise<boolean> {
		if (!Types.ObjectId.isValid(customerId)) return false;
		const customer = await this.memberModel.findOne({ _id: customerId, memberType: MemberType.USER, memberStatus: 'ACTIVE' }).select('_id').lean().exec();
		if (!customer) return false;
		return Boolean(await this.messageModel.exists({ customerId }).exec());
	}

	public async messages(member: any, atelier: string, customerId: string, input: AtelierChatInquiry): Promise<AtelierChatMessages> {
		this.assertAtelier(atelier);
		if (!Types.ObjectId.isValid(customerId)) throw new BadRequestException('Invalid client.');
		const owner = await this.owner();
		if (!this.isOwner(member) && String(member._id) !== customerId) throw new BadRequestException('This conversation is private.');
		if (this.isOwner(member) && String(owner._id) !== String(member._id)) throw new BadRequestException('This conversation is private.');
		const match = { atelier, customerId: new Types.ObjectId(customerId) };
		const [result] = await this.messageModel.aggregate([
			{ $match: match }, { $sort: { createdAt: -1 } },
			{ $facet: { list: [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }], metaCounter: [{ $count: 'total' }] } },
		]);
		return { list: (result?.list ?? []).reverse(), metaCounter: result?.metaCounter ?? [] };
	}

	public async conversations(member: any, atelier: string): Promise<AtelierConversation[]> {
		this.assertAtelier(atelier);
		if (!this.isOwner(member)) throw new BadRequestException('Only the atelier team can view the inbox.');
		const owner = await this.owner();
		if (String(owner._id) !== String(member._id)) throw new BadRequestException('Only the atelier team can view the inbox.');
		return this.messageModel.aggregate([
			{ $match: { atelier } }, { $sort: { createdAt: -1 } },
			{ $group: { _id: '$customerId', lastMessage: { $first: '$messageContent' }, lastMessageAt: { $first: '$createdAt' }, senderId: { $first: '$senderId' } } },
			{ $lookup: { from: 'members', localField: '_id', foreignField: '_id', as: 'customer' } },
			{ $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
			{ $project: { _id: 0, customerId: { $toString: '$_id' }, customerNick: '$customer.memberNick', customerImage: '$customer.memberImage', lastMessage: 1, lastMessageAt: 1, unreadCount: { $literal: 0 } } },
			{ $sort: { lastMessageAt: -1 } },
		]);
	}

	public async saveMessage(input: { atelier: string; customerId: string; sender: any; owner: any; messageContent: string; attachments: string[] }) {
		this.assertAtelier(input.atelier);
		const messageContent = input.messageContent.trim();
		const attachments = (input.attachments ?? []).filter((path) => typeof path === 'string' && /^uploads\/(atelier|reviews)\//.test(path)).slice(0, 4);
		if (!messageContent && !attachments.length) throw new BadRequestException('Write a message or attach a file.');
		if (messageContent.length > 3000) throw new BadRequestException('Message is too long.');
		return this.messageModel.create({ atelier: input.atelier, customerId: input.customerId, senderId: input.sender._id, recipientId: input.sender._id.toString() === input.owner._id.toString() ? input.customerId : input.owner._id, senderNick: input.sender.memberNick, senderImage: input.sender.memberImage, messageContent, attachments });
	}

	private assertAtelier(atelier: string) { if (!ATELIER_SLUGS.includes(atelier)) throw new BadRequestException('Unknown atelier.'); }
}
