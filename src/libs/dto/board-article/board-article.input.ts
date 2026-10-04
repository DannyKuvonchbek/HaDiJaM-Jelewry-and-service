import { Field, InputType, Int } from '@nestjs/graphql';
import { IsIn, IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import { Direction } from '../../enums/common.enum';
import { availableBoardArticleSorts } from '../../config';
import { BoardArticleStatus } from '../../enums/board-article.enum';

@InputType()
export class BoardArticleInput {
	@IsNotEmpty()
	@Field(() => String)
	articleCategory!: string;

	@IsNotEmpty()
	@Length(3, 150)
	@Field(() => String)
	articleTitle!: string;

	@IsNotEmpty()
	@Field(() => String)
	articleContent!: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	articleImage?: string;
}

@InputType()
class ArticleSearch {
	@IsOptional()
	@Field(() => String, { nullable: true })
	articleCategory?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	text?: string;
}

@InputType()
export class BoardArticlesInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page!: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit!: number;

	@IsOptional()
	@IsIn(availableBoardArticleSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsOptional()
	@Field(() => ArticleSearch, { nullable: true })
	search?: ArticleSearch;
}

@InputType()
export class BoardArticleUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id!: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	articleCategory?: string;

	@IsOptional()
	@Field(() => BoardArticleStatus, { nullable: true })
	articleStatus?: BoardArticleStatus;

	@IsOptional()
	@Length(3, 150)
	@Field(() => String, { nullable: true })
	articleTitle?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	articleContent?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	articleImage?: string;
}
