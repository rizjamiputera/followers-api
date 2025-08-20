import { Controller, Get, NotFoundException, Param, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './auth/auth.metadata';
import { promises as fs } from 'fs';

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
        } catch (error) {
            throw new NotFoundException('File not found');
        }
    }
    @Public()
    @Get('photo/*path')
    async getphotoPhoto(@Param('path') path: any, @Res() res) {
        const filePath = path.join('/')
        try {
            await fs.access(`./public/photo/${filePath}`);
            res.sendFile(filePath, { root: './public/photo' });
        } catch (error) {
            throw new NotFoundException('File not found');
        }
    }
}
