import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Follow } from '../../libs/dto/follow/follow';
import { FollowInquiry } from '../../libs/dto/follow/follow.input';
import { Direction, Message } from '../../libs/enums/common.enum';

@Injectable()
export class FollowService {
	constructor(
		@InjectModel('Follow') private readonly followModel: Model<Follow>,
		@InjectModel('Member') private readonly memberModel: Model<any>,
	) {}

	public async subscribe(followerId: string, followingId: string): Promise<Follow> {
		if (followerId === followingId) throw new BadRequestException(Message.SELF_SUBSCRIPTION_DENIED);
		const target = await this.memberModel.findById(followingId).exec();
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		try {
			const follow = await this.followModel.create({ followerId, followingId });
			await Promise.all([
				this.memberModel.findByIdAndUpdate(followerId, { $inc: { memberFollowings: 1 } }).exec(),
				this.memberModel.findByIdAndUpdate(followingId, { $inc: { memberFollowers: 1 } }).exec(),
			]);
			return follow;
		} catch {
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async unsubscribe(followerId: string, followingId: string): Promise<Follow> {
		const follow = await this.followModel.findOneAndDelete({ followerId, followingId }).exec();
		if (!follow) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		await Promise.all([
			this.memberModel.findByIdAndUpdate(followerId, { $inc: { memberFollowings: -1 } }).exec(),
			this.memberModel.findByIdAndUpdate(followingId, { $inc: { memberFollowers: -1 } }).exec(),
		]);
		return follow;
	}

	public async getMemberFollowings(input: FollowInquiry): Promise<any> {
		const followerId = input.search.followerId;
		if (!followerId || !Types.ObjectId.isValid(followerId)) throw new BadRequestException(Message.BAD_REQUEST);
		return this.list(input, { followerId }, 'followingId', 'followingData');
	}

	public async getMemberFollowers(input: FollowInquiry): Promise<any> {
		const followingId = input.search.followingId;
		if (!followingId || !Types.ObjectId.isValid(followingId)) throw new BadRequestException(Message.BAD_REQUEST);
		return this.list(input, { followingId }, 'followerId', 'followerData');
	}

	private async list(input: FollowInquiry, match: Record<string, unknown>, memberField: string, dataField: string): Promise<any> {
		const [result] = await this.followModel.aggregate([
			{ $match: match },
			{ $sort: { createdAt: Direction.DESC } },
			{ $facet: {
				list: [
					{ $skip: (input.page - 1) * input.limit },
					{ $limit: input.limit },
					{ $lookup: { from: 'members', localField: memberField, foreignField: '_id', as: dataField } },
					{ $unwind: `$${dataField}` },
				],
				metaCounter: [{ $count: 'total' }],
			} },
		]);
		return result ?? { list: [], metaCounter: [] };
	}
}
