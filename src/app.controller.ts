import { Body, Controller, Get, NotFoundException, Param, Post, Req, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './auth/auth.metadata';
import { promises as fs } from 'fs';
import { VisitPayload } from './app/interface/app.interface';

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) { }

    @Public()
    @Get()
    root(@Res() res) {
        res.status(302).redirect('/api');
    }

    @Public()
    @Get('dummy/*path')
    async getDummyPhoto(@Param('path') path: any, @Res() res) {
        const filePath = path.join('/')
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
        const filePath = path.join('/')
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
        const filePath = path.join('/')
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
    visit(
        @Req() req,
        @Body('path') path: string,
    ) {

        const visit: VisitPayload = {
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            referrer: req.headers['referer'] || null,
            userId: req.user?.id || null, // if auth use
            fingerprint: req.headers['x-fingerprint'] || null,
            path
        }

        return this.appService.visit(visit);
    }
}
