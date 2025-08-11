import { Controller, Get, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './auth/auth.metadata';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  @Public()
  root(@Res() res) {
    res.status(302).redirect('/api');
  }
}
