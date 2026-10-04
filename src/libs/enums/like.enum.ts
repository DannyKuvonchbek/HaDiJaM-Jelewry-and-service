import { registerEnumType } from '@nestjs/graphql';

export enum LikeGroup {
	MEMBER = 'MEMBER',
	PRODUCT = 'PRODUCT',
	SERVICE = 'SERVICE',
	ARTICLE = 'ARTICLE',
}
registerEnumType(LikeGroup, { name: 'LikeGroup' });
