import { Field, InputType } from '@nestjs/graphql';
import { ViewGroup } from '../../enums/view.enum';

@InputType()
export class ViewInput {
	@Field(() => ViewGroup)
	viewGroup!: ViewGroup;

	@Field(() => String)
	viewRefId!: string;

	memberId!: string;
}
