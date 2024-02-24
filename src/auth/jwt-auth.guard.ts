import {
    ExecutionContext,
    ForbiddenException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from 'src/decorators/customize';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {

    constructor(private reflector: Reflector) {
        super();
    }

    canActivate(context: ExecutionContext) {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }
        return super.canActivate(context);
    }

    handleRequest(err, user, info, context: ExecutionContext) { // sau khi xác thực xong sẽ tự động gán thông tin decode vào biến req.user
        const request: Request = context.switchToHttp().getRequest();
        // You can throw an exception based on either "info" or "err" arguments
        if (err || !user) {
            throw err || new UnauthorizedException("Token không hợp lệ!!!", "Không xác thực được!!!");
        }

        // check permission
        const targetMethod = request.method;
        const targetEndPoint = request.route?.path as string;

        const permissions = user?.permission ?? [];
        let isExist = permissions.find((permission) =>
            targetMethod === permission.method &&
            targetEndPoint === permission.apiPath
        );
        if (targetEndPoint.startsWith("/api/v1/auth")) isExist = true; // check các endpoint bắt đầu bằng /api/v1/auth xét bằng true
        if (!isExist) {
            throw new ForbiddenException("Bạn không có quyền!!!");
        }
        return user;
    }
}