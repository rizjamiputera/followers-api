import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { ErrorLogService } from './error-log/error-log.service';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthGuard } from './auth/guards/auth.guard';
import { RolesGuard } from './auth/guards/roles/role.guards';
import { PermissionsGuard } from './auth/guards/permissions/permission.guard';
import { ErrorLoggerFilter } from './error-log/error-logger.filter';
import { AuthModule } from './auth/auth.module';
import { ArticleModule } from './article/article.module';
import { CommentModule } from './comment/comment.module';
import { PhotoContentModule } from './photo-content/photo-content.module';
import { EventModule } from './event/event.module';

@Module({
    imports: [
        ThrottlerModule.forRoot({
            // max 20 request wihin 10 seconds
            throttlers: [
                {
                    ttl: 10000,
                    limit: 100,
                },
            ],
        }),
        ConfigModule.forRoot(), // to load .env file
        AuthModule,
        ArticleModule,
        EventModule,
        PhotoContentModule,
        CommentModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,
        PrismaService,
        ErrorLogService,
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
        {
            provide: APP_GUARD,
            useClass: AuthGuard,
        },
        {
            provide: APP_GUARD,
            useClass: RolesGuard,
        },
        {
            provide: APP_GUARD,
            useClass: PermissionsGuard,
        },
        {
            provide: APP_FILTER,
            useClass: ErrorLoggerFilter,
        },
    ],
})
export class AppModule { }
