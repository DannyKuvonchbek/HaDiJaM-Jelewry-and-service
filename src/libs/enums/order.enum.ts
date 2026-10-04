import { registerEnumType } from '@nestjs/graphql';

export enum OrderStatus {
	NEW = 'NEW',
	CONFIRMED = 'CONFIRMED',
	COMPLETED = 'COMPLETED',
	CANCELLED = 'CANCELLED',
}
registerEnumType(OrderStatus, { name: 'OrderStatus' });

export enum OrderItemStatus {
	REQUESTED = 'REQUESTED',
	CONFIRMED = 'CONFIRMED',
	REJECTED = 'REJECTED',
	PREPARING = 'PREPARING',
	SHIPPED = 'SHIPPED',
	DELIVERED = 'DELIVERED',
	CANCELLED = 'CANCELLED',
	RETURN_REQUESTED = 'RETURN_REQUESTED',
	RETURNED = 'RETURNED',
}
registerEnumType(OrderItemStatus, { name: 'OrderItemStatus' });

export enum PaymentMethod {
	CARD = 'CARD',
	CASH = 'CASH',
}
registerEnumType(PaymentMethod, { name: 'PaymentMethod' });

export enum PaymentStatus {
	PENDING = 'PENDING',
	PAID = 'PAID',
	FAILED = 'FAILED',
	REFUND_PENDING = 'REFUND_PENDING',
	REFUNDED = 'REFUNDED',
}
registerEnumType(PaymentStatus, { name: 'PaymentStatus' });
