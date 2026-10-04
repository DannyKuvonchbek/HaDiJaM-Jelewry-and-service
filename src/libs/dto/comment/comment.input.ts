import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Min } from 'class-validator';
import { Direction } from '../../enums/common.enum';
import { CommentGroup } from '../../enums/comment.enum';

@InputType()
export class CommentInput {
	@IsNotEmpty()
	@Field(() => CommentGroup)
	commentGroup!: CommentGroup;

	@IsNotEmpty()
	@Field(() => String)
	commentRefId!: string;

	@IsNotEmpty()
	@Field(() => String)
	commentContent!: string;
}

@InputType()
class CommentSearch {
	@IsNotEmpty()
	@Field(() => String)
	commentRefId!: string;
}

@InputType()
export class CommentsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page!: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit!: number;

	@IsOptional()
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => CommentSearch)
	search!: CommentSearch;
}
