import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsOptional, IsPhoneNumber, Length, Min } from 'class-validator';
import { OrderStatus, PaymentStatus } from '../../enums/order.enum';

@InputType()
export class OrderInput {
	@IsNotEmpty()
	@Field(() => String)
	productId!: string;

	@IsInt()
	@Min(1)
	@Field(() => Int)
	quantity!: number;

	@IsNotEmpty()
	@Length(5, 500)
	@Field(() => String)
	deliveryAddress!: string;

	@IsNotEmpty()
	@IsPhoneNumber()
	@Field(() => String)
	deliveryPhone!: string;
}

@InputType()
export class OrderUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id!: string;

	@IsOptional()
	@Field(() => OrderStatus, { nullable: true })
	orderStatus?: OrderStatus;

	@IsOptional()
	@Length(5, 500)
	@Field(() => String, { nullable: true })
	deliveryAddress?: string;

	@IsOptional()
	@IsPhoneNumber()
	@Field(() => String, { nullable: true })
	deliveryPhone?: string;
}

@InputType()
export class OrderAdminUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id!: string;

	@IsOptional()
	@Field(() => OrderStatus, { nullable: true })
	orderStatus?: OrderStatus;

	@IsOptional()
	@Field(() => PaymentStatus, { nullable: true })
	paymentStatus?: PaymentStatus;
}

@InputType()
export class OrdersInquiry {
	@IsInt()
	@Min(1)
	@Field(() => Int)
	page!: number;

	@IsInt()
	@Min(1)
	@Field(() => Int)
	limit!: number;
}
