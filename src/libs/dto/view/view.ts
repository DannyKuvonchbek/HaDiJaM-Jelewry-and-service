import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class View {
	@Field(() => String)
	_id!: string;

	@Field(() => String)
	viewGroup!: string;

	@Field(() => String)
	viewRefId!: string;

	@Field(() => String)
	memberId!: string;

	@Field(() => Date)
	createdAt!: Date;

	@Field(() => Date)
	updatedAt!: Date;
}
