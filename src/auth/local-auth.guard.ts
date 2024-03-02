import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const request = context.switchToHttp().getRequest();
        const isGitHubLogin = request.body.type === 'github';

        if (isGitHubLogin) {
            return true;
        }

        return super.canActivate(context);
    }

    handleRequest(err: any, user: any): any {
        if (err || !user) {
            throw err || new UnauthorizedException('Unauthorized');
        }
        return user;
    }
}
