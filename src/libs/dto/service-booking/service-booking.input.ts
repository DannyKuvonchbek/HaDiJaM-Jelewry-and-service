import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Min } from 'class-validator';
import { Direction } from '../../enums/common.enum';
import { BookingStatus } from '../../enums/service.enum';

@InputType()
export class ServiceBookingInput {
	@IsNotEmpty()
	@Field(() => String)
	serviceId!: string;

	@IsNotEmpty()
	@Field(() => Date)
	bookingDate!: Date;

	@IsNotEmpty()
	@Field(() => Date)
	bookingTime!: Date;

	@IsOptional()
	@Field(() => String, { nullable: true })
	customerNote?: string;

	@IsNotEmpty()
	@Field(() => String)
	customerPhone!: string;

	@IsNotEmpty()
	@Field(() => String)
	customerAddress!: string;
}

@InputType()
export class ServiceBookingsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page!: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit!: number;

	@IsOptional()
	@Field(() => BookingStatus, { nullable: true })
	bookingStatus?: BookingStatus;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;
}
