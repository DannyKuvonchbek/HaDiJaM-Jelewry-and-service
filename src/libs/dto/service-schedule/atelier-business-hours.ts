import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AtelierBusinessHours {
  @Field(() => String) timeZone!: string;
  @Field(() => [String]) daysOfWeek!: string[];
  @Field(() => String) opensAt!: string;
  @Field(() => String) closesAt!: string;
}
