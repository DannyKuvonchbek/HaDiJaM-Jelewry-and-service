import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional } from 'class-validator';

@InputType()
export class ServiceScheduleInput {
	@IsNotEmpty()
	@Field(() => String)
	serviceId!: string;

	@IsNotEmpty()
	@Field(() => String)
	dayOfWeek!: string;

	@IsNotEmpty()
	@Field(() => Boolean)
	isWorking!: boolean;

	@IsNotEmpty()
	@Field(() => String)
	startTime!: string;

	@IsNotEmpty()
	@Field(() => String)
	endTime!: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	breakStartTime?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	breakEndTime?: string;
}
