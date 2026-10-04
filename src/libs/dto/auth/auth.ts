import { Field, Float, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AuthRecord {
	@Field(() => String)
	_id!: string;

	@Field(() => String)
	auth_phone!: string;

	@Field(() => String)
	auth_ip!: string;

	@Field(() => String)
	auth_status!: string;

	@Field(() => Float)
	eskiz_id!: number;

	@Field(() => Date)
	createdAt!: Date;

	@Field(() => Date)
	updatedAt!: Date;
}
