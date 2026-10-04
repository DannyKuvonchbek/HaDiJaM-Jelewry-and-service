import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Min } from 'class-validator';

@InputType()
export class ServiceReviewUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id!: string;

	@IsOptional()
	@Min(0)
	@Field(() => Int, { nullable: true })
	rating?: number;

	@IsOptional()
	@Field(() => String, { nullable: true })
	reviewContent?: string;

	@IsOptional()
	@Field(() => [String], { nullable: true })
	reviewImages?: string[];
}
