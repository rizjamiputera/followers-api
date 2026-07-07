import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma.service';
import { UserService } from '../user/user.service';
import { AppService } from '../app.service';
import { MailService } from '../mail/mail.service';

describe('AuthService', () => {
    let service: AuthService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: PrismaService, useValue: {} },
                { provide: JwtService, useValue: {} },
                { provide: UserService, useValue: {} },
                { provide: AppService, useValue: {} },
                { provide: MailService, useValue: {} },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
