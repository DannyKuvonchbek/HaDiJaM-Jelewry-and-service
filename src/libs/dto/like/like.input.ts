import { Field, InputType } from '@nestjs/graphql';
import { LikeGroup } from '../../enums/like.enum';

@InputType()
export class LikeInput {
	@Field(() => LikeGroup)
	likeGroup!: LikeGroup;

	@Field(() => String)
	likeRefId!: string;

	memberId!: string;
}
