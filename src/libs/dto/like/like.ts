import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Like {
	@Field(() => String)
	_id!: string;

	@Field(() => String)
	likeGroup!: string;

	@Field(() => String)
	likeRefId!: string;

	@Field(() => String)
	memberId!: string;

	@Field(() => Date)
	createdAt!: Date;

	@Field(() => Date)
	updatedAt!: Date;
}

@ObjectType()
export class MeLiked {
	@Field(() => String)
	memberId!: string;

	@Field(() => String)
	likeRefId!: string;

	@Field(() => Boolean)
	myFavorite!: boolean;
}
