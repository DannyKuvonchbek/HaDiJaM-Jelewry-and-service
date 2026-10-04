import { registerEnumType } from '@nestjs/graphql';

export enum ViewGroup {
	MEMBER = 'MEMBER',
	PRODUCT = 'PRODUCT',
	SERVICE = 'SERVICE',
	ARTICLE = 'ARTICLE',
}
registerEnumType(ViewGroup, { name: 'ViewGroup' });
