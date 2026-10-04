import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Min } from 'class-validator';
import { RequestStatus } from '../../enums/service.enum';

@InputType()
export class ServiceRequestInput {
	@IsNotEmpty()
	@Field(() => String)
	serviceId!: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	bookingId?: string;

	@IsNotEmpty()
	@Field(() => String)
	requestTitle!: string;

	@IsNotEmpty()
	@Field(() => String)
	requestDesc!: string;

	@IsNotEmpty()
	@Field(() => [String])
	requestImages!: string[];

	@IsOptional()
	@Min(0)
	@Field(() => Number, { nullable: true })
	estimatedPrice?: number;

	@IsOptional()
	@Field(() => String, { nullable: true })
	customerNote?: string;
}

@InputType()
export class ServiceRequestsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page!: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit!: number;

	@IsOptional()
	@Field(() => RequestStatus, { nullable: true })
	requestStatus?: RequestStatus;
}
