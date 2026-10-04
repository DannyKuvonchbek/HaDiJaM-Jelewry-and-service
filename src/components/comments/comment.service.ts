import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Comment, Comments } from '../../libs/dto/comment/comment';
import { CommentInput, CommentsInquiry } from '../../libs/dto/comment/comment.input';
import { CommentUpdate } from '../../libs/dto/comment/comment.update';
import { Direction, Message } from '../../libs/enums/common.enum';
import { CommentGroup, CommentStatus } from '../../libs/enums/comment.enum';

@Injectable()
export class CommentService {
	constructor(
		@InjectModel('Comment') private readonly commentModel: Model<Comment>,
		@InjectModel('Member') private readonly memberModel: Model<any>,
		@InjectModel('Product') private readonly productModel: Model<any>,
		@InjectModel('Service') private readonly serviceModel: Model<any>,
		@InjectModel('BoardArticle') private readonly articleModel: Model<any>,
	) {}

	public async createComment(memberId: string, input: CommentInput): Promise<Comment> {
		if (!Types.ObjectId.isValid(input.commentRefId)) throw new BadRequestException(Message.BAD_REQUEST);
		let comment: Comment;
		try {
			comment = await this.commentModel.create({ ...input, memberId });
		} catch {
			throw new BadRequestException(Message.CREATE_FAILED);
		}
		const target = this.targetForGroup(input.commentGroup);
		if (target) await target.findByIdAndUpdate(input.commentRefId, { $inc: { [this.counterForGroup(input.commentGroup)]: 1 } }).exec();
		return comment;
	}

	public async updateComment(memberId: string, input: CommentUpdate): Promise<Comment> {
		const update = { ...input } as Record<string, unknown>;
		delete update._id;
		const comment = await this.commentModel.findOneAndUpdate(
			{ _id: input._id, memberId, commentStatus: CommentStatus.ACTIVE }, update, { new: true },
		).exec();
		if (!comment) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return comment;
	}

	public async getComments(input: CommentsInquiry): Promise<Comments> {
		const refId = input.search.commentRefId;
		if (!Types.ObjectId.isValid(refId)) throw new BadRequestException(Message.BAD_REQUEST);
		const [result] = await this.commentModel.aggregate([
			{ $match: { commentRefId: new Types.ObjectId(refId), commentStatus: CommentStatus.ACTIVE } },
			{ $sort: { [input.sort ?? 'createdAt']: input.direction ?? Direction.DESC } },
			{ $facet: { list: [
				{ $skip: (input.page - 1) * input.limit },
				{ $limit: input.limit },
				{ $lookup: { from: 'members', localField: 'memberId', foreignField: '_id', as: 'memberData' } },
				{ $unwind: '$memberData' },
			], metaCounter: [{ $count: 'total' }] } },
		]);
		return result ?? { list: [], metaCounter: [] };
	}

	public async removeCommentByAdmin(commentId: string): Promise<Comment> {
		const comment = await this.commentModel.findByIdAndDelete(commentId).exec();
		if (!comment) throw new InternalServerErrorException(Message.REMOVE_FAILED);
		const target = this.targetForGroup(comment.commentGroup);
		if (target) await target.findByIdAndUpdate(comment.commentRefId, { $inc: { [this.counterForGroup(comment.commentGroup)]: -1 } }).exec();
		return comment;
	}

	private targetForGroup(group: CommentGroup): Model<any> | null {
		switch (group) {
			case CommentGroup.MEMBER: return this.memberModel;
			case CommentGroup.PRODUCT: return this.productModel;
			case CommentGroup.SERVICE: return this.serviceModel;
			case CommentGroup.ARTICLE: return this.articleModel;
			default: return null;
		}
	}

	private counterForGroup(group: CommentGroup): string {
		switch (group) {
			case CommentGroup.MEMBER: return 'memberComments';
			case CommentGroup.PRODUCT: return 'productComments';
			case CommentGroup.SERVICE: return 'serviceComments';
			case CommentGroup.ARTICLE: return 'articleComments';
		}
	}
}
