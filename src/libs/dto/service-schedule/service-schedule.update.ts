import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional } from 'class-validator';

@InputType()
export class ServiceScheduleUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id!: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	dayOfWeek?: string;

	@IsOptional()
	@Field(() => Boolean, { nullable: true })
	isWorking?: boolean;

	@IsOptional()
	@Field(() => String, { nullable: true })
	startTime?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	endTime?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	breakStartTime?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	breakEndTime?: string;
}
