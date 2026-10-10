import { Type } from 'class-transformer';
import { Field, InputType, Int } from '@nestjs/graphql';
import { ArrayMinSize, IsArray, IsEnum, IsInt, IsNotEmpty, IsOptional, IsPhoneNumber, Length, Min, ValidateNested } from 'class-validator';
import { OrderItemStatus, PaymentMethod, PaymentStatus } from '../../enums/order.enum';

@InputType()
export class OrderItemInput {
	@IsNotEmpty()
	@Field(() => String)
	productId!: string;

	@IsInt()
	@Min(1)
	@Field(() => Int)
	quantity!: number;
}

@InputType()
export class OrderInput {
	@IsArray()
	@ArrayMinSize(1)
	@ValidateNested({ each: true })
	@Type(() => OrderItemInput)
	@Field(() => [OrderItemInput])
	items!: OrderItemInput[];

	@IsNotEmpty()
	@Length(5, 500)
	@Field(() => String)
	deliveryAddress!: string;

	@IsNotEmpty()
	@IsPhoneNumber()
	@Field(() => String)
	deliveryPhone!: string;

	@IsEnum(PaymentMethod)
	@Field(() => PaymentMethod)
	paymentMethod!: PaymentMethod;
}

@InputType()
export class OrderUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id!: string;

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
export class OrderItemUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id!: string;

	@IsEnum(OrderItemStatus)
	@Field(() => OrderItemStatus)
	itemStatus!: OrderItemStatus;
}

@InputType()
export class OrderAdminUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id!: string;

	@IsEnum(PaymentStatus)
	@Field(() => PaymentStatus)
	paymentStatus!: PaymentStatus;
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
