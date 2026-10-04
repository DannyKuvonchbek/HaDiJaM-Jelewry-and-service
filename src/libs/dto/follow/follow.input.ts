import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, Min } from 'class-validator';

@InputType()
class FollowSearch {
	@Field(() => String, { nullable: true })
	followerId?: string;

	@Field(() => String, { nullable: true })
	followingId?: string;
}

@InputType()
export class FollowInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page!: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit!: number;

	@IsNotEmpty()
	@Field(() => FollowSearch)
	search!: FollowSearch;
}
