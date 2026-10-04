import { Field, ObjectType } from '@nestjs/graphql';
import { TotalCounter } from '../member/member';

@ObjectType()
export class ServiceSchedule {
	@Field(() => String)
	_id!: string;

	@Field(() => String)
	serviceId!: string;

	@Field(() => String)
	providerId!: string;

	@Field(() => String)
	dayOfWeek!: string;

	@Field(() => Boolean)
	isWorking!: boolean;

	@Field(() => String)
	startTime!: string;

	@Field(() => String)
	endTime!: string;

	@Field(() => String, { nullable: true })
	breakStartTime?: string;

	@Field(() => String, { nullable: true })
	breakEndTime?: string;

	@Field(() => Date)
	createdAt!: Date;
}

@ObjectType()
export class ServiceSchedules {
	@Field(() => [ServiceSchedule])
	list!: ServiceSchedule[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter?: TotalCounter[];
}
