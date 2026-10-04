import { Field, Float, ObjectType } from '@nestjs/graphql';
import { TotalCounter } from '../member/member';
import { BookingStatus } from '../../enums/service.enum';

@ObjectType()
export class ServiceBooking {
	@Field(() => String)
	_id!: string;

	@Field(() => String)
	serviceId!: string;

	@Field(() => String)
	customerId!: string;

	@Field(() => String)
	providerId!: string;

	@Field(() => Date)
	bookingDate!: Date;

	@Field(() => Date)
	bookingTime!: Date;

	@Field(() => BookingStatus)
	bookingStatus!: BookingStatus;

	@Field(() => Float)
	bookingPrice!: number;

	@Field(() => String, { nullable: true })
	customerNote?: string;

	@Field(() => String)
	customerPhone!: string;

	@Field(() => String)
	customerAddress!: string;

	@Field(() => Date)
	createdAt!: Date;

	@Field(() => Date)
	updatedAt!: Date;
}

@ObjectType()
export class ServiceBookings {
	@Field(() => [ServiceBooking])
	list!: ServiceBooking[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter?: TotalCounter[];
}
