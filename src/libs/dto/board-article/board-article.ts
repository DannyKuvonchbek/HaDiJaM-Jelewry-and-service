import { Field, Int, ObjectType } from '@nestjs/graphql';
import { BoardArticleStatus } from '../../enums/board-article.enum';
import { Member, TotalCounter } from '../member/member';
import { MeLiked } from '../like/like';

@ObjectType()
export class BoardArticle {
	@Field(() => String)
	_id!: string;

	@Field(() => String)
	articleCategory!: string;

	@Field(() => BoardArticleStatus)
	articleStatus!: BoardArticleStatus;

	@Field(() => String)
	articleTitle!: string;

	@Field(() => String)
	articleContent!: string;

	@Field(() => String, { nullable: true })
	articleImage?: string;

	@Field(() => Int)
	articleLikes!: number;

	@Field(() => Int)
	articleViews!: number;

	@Field(() => Int)
	articleComments!: number;

	@Field(() => String)
	memberId!: string;

	@Field(() => Date)
	createdAt!: Date;

	@Field(() => Date)
	updatedAt!: Date;

	@Field(() => Member, { nullable: true })
	memberData?: Member;

	@Field(() => [MeLiked], { nullable: true })
	meLiked?: MeLiked[];
}

@ObjectType()
export class BoardArticles {
	@Field(() => [BoardArticle])
	list!: BoardArticle[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter?: TotalCounter[];
}
