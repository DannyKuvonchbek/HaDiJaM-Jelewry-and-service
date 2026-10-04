import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthService } from '../auth.service';

@Injectable()
export class WithoutGuard implements CanActivate {
	constructor(private readonly authService: AuthService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = GqlExecutionContext.create(context).getContext().req;
		const authorization = request?.headers?.authorization;
		request.authMember = null;

		if (authorization?.startsWith('Bearer ')) {
			try {
				request.authMember = await this.authService.verifyToken(authorization.slice(7));
			} catch {
				request.authMember = null;
			}
		}
		return true;
	}
}
