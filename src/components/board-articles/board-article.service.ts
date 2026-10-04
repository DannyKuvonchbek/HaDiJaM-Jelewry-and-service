import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BoardArticle, BoardArticles } from '../../libs/dto/board-article/board-article';
import { BoardArticleInput, BoardArticleUpdate, BoardArticlesInquiry } from '../../libs/dto/board-article/board-article.input';
import { LikeInput } from '../../libs/dto/like/like.input';
import { Direction, Message } from '../../libs/enums/common.enum';
import { BoardArticleStatus } from '../../libs/enums/board-article.enum';
import { LikeGroup } from '../../libs/enums/like.enum';
import { LikeService } from '../likes/like.service';

@Injectable()
export class BoardArticleService {
	constructor(
		@InjectModel('BoardArticle') private readonly articleModel: Model<BoardArticle>,
		@InjectModel('Member') private readonly memberModel: Model<any>,
		private readonly likeService: LikeService,
	) {}

	public async createBoardArticle(memberId: string, input: BoardArticleInput): Promise<BoardArticle> {
		try {
			const article = await this.articleModel.create({ ...input, memberId });
			await this.memberModel.findByIdAndUpdate(memberId, { $inc: { memberArticles: 1 } }).exec();
			return article;
		} catch {
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async getBoardArticle(articleId: string, memberId?: string): Promise<BoardArticle> {
		if (!Types.ObjectId.isValid(articleId)) throw new BadRequestException(Message.BAD_REQUEST);
		const article = await this.articleModel.findOne({ _id: articleId, articleStatus: BoardArticleStatus.ACTIVE }).lean().exec();
		if (!article) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		if (memberId) {
			const liked = await this.likeService.checkLikeExistence({ memberId, likeRefId: articleId, likeGroup: LikeGroup.ARTICLE });
			(article as BoardArticle).meLiked = liked;
		}
		return article as BoardArticle;
	}

	public async updateBoardArticle(memberId: string, input: BoardArticleUpdate): Promise<BoardArticle> {
		const update: Record<string, unknown> = { ...input };
		delete update._id;
		const article = await this.articleModel.findOneAndUpdate(
			{ _id: input._id, memberId, articleStatus: BoardArticleStatus.ACTIVE }, update, { new: true },
		).exec();
		if (!article) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return article;
	}

	public async getBoardArticles(input: BoardArticlesInquiry): Promise<BoardArticles> {
		const search = input.search ?? {};
		const match: Record<string, any> = { articleStatus: BoardArticleStatus.ACTIVE };
		if (search.articleCategory) match.articleCategory = search.articleCategory;
		if (search.text?.trim()) match.articleTitle = { $regex: search.text.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
		const [result] = await this.articleModel.aggregate([
			{ $match: match },
			{ $sort: { [input.sort ?? 'createdAt']: input.direction ?? Direction.DESC } },
			{ $facet: {
				list: [
					{ $skip: (input.page - 1) * input.limit },
					{ $limit: input.limit },
					{ $lookup: { from: 'members', localField: 'memberId', foreignField: '_id', as: 'memberData' } },
					{ $unwind: '$memberData' },
				],
				metaCounter: [{ $count: 'total' }],
			} },
		]);
		return result ?? { list: [], metaCounter: [] };
	}

	public async likeTargetBoardArticle(memberId: string, articleId: string): Promise<BoardArticle> {
		const article = await this.articleModel.findOne({ _id: articleId, articleStatus: BoardArticleStatus.ACTIVE }).exec();
		if (!article) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		const input: LikeInput = { memberId, likeRefId: articleId, likeGroup: LikeGroup.ARTICLE };
		const modifier = await this.likeService.toggleLike(input);
		const updated = await this.articleModel.findByIdAndUpdate(articleId, { $inc: { articleLikes: modifier } }, { new: true }).exec();
		if (!updated) throw new InternalServerErrorException(Message.SOMETHING_WENT_WRONG);
		return updated;
	}

	public async getAllBoardArticlesByAdmin(input: BoardArticlesInquiry): Promise<BoardArticles> {
		const [result] = await this.articleModel.aggregate([
			{ $sort: { [input.sort ?? 'createdAt']: input.direction ?? Direction.DESC } },
			{ $facet: { list: [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }], metaCounter: [{ $count: 'total' }] } },
		]);
		return result ?? { list: [], metaCounter: [] };
	}

	public async updateBoardArticleByAdmin(input: BoardArticleUpdate): Promise<BoardArticle> {
		const update: Record<string, unknown> = { ...input };
		delete update._id;
		const filter = input.articleStatus === BoardArticleStatus.DELETE ? { _id: input._id, articleStatus: BoardArticleStatus.ACTIVE } : { _id: input._id };
		const article = await this.articleModel.findOneAndUpdate(filter, update, { new: true }).exec();
		if (!article) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		if (input.articleStatus === BoardArticleStatus.DELETE) await this.memberModel.findByIdAndUpdate(article.memberId, { $inc: { memberArticles: -1 } }).exec();
		return article;
	}

	public async removeBoardArticleByAdmin(articleId: string): Promise<BoardArticle> {
		const article = await this.articleModel.findOneAndDelete({ _id: articleId, articleStatus: BoardArticleStatus.DELETE }).exec();
		if (!article) throw new InternalServerErrorException(Message.REMOVE_FAILED);
		return article;
	}
}
