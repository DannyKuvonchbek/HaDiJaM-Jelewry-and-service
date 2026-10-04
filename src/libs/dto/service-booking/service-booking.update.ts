import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { BookingStatus } from '../../enums/service.enum';

@InputType()
export class ServiceBookingUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id!: string;

	@IsOptional()
	@Field(() => BookingStatus, { nullable: true })
	bookingStatus?: BookingStatus;

	@IsOptional()
	@Field(() => String, { nullable: true })
	customerNote?: string;
}
