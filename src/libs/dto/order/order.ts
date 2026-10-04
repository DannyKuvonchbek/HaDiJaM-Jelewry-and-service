import { Field, Float, ObjectType } from '@nestjs/graphql';
import { OrderStatus, PaymentMethod, PaymentStatus } from '../../enums/order.enum';
import { OrderItem } from '../order-item/order-item';
import { Member, TotalCounter } from '../member/member';

@ObjectType()
export class Order {
	@Field(() => String)
	_id!: string;

	@Field(() => String)
	memberId!: string;

	@Field(() => OrderStatus)
	orderStatus!: OrderStatus;

	@Field(() => Float)
	orderPrice!: number;

	@Field(() => String)
	deliveryAddress!: string;

	@Field(() => String)
	deliveryPhone!: string;

	@Field(() => PaymentMethod)
	paymentMethod!: PaymentMethod;

	@Field(() => PaymentStatus)
	paymentStatus!: PaymentStatus;

	@Field(() => [OrderItem])
	items!: OrderItem[];

	@Field(() => Member, { nullable: true })
	memberData?: Member;

	@Field(() => Date)
	createdAt!: Date;

	@Field(() => Date)
	updatedAt!: Date;
}

@ObjectType()
export class Orders {
	@Field(() => [Order])
	list!: Order[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter?: TotalCounter[];
}
