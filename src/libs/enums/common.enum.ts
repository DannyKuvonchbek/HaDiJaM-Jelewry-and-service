import { registerEnumType } from '@nestjs/graphql';

export enum Message {
	SOMETHING_WENT_WRONG = 'Something went wrong',
	NO_DATA_FOUND = 'No data is found',
	CREATE_FAILED = 'Create failed',
	UPDATE_FAILED = 'Update failed',
	REMOVE_FAILED = 'Remove failed',
	BAD_REQUEST = 'Bad request',
	USED_MEMBER_NICK_OR_PHONE = 'Member nickname or phone is already in use',
	NO_MEMBER_NICK = 'No member with that nickname',
	BLOCKED_USER = 'This account is blocked',
	WRONG_PASSWORD = 'Incorrect password',
	NOT_AUTHENTICATED = 'Authentication required',
	TOKEN_NOT_EXIST = 'Bearer token was not provided',
	ONLY_SPECIFIC_ROLES_ALLOWED = 'This operation is restricted to specific roles',
	NOT_ALLOWED_REQUEST = 'Request is not allowed',
	SELF_SUBSCRIPTION_DENIED = 'A member cannot follow themselves',
	UPLOAD_FAILED = 'File upload failed',
	PROVIDE_ALLOWED_FORMAT = 'Provide a supported image format',
}

export enum Direction {
	ASC = 1,
	DESC = -1,
}
registerEnumType(Direction, { name: 'Direction' });
