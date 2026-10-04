import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { Member, TotalCounter } from '../member/member';
import { MeLiked } from '../like/like';
import { ServiceStatus } from '../../enums/service.enum';

@ObjectType()
export class Service {
	@Field(() => String)
	_id!: string;

	@Field(() => String)
	serviceType!: string;

	@Field(() => ServiceStatus)
	serviceStatus!: ServiceStatus;

	@Field(() => String)
	serviceTitle!: string;

	@Field(() => String)
	serviceCategory!: string;

	@Field(() => Float)
	servicePrice!: number;

	@Field(() => String)
	serviceDuration!: string;

	@Field(() => [String])
	serviceImages!: string[];

	@Field(() => String, { nullable: true })
	serviceDesc?: string;

	@Field(() => Int)
	serviceViews!: number;

	@Field(() => Int)
	serviceLikes!: number;

	@Field(() => Int)
	serviceComments!: number;

	@Field(() => Int)
	serviceRank!: number;

	@Field(() => String)
	memberId!: string;

	@Field(() => Date, { nullable: true })
	deletedAt?: Date;

	@Field(() => Date)
	createdAt!: Date;

	@Field(() => Date)
	updatedAt!: Date;

	@Field(() => Member, { nullable: true })
	memberData?: Member;

	@Field(() => [MeLiked], { nullable: true })
	meLiked?: MeLiked[];
}

@ObjectType()
export class Services {
	@Field(() => [Service])
	list!: Service[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter?: TotalCounter[];
}
