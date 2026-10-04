import { registerEnumType } from '@nestjs/graphql';

export enum ServiceStatus {
	DRAFT = 'DRAFT',
	ACTIVE = 'ACTIVE',
	INACTIVE = 'INACTIVE',
	DELETE = 'DELETE',
}
registerEnumType(ServiceStatus, { name: 'ServiceStatus' });

export enum BookingStatus {
	REQUESTED = 'REQUESTED',
	CONFIRMED = 'CONFIRMED',
	REJECTED = 'REJECTED',
	CANCELLED = 'CANCELLED',
	COMPLETED = 'COMPLETED',
}
registerEnumType(BookingStatus, { name: 'BookingStatus' });

export enum RequestStatus {
	NEW = 'NEW',
	REVIEWING = 'REVIEWING',
	QUOTED = 'QUOTED',
	ACCEPTED = 'ACCEPTED',
	IN_PROGRESS = 'IN_PROGRESS',
	COMPLETED = 'COMPLETED',
	CANCELLED = 'CANCELLED',
}
registerEnumType(RequestStatus, { name: 'RequestStatus' });

export enum DeliveryStatus {
	NEW = 'NEW',
	PREPARING = 'PREPARING',
	SENT = 'SENT',
	RECEIVED = 'RECEIVED',
	RETURNED = 'RETURNED',
	CANCELLED = 'CANCELLED',
}
registerEnumType(DeliveryStatus, { name: 'DeliveryStatus' });
