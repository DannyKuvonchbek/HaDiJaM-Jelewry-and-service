import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Min } from 'class-validator';
import { DeliveryStatus } from '../../enums/service.enum';

@InputType()
export class ServiceDeliveryInput {
	@IsOptional()
	@Field(() => String, { nullable: true })
	serviceId?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	bookingId?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	requestId?: string;

	@IsNotEmpty()
	@Field(() => String)
	deliveryMethod!: string;

	@IsNotEmpty()
	@Field(() => String)
	deliveryDirection!: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	deliveryAddress?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	deliveryPhone?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	deliveryNote?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	trackingNumber?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	courierName?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	pickupLocation?: string;
}

@InputType()
export class ServiceDeliveriesInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page!: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit!: number;
}
