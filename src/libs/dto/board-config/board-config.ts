import { Field, Float, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class BoardConfig {
	@Field(() => String)
	_id!: string;

	@Field(() => String)
	bo_id!: string;

	@Field(() => String)
	group_id!: string;

	@Field(() => String)
	bo_subject!: string;

	@Field(() => Float)
	bo_page_rows!: number;

	@Field(() => String)
	bo_is_disabled!: string;

	@Field(() => String)
	bo_is_admin_only_write!: string;

	@Field(() => String)
	bo_is_private!: string;

	@Field(() => String)
	bo_is_required_photo!: string;

	@Field(() => Float)
	bo_counts!: number;

	@Field(() => Date)
	createdAt!: Date;

	@Field(() => Date)
	updatedAt!: Date;
}
