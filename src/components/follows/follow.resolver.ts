import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { WithoutGuard } from '../auth/guards/without.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Follower, Followers, Followings } from '../../libs/dto/follow/follow';
import { FollowInquiry } from '../../libs/dto/follow/follow.input';
import { FollowService } from './follow.service';

@Resolver()
export class FollowResolver {
	constructor(private readonly followService: FollowService) {}

	@UseGuards(AuthGuard)
	@Mutation(() => Follower)
	public async subscribe(@Args('input') followingId: string, @AuthMember('_id') followerId: string): Promise<Follower> {
		return this.followService.subscribe(String(followerId), followingId);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Follower)
	public async unsubscribe(@Args('input') followingId: string, @AuthMember('_id') followerId: string): Promise<Follower> {
		return this.followService.unsubscribe(String(followerId), followingId);
	}

	@UseGuards(WithoutGuard)
	@Query(() => Followings)
	public async getMemberFollowings(@Args('input') input: FollowInquiry, @AuthMember('_id') memberId?: string): Promise<Followings> {
		return this.followService.getMemberFollowings(memberId, input);
	}

	@UseGuards(WithoutGuard)
	@Query(() => Followers)
	public async getMemberFollowers(@Args('input') input: FollowInquiry, @AuthMember('_id') memberId?: string): Promise<Followers> {
		return this.followService.getMemberFollowers(memberId, input);
	}
}
