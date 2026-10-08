import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Member, TotalCounter } from '../member/member';
import { MeLiked } from '../like/like';

@ObjectType()
export class Follow {
	@Field(() => String)
	_id!: string;

	@Field(() => String)
	followingId!: string;

	@Field(() => String)
	followerId!: string;

	@Field(() => Date)
	createdAt!: Date;

	@Field(() => Date)
	updatedAt!: Date;
}

@ObjectType()
export class MeFollowed {
	@Field(() => String)
	followerId!: string;

	@Field(() => String)
	followingId!: string;

	@Field(() => Boolean)
	myFollowing!: boolean;
}

@ObjectType()
export class Following {
	@Field(() => String)
	_id!: string;

	@Field(() => String)
	followingId!: string;

	@Field(() => String)
	followerId!: string;

	@Field(() => Date)
	updatedAt!: Date;

	@Field(() => [MeLiked], { nullable: true })
	meLiked?: MeLiked[];

	@Field(() => [MeFollowed], { nullable: true })
	meFollowed?: MeFollowed[];

	@Field(() => Member, { nullable: true })
	followingData?: Member;

	@Field(() => Member, { nullable: true })
	followerData?: Member;

	@Field(() => Date)
	createdAt!: Date;
}

@ObjectType()
export class Follower extends Following {}

@ObjectType()
export class Followings {
	@Field(() => [Following])
	list!: Following[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter?: TotalCounter[];
}

@ObjectType()
export class Followers {
	@Field(() => [Follower])
	list!: Follower[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter?: TotalCounter[];
}
