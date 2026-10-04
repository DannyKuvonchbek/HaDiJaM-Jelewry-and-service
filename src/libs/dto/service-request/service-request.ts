import { Field, Float, ObjectType } from '@nestjs/graphql';
import { TotalCounter } from '../member/member';
import { RequestStatus } from '../../enums/service.enum';

@ObjectType()
export class ServiceRequest {
	@Field(() => String)
	_id!: string;

	@Field(() => String)
	serviceId!: string;

	@Field(() => String, { nullable: true })
	bookingId?: string;

	@Field(() => String)
	customerId!: string;

	@Field(() => String)
	providerId!: string;

	@Field(() => String)
	requestTitle!: string;

	@Field(() => String)
	requestDesc!: string;

	@Field(() => [String])
	requestImages!: string[];

	@Field(() => RequestStatus)
	requestStatus!: RequestStatus;

	@Field(() => Float, { nullable: true })
	estimatedPrice?: number;

	@Field(() => Float, { nullable: true })
	finalPrice?: number;

	@Field(() => String, { nullable: true })
	customerNote?: string;

	@Field(() => Date)
	createdAt!: Date;

	@Field(() => Date)
	updatedAt!: Date;
}

@ObjectType()
export class ServiceRequests {
	@Field(() => [ServiceRequest])
	list!: ServiceRequest[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter?: TotalCounter[];
}
