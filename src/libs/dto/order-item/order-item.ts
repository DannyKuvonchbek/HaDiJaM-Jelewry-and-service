import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { OrderItemStatus } from '../../enums/order.enum';

@ObjectType()
export class OrderItem {
	@Field(() => String)
	_id!: string;

	@Field(() => String)
	orderId!: string;

	@Field(() => String)
	productId!: string;

	@Field(() => String)
	sellerId!: string;

	@Field(() => String)
	productTitle!: string;

	@Field(() => String)
	productType!: string;

	@Field(() => [String])
	productImages!: string[];

	@Field(() => Float)
	unitPrice!: number;

	@Field(() => Int)
	quantity!: number;

	@Field(() => Float)
	itemPrice!: number;

	@Field(() => OrderItemStatus)
	itemStatus!: OrderItemStatus;

	@Field(() => Date)
	createdAt!: Date;

	@Field(() => Date)
	updatedAt!: Date;
}
