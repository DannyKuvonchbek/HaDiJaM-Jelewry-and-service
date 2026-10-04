import { registerEnumType } from '@nestjs/graphql';

export enum BoardArticleStatus {
	ACTIVE = 'ACTIVE',
	DELETE = 'DELETE',
}
registerEnumType(BoardArticleStatus, { name: 'BoardArticleStatus' });
