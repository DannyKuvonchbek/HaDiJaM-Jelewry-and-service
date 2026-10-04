import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Min } from 'class-validator';
import { Direction } from '../../enums/common.enum';

@InputType()
export class ServiceReviewInput {
	@IsNotEmpty()
	@Field(() => String)
	serviceId!: string;

	@IsNotEmpty()
	@Field(() => String)
	bookingId!: string;

	@IsNotEmpty()
	@Min(0)
	@Field(() => Int)
	rating!: number;

	@IsNotEmpty()
	@Field(() => String)
	reviewContent!: string;

	@IsNotEmpty()
	@Field(() => [String])
	reviewImages!: string[];
}

@InputType()
export class ServiceReviewsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page!: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit!: number;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;
}
