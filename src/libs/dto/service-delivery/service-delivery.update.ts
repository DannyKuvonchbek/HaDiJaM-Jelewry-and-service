import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { DeliveryStatus } from '../../enums/service.enum';

@InputType()
export class ServiceDeliveryUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id!: string;

	@IsOptional()
	@Field(() => DeliveryStatus, { nullable: true })
	deliveryStatus?: DeliveryStatus;

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
