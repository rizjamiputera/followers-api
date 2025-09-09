import {
    Body,
    Controller,
    Get,
    NotFoundException,
    Param,
    Post,
    Query,
    Req,
    Res,
    ValidationPipe,
} from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './auth/auth.metadata';
import { promises as fs } from 'fs';
import { Paginate, VisitPayload } from './app/interface/app.interface';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from './auth/guards/roles/roles.decorator';
import { ErrorLog, Role } from '@prisma/client';
import { PaginationIncludeQueryDto } from './app/dto/pagination-query.dto';
import { SendEmailDto } from './app/dto/send-email.dto';
import * as path from 'path';
import { MailService } from './mail/mail.service';

@Controller()
export class AppController {
    constructor(
        private readonly appService: AppService,
        private readonly mailService: MailService,
    ) { }

    @Public()
    @Get()
    root(@Res() res) {
        res.status(302).redirect('/api');
    }

    @Public()
    @Get('version')
    @ApiTags('System')
    getVersion() {
        const packageJsonPath = path.join(process.cwd(), 'package.json');
        const packageJson = require(packageJsonPath);
        return {
            version: packageJson.version,
            name: packageJson.name,
            timestamp: new Date().toISOString(),
        };
    }

    @Public()
    @Get('health')
    @ApiTags('System')
    healthCheck() {
        const packageJsonPath = path.join(process.cwd(), 'package.json');
        const packageJson = require(packageJsonPath);

        const uptimeSeconds = process.uptime();
        const days = Math.floor(uptimeSeconds / (24 * 60 * 60));
        const hours = Math.floor((uptimeSeconds % (24 * 60 * 60)) / (60 * 60));
        const minutes = Math.floor((uptimeSeconds % (60 * 60)) / 60);
        const seconds = Math.floor(uptimeSeconds % 60);

        const uptimeReadable = `${days}d ${hours}h ${minutes}m ${seconds}s`;

        return {
            status: 'ok',
            version: packageJson.version,
            uptime: uptimeReadable,
            uptimeSeconds: Math.floor(uptimeSeconds),
            timestamp: new Date().toISOString(),
        };
    }

    @Public()
    @Get('dummy/*path')
    async getDummyPhoto(@Param('path') path: any, @Res() res) {
        const filePath = path.join('/');
        try {
            await fs.access(`./public/dummy/${filePath}`);
            res.sendFile(filePath, { root: './public/dummy' });
        } catch (_error) {
            throw new NotFoundException('File not found');
        }
    }

    @Public()
    @Get('avatar/*path')
    async getAvatar(@Param('path') path: any, @Res() res) {
        const filePath = path.join('/');
        try {
            await fs.access(`./public/avatar/${filePath}`);
            res.sendFile(filePath, { root: './public/avatar' });
        } catch (_error) {
            throw new NotFoundException('File not found');
        }
    }

    @Public()
    @Get('photo/*path')
    async getPhoto(@Param('path') path: any, @Res() res) {
        const filePath = path.join('/');
        try {
            await fs.access(`./public/photo/${filePath}`);
            res.sendFile(filePath, { root: './public/photo' });
        } catch (_error) {
            throw new NotFoundException('File not found');
        }
    }

    // STATISTICS
    @Public()
    @Post('visit')
    visit(@Req() req, @Body('path') path: string) {
        const visit: VisitPayload = {
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            referrer: req.headers['referer'] || null,
            userId: req.user?.id || null, // if auth use
            fingerprint: req.headers['x-fingerprint'] || null,
            path,
        };

        return this.appService.visit(visit);
    }

    @ApiBearerAuth()
    @Roles(Role.SUPERADMIN)
    @Get('error-logs')
    getAllErrorLog(
        @Query(new ValidationPipe({ transform: true }))
        pagination: PaginationIncludeQueryDto,
    ): Promise<Paginate<ErrorLog[]>> {
        return this.appService.getAllErrorLog(pagination);
    }

    @Public()
    @Post('send-test-email')
    async sayHello(
        @Body(new ValidationPipe()) sendEmailDto: SendEmailDto,
    ): Promise<{ success: boolean; message: string }> {
        try {
            // Send email using the provided data
            const emailSent = await this.mailService.sendEmail({
                to: sendEmailDto.to,
                subject: sendEmailDto.subject || 'Hello from Followers Bicara!',
                html: sendEmailDto.html || '<h1>Hello World!</h1><p>This is a test email from our API.</p>',
                text: sendEmailDto.text || 'Hello World! This is a test email from our API.'
            });

            if (emailSent) {
                return {
                    success: true,
                    message: `Test email sent successfully to ${sendEmailDto.to}`
                };
            } else {
                return {
                    success: false,
                    message: 'Failed to send email. Please check email configuration.'
                };
            }
        } catch (error) {
            console.error('Error sending test email:', error);
            return {
                success: false,
                message: 'An error occurred while sending the email.'
            };
        }
    }
}
