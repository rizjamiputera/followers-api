import {
    Controller,
    Post,
    Body,
    ValidationPipe,
    HttpCode,
    Patch,
    Request,
    Delete,
    Req,
    Get,
    UseInterceptors,
    UploadedFile,
    ParseFilePipe,
    MaxFileSizeValidator,
    FileTypeValidator,
    Query,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Prisma, User } from '@prisma/client';
import { UsersService } from 'src/users/users.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Public } from './auth.metadata';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
    ChangePasswordDoc,
    GetProfileDoc,
    LoginDoc,
    LogoutDoc,
    UploadAvatarDoc,
} from './auth.doc';
import { FileInterceptor } from '@nestjs/platform-express';
import { AppService } from 'src/app.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { IncludesQueryDto } from 'src/app/dto/include-query.dto';

@ApiTags('Auth')
@Controller({
    path: 'auth',
    version: '1',
})
// TODO update profile
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly userService: UsersService,
        private readonly appService: AppService,
    ) { }

    @Public()
    @LoginDoc()
    @Post('login')
    login(@Body(new ValidationPipe()) dt: LoginDto) {
        try {
            return this.authService.login(dt);
        } catch (error) {
            throw error;
        }
    }

    // @Public()
    // @HttpCode(HttpStatus.OK)
    // @RegisterDoc()
    // @Post('register')
    // async register(
    //     @Body(new ValidationPipe()) dt: RegisterDto,
    //     @Res() res: Response,
    // ) {
    //     try {
    //         // validate new user
    //         await this.authService.validateNewUser(dt);

    //         // remove confirm password
    //         delete dt.confirm_password;

    //         const dataUser: Prisma.UserCreateInput = {
    //             ...dt,
    //             password: {
    //                 create: {
    //                     password: dt.password,
    //                 },
    //             },
    //         };

    //         await this.userService.create(dataUser);
    //         // kirim kode aktivasi ke email
    //         // await this.authService.sendActivation(user.email);

    //         res.status(HttpStatus.OK).json({
    //             // message: 'Silahkan periksa email untuk verifikasi akun.',
    //             message: 'Registrasi Berhasil, silahkan login.',
    //         });
    //     } catch (error) {
    //         throw error;
    //     }
    // }

    @GetProfileDoc()
    @ApiBearerAuth()
    @Get('profile')
    async getProfile(
        @Request() req,
        @Query(new ValidationPipe({ transform: true })) query: IncludesQueryDto,
    ) {
        try {
            const userId = req.user.id;
            const user: User = await this.userService.findUnique(
                userId,
                query.includes,
            );

            return user;
        } catch (error) {
            throw error;
        }
    }

    @ApiBearerAuth()
    @Patch('profile')
    async updateProfile(
        @Request() req,
        @Body(new ValidationPipe()) data: UpdateUserDto,
    ) {
        try {
            const userId = req.user.id;
            const user: User = await this.userService.update(
                userId,
                req.user.role,
                userId,
                data,
            );

            return user;
        } catch (error) {
            throw error;
        }
    }

    @ChangePasswordDoc()
    @ApiBearerAuth()
    @Patch('change_password')
    @HttpCode(204)
    async changePassword(
        @Request() req: any,
        @Body(new ValidationPipe()) data: ChangePasswordDto,
    ) {
        try {
            return await this.authService.changePassword(req.user.id, data);
        } catch (error) {
            throw error;
        }
    }

    @LogoutDoc()
    @ApiBearerAuth()
    @Delete('logout')
    @HttpCode(204)
    logOut(@Req() req) {
        try {
            const token = req.headers.authorization.split(' ')[1];

            this.authService.addBlackListToken(token);
        } catch (error) {
            throw error;
        }
    }

    @UploadAvatarDoc()
    @Post('avatar')
    @ApiBearerAuth()
    @UseInterceptors(FileInterceptor('avatar'))
    async uploadAvatar(
        @Request() req,
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    // max 10 MB
                    new MaxFileSizeValidator({ maxSize: 10000 * 1000 }),
                    new FileTypeValidator({
                        fileType: 'image/jpeg|jpg|png',
                    }),
                ],
            }),
        )
        avatar: Express.Multer.File,
    ) {
        const userId = req.user.id;

        const { large, medium } = await this.appService.save_images(
            avatar,
            '/avatar',
        );

        const dataUser: Prisma.UserUpdateInput = {
            avatar: large,
            avatar_md: medium,
        };

        return this.userService.update(userId, req.user.role, userId, dataUser);
    }
}
