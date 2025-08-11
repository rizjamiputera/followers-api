import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { AuthService } from '../auth.service';
import * as dayjs from 'dayjs';
import { IS_PUBLIC_KEY } from '../auth.metadata';
import { jwtConstants } from '../auth.constants';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private reflector: Reflector,
        private authService: AuthService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(
            IS_PUBLIC_KEY,
            [context.getHandler(), context.getClass()],
        );
        if (isPublic) return true;

        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);
        if (!token) throw new UnauthorizedException();

        // check is token in black listed
        const isTokenBlackListed = this.authService.isTokenBlacklisted(token);
        if (isTokenBlackListed) throw new UnauthorizedException();

        try {
            const { sub, ...user } = await this.jwtService.verifyAsync(token, {
                secret: jwtConstants.secret,
            });

            // 💡 We're assigning the payload to the request object here
            // so that we can access it in our route handlers
            user.id = sub;
            request['user'] = user;
            await this.authService.createAuth(
                sub,
                token,
                dayjs(user.exp * 1000).toDate(),
                request.path,
                request.method,
            );
        } catch (e) {
            throw new UnauthorizedException();
        }
        return true;
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}
