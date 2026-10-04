import { Field, InputType, Int } from '@nestjs/graphql';
import { IsIn, IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import { Direction } from '../../enums/common.enum';
import { availableServiceSorts } from '../../config';
import { ServiceStatus } from '../../enums/service.enum';

@InputType()
export class ServiceInput {
	@IsNotEmpty()
	@Field(() => String)
	serviceType!: string;

	@IsNotEmpty()
	@Length(3, 120)
	@Field(() => String)
	serviceTitle!: string;

	@IsNotEmpty()
	@Field(() => String)
	serviceCategory!: string;

	@IsNotEmpty()
	@Min(0)
	@Field(() => Number)
	servicePrice!: number;

	@IsNotEmpty()
	@Field(() => String)
	serviceDuration!: string;

	@IsNotEmpty()
	@Field(() => [String])
	serviceImages!: string[];

	@IsOptional()
	@Field(() => String, { nullable: true })
	serviceDesc?: string;
}

@InputType()
class ServiceSearch {
	@IsOptional()
	@Field(() => String, { nullable: true })
	serviceType?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	serviceCategory?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	memberId?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	text?: string;

	@IsOptional()
	@Field(() => Number, { nullable: true })
	minPrice?: number;

	@IsOptional()
	@Field(() => Number, { nullable: true })
	maxPrice?: number;
}

@InputType()
export class ServicesInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page!: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit!: number;

	@IsOptional()
	@IsIn(availableServiceSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsOptional()
	@Field(() => ServiceSearch, { nullable: true })
	search?: ServiceSearch;
}

@InputType()
export class ServiceOrdinaryInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page!: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit!: number;
}
