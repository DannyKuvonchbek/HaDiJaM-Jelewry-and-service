import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const AuthMember = createParamDecorator((data: string | undefined, context: ExecutionContext) => {
	const request = GqlExecutionContext.create(context).getContext().req;
	const member = request?.authMember;
	return data ? member?.[data] : member;
});
