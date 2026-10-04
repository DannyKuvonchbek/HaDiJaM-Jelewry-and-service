import { Field, Int, ObjectType } from '@nestjs/graphql';
import { TotalCounter } from '../member/member';

@ObjectType()
export class ServiceReview {
	@Field(() => String)
	_id!: string;

	@Field(() => String)
	serviceId!: string;

	@Field(() => String)
	bookingId!: string;

	@Field(() => String)
	memberId!: string;

	@Field(() => Int)
	rating!: number;

	@Field(() => String)
	reviewContent!: string;

	@Field(() => [String])
	reviewImages!: string[];

	@Field(() => Date)
	createdAt!: Date;

	@Field(() => Date)
	updatedAt!: Date;
}

@ObjectType()
export class ServiceReviews {
	@Field(() => [ServiceReview])
	list!: ServiceReview[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter?: TotalCounter[];
}
