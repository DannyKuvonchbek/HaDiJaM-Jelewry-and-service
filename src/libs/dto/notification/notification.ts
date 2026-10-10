import { Field, Int, ObjectType } from '@nestjs/graphql';
import { TotalCounter } from '../member/member';

@ObjectType()
export class Notification {
  @Field(() => String)
  _id!: string;

  @Field(() => String)
  notificationType!: string;

  @Field(() => String)
  notificationStatus!: string;

  @Field(() => String)
  notificationGroup!: string;

  @Field(() => String)
  notificationTitle!: string;

  @Field(() => String, { nullable: true })
  notificationDesc?: string;

  @Field(() => String, { nullable: true })
  productId?: string;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}

@ObjectType()
export class Notifications {
  @Field(() => [Notification])
  list!: Notification[];

  @Field(() => [TotalCounter], { nullable: true })
  metaCounter?: TotalCounter[];

  @Field(() => Int)
  unreadCount!: number;
}
