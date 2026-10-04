import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthService } from '../auth.service';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Message } from '../../../libs/enums/common.enum';

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(
		private readonly reflector: Reflector,
		private readonly authService: AuthService,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const roles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [context.getHandler(), context.getClass()]);
		if (!roles?.length) return true;

		const request = GqlExecutionContext.create(context).getContext().req;
		const authorization = request?.headers?.authorization;
		if (!authorization?.startsWith('Bearer ')) {
			throw new UnauthorizedException(Message.TOKEN_NOT_EXIST);
		}

		let member;
		try {
			member = await this.authService.getAuthenticatedMember(authorization.slice(7));
		} catch {
			throw new UnauthorizedException(Message.NOT_AUTHENTICATED);
		}
		if (!roles.includes(member.memberType)) {
			throw new ForbiddenException(Message.ONLY_SPECIFIC_ROLES_ALLOWED);
		}

		request.authMember = member;
		return true;
	}
}
