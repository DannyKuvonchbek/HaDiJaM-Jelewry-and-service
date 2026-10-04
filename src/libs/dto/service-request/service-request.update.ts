import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Min } from 'class-validator';
import { RequestStatus } from '../../enums/service.enum';

@InputType()
export class ServiceRequestUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id!: string;

	@IsOptional()
	@Field(() => RequestStatus, { nullable: true })
	requestStatus?: RequestStatus;

	@IsOptional()
	@Min(0)
	@Field(() => Number, { nullable: true })
	estimatedPrice?: number;

	@IsOptional()
	@Min(0)
	@Field(() => Number, { nullable: true })
	finalPrice?: number;

	@IsOptional()
	@Field(() => String, { nullable: true })
	customerNote?: string;
}
