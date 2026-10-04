import { Field, ObjectType } from '@nestjs/graphql';
import { TotalCounter } from '../member/member';
import { DeliveryStatus } from '../../enums/service.enum';

@ObjectType()
export class ServiceDelivery {
	@Field(() => String)
	_id!: string;

	@Field(() => String, { nullable: true })
	serviceId?: string;

	@Field(() => String, { nullable: true })
	bookingId?: string;

	@Field(() => String, { nullable: true })
	requestId?: string;

	@Field(() => String)
	memberId!: string;

	@Field(() => String)
	deliveryMethod!: string;

	@Field(() => String)
	deliveryDirection!: string;

	@Field(() => DeliveryStatus)
	deliveryStatus!: DeliveryStatus;

	@Field(() => String, { nullable: true })
	deliveryAddress?: string;

	@Field(() => String, { nullable: true })
	deliveryPhone?: string;

	@Field(() => String, { nullable: true })
	deliveryNote?: string;

	@Field(() => String, { nullable: true })
	trackingNumber?: string;

	@Field(() => String, { nullable: true })
	courierName?: string;

	@Field(() => String, { nullable: true })
	pickupLocation?: string;

	@Field(() => Date, { nullable: true })
	sentAt?: Date;

	@Field(() => Date, { nullable: true })
	receivedAt?: Date;

	@Field(() => Date, { nullable: true })
	returnedAt?: Date;

	@Field(() => Date)
	createdAt!: Date;

	@Field(() => Date)
	updatedAt!: Date;
}

@ObjectType()
export class ServiceDeliveries {
	@Field(() => [ServiceDelivery])
	list!: ServiceDelivery[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter?: TotalCounter[];
}
