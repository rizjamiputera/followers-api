import { Controller, Get, NotFoundException, Param, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './auth/auth.metadata';
import { promises as fs } from 'fs';

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) { }

    @Get()
    @Public()
    root(@Res() res) {
        res.status(302).redirect('/api');
    }

    @Public()
    @Get('dummy/:file')
    async getDummyPhoto(@Param('file') file: string, @Res() res) {
        try {
            await fs.access(`./public/dummy/${file}`);
            res.sendFile(file, { root: './public/dummy' });
        } catch (error) {
            throw new NotFoundException('File not found');
        }
    }
}
