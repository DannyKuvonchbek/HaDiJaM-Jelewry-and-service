import { registerEnumType } from '@nestjs/graphql';

export enum ProductStatus {
	ACTIVE = 'ACTIVE',
	BLOCK = 'BLOCK',
	SOLD = 'SOLD',
	DELETE = 'DELETE',
}
registerEnumType(ProductStatus, { name: 'ProductStatus' });
