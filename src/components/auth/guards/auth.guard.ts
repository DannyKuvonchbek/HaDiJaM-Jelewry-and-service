import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthService } from '../auth.service';
import { Message } from '../../../libs/enums/common.enum';

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(private readonly authService: AuthService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = GqlExecutionContext.create(context).getContext().req;
		const authorization = request?.headers?.authorization;
		if (!authorization?.startsWith('Bearer ')) {
			throw new UnauthorizedException(Message.TOKEN_NOT_EXIST);
		}

		try {
			request.authMember = await this.authService.getAuthenticatedMember(authorization.slice(7));
			return true;
		} catch (error) {
			if (error instanceof ForbiddenException || error instanceof UnauthorizedException) throw error;
			throw new UnauthorizedException(Message.NOT_AUTHENTICATED);
		}
	}
}
