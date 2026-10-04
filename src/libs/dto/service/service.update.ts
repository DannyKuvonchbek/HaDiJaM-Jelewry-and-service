import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import { ServiceStatus } from '../../enums/service.enum';

@InputType()
export class ServiceUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id!: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	serviceType?: string;

	@IsOptional()
	@Length(3, 120)
	@Field(() => String, { nullable: true })
	serviceTitle?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	serviceCategory?: string;

	@IsOptional()
	@Min(0)
	@Field(() => Number, { nullable: true })
	servicePrice?: number;

	@IsOptional()
	@Field(() => String, { nullable: true })
	serviceDuration?: string;

	@IsOptional()
	@Field(() => [String], { nullable: true })
	serviceImages?: string[];

	@IsOptional()
	@Field(() => String, { nullable: true })
	serviceDesc?: string;

	@IsOptional()
	@Field(() => ServiceStatus, { nullable: true })
	serviceStatus?: ServiceStatus;
}
