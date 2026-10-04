import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { OrderStatus, PaymentStatus } from '../../enums/order.enum';
import { Product } from '../product/product';
import { Member, TotalCounter } from '../member/member';

@ObjectType()
export class Order {
	@Field(() => String)
	_id!: string;

	@Field(() => String)
	productId!: string;

	@Field(() => String)
	sellerId!: string;

	@Field(() => String)
	memberId!: string;

	@Field(() => OrderStatus)
	orderStatus!: OrderStatus;

	@Field(() => Float)
	orderPrice!: number;

	@Field(() => Int)
	quantity!: number;

	@Field(() => String)
	deliveryAddress!: string;

	@Field(() => String)
	deliveryPhone!: string;

	@Field(() => PaymentStatus)
	paymentStatus!: PaymentStatus;

	@Field(() => Product, { nullable: true })
	productData?: Product;

	@Field(() => Member, { nullable: true })
	sellerData?: Member;

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
