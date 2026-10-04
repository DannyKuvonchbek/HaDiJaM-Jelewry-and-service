import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ServiceReview, ServiceReviews } from '../../libs/dto/service-review/service-review';
import { ServiceReviewInput, ServiceReviewsInquiry } from '../../libs/dto/service-review/service-review.input';
import { ServiceReviewUpdate } from '../../libs/dto/service-review/service-review.update';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { WithoutGuard } from '../auth/guards/without.guard';
import { ServiceReviewService } from './service-review.service';

@Resolver()
export class ServiceReviewResolver {
	constructor(private readonly reviewService: ServiceReviewService) {}

	@UseGuards(AuthGuard)
	@Mutation(() => ServiceReview)
	public async createServiceReview(@Args('input') input: ServiceReviewInput, @AuthMember('_id') memberId: string): Promise<ServiceReview> {
		return this.reviewService.createReview(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => ServiceReview)
	public async updateServiceReview(@Args('input') input: ServiceReviewUpdate, @AuthMember('_id') memberId: string): Promise<ServiceReview> {
		return this.reviewService.updateReview(memberId, input);
	}

	@UseGuards(WithoutGuard)
	@Query(() => ServiceReviews)
	public async getServiceReviews(@Args('serviceId') serviceId: string, @Args('input') input: ServiceReviewsInquiry): Promise<ServiceReviews> {
		return this.reviewService.getServiceReviews(serviceId, input);
	}
}
