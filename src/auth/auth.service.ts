import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { PrismaService } from 'src/prisma.service';
import { User } from 'src/users/users.interface';
import { JwtService } from '@nestjs/jwt';
import * as dayjs from 'dayjs';
import { Prisma, UserRole } from '@prisma/client';
import { RegisterDto } from './dto/register.dto';
import { UsersService } from 'src/users/users.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private userService: UsersService,
    ) { }

    // collect expired tokens in blacklist
    private blacklistedTokens: Set<string> = new Set();

    async login(dt: LoginDto) {
        const email: string = dt.email.toLowerCase();
        const user: User = await this.prisma.user.findFirst({
            where: { email },
            include: { password: true, permissions: true },
        });
        if (!user)
            throw new UnauthorizedException('Email atau password salah.');

        // check password
        const match = await bcrypt.compare(dt.password, user.password.password);
        if (!match) {
            throw new UnauthorizedException('Email atau password salah.');
        }

        // check active
        if (!user.active) {
            throw new UnauthorizedException('Akun anda tidak aktif.');
        }

        return this.loginProcess(email, user);
    }

    async loginProcess(email: string, user: User) {
        delete user.password;
        delete user.createdAt;
        delete user.updatedAt;
        const { access_token, exp } = await this.createToken(
            user.id,
            user.email,
            user.role,
        );
        return { access_token, exp, user };
    }

    async createToken(
        userId: string,
        email: string,
        role: UserRole,
    ): Promise<Record<string, any>> {
        const access_token = (await this.jwtService.signAsync({
            sub: userId,
            email,
            role,
        })) as string;
        const exp = Math.round(dayjs().add(7, 'd').valueOf()) as number;
        const expDate = new Date(exp);
        // save to db
        await this.createAuth(userId, access_token, expDate);

        return { access_token, exp };
    }

    async createAuth(
        userId: string,
        access_token: string,
        expiredAt: Date,
        path = '/auth/login',
        method = 'POST',
    ): Promise<void> {
        const data: Prisma.AuthCreateInput = {
            User: {
                connect: { id: userId },
            },
            access_token,
            expiredAt,
            path,
            method,
        };
        await this.prisma.auth.create({ data });
    }

    async validateNewUser(data: RegisterDto) {
        // check is password
        await this.checkPassword(data);

        // remove confirm_password
        delete data.confirm_password;

        // email to lowercase
        data.email = data.email.toLowerCase().trim();

        // check is email taken?
        const checkUser = await this.userService.findByEmail(data.email);
        if (checkUser) throw new ConflictException('Email sudah terdaftar');
    }

    async checkPassword(data: RegisterDto) {
        if (data.password != data.confirm_password)
            throw new BadRequestException('Konfirmasi password tidak sesuai');

        // delete data.confirm_password;
        data.password = await bcrypt.hash(data.password, 10);
    }

    async changePassword(
        userId: string,
        data: ChangePasswordDto,
    ): Promise<void> {
        const user = await this.prisma.user.findFirst({
            where: { id: userId },
            include: { password: true },
        });
        if (!user) throw new NotFoundException('User tidak ditemukan.');

        if (data.password != data.confirm_password)
            throw new BadRequestException('Konfirmasi password tidak sesuai');

        const checkPassword = await bcrypt.compare(
            data.old_password,
            user.password.password,
        );

        if (!checkPassword)
            throw new BadRequestException('Password lama salah');

        const password = await bcrypt.hash(data.password, 10);
        await this.prisma.password.update({
            where: { userId: user.id },
            data: { password },
        });
    }

    addBlackListToken(token: string) {
        this.blacklistedTokens.add(token);
    }

    isTokenBlacklisted(token: string): boolean {
        return this.blacklistedTokens.has(token);
    }
}
