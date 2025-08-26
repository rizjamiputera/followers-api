import {
    Controller,
    Get,
    Param,
    Delete,
    HttpCode,
    Query,
    ValidationPipe,
    Request,
    Patch,
    Post,
    Body,
    BadRequestException,
    NotFoundException,
    UseInterceptors,
    UploadedFile,
    ParseFilePipe,
    MaxFileSizeValidator,
    FileTypeValidator,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
// import { User } from './user.interface';
import { Paginate } from 'src/app/interface/app.interface';
import { PaginationDeletedIncludeQueryDto } from 'src/app/dto/pagination-query.dto';
import { Module, Permission, Prisma, Role, User } from '@prisma/client';
import { UserFilterQueryDto } from './dto/user-filter.dto';
import { Roles } from 'src/auth/guards/roles/roles.decorator';
import { CreateUserDto } from './dto/user-create.dto';
import { AuthService } from 'src/auth/auth.service';
import { ChangeUserPasswordDto } from './dto/user-change-password.dto';
import * as bcrypt from 'bcrypt';
import { FileInterceptor } from '@nestjs/platform-express';
import { AppService } from 'src/app.service';
import { UpdateUserDto } from './dto/user-update.dto';
import { PermissionsRequired } from 'src/auth/guards/permissions/permission.decorator';
import { UserPermissionDto } from './dto/user-permission.dto';
import { IncludesQueryDto } from 'src/app/dto/include-query.dto';
import { CreateUserOperatorDto } from './dto/user-create-operator.dto';
import { UserService } from './user.service';
import {
    ActivateUserDoc,
    AddUserPermissionDoc,
    ChangeUserPasswordDoc,
    CreateAdminDoc,
    CreateOperatorDoc,
    CreateSuperadminDoc,
    DeactivateUserDoc,
    DeleteUserDoc,
    GetAllUserDoc,
    GetUserDoc,
    RemoveUserPermissionDoc,
    UpdateUserDoc,
    UploadAvatarDoc,
} from './user.doc';

@ApiBearerAuth()
@Controller({
    path: 'user',
    version: '1',
})
export class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly authService: AuthService,
        private readonly appService: AppService,
    ) {}

    @CreateSuperadminDoc()
    @Roles(Role.SUPERADMIN)
    @Post('superadmin')
    async createSuperadmin(
        @Body(new ValidationPipe()) dataDto: CreateUserDto,
    ): Promise<User> {
        await this.authService.validateNewUser(dataDto);

        const password = await bcrypt.hash(dataDto.password, 10);

        const dataUser: Prisma.UserCreateInput = {
            ...dataDto,
            role: Role.SUPERADMIN,
            password: {
                create: {
                    password,
                },
            },
        };

        return this.userService.create(dataUser);
    }

    @CreateAdminDoc()
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @Post('admin')
    async createAdmin(
        @Body(new ValidationPipe()) dataDto: CreateUserDto,
    ): Promise<User> {
        await this.authService.validateNewUser(dataDto);
        const password = await bcrypt.hash(dataDto.password, 10);

        const dataUser: Prisma.UserCreateInput = {
            ...dataDto,
            role: Role.ADMIN,
            password: {
                create: {
                    password,
                },
            },
        };

        return this.userService.create(dataUser);
    }

    @CreateOperatorDoc()
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @PermissionsRequired(Module.USER, Permission.CREATE)
    @Post('operator')
    async createManager(
        @Body(new ValidationPipe()) dataDto: CreateUserOperatorDto,
    ): Promise<User> {
        await this.authService.validateNewUser(dataDto);
        const password = await bcrypt.hash(dataDto.password, 10);

        const dataUser: Prisma.UserCreateInput = {
            ...dataDto,
            role: Role.OPERATOR,
            password: {
                create: {
                    password,
                },
            },
        };

        return this.userService.create(dataUser);
    }

    @GetAllUserDoc()
    @PermissionsRequired(Module.USER, Permission.READ)
    @Get()
    findAll(
        @Request() req: any,
        @Query(new ValidationPipe({ transform: true }))
        filters: UserFilterQueryDto,
        @Query(new ValidationPipe({ transform: true }))
        pagination: PaginationDeletedIncludeQueryDto,
        @Query(new ValidationPipe({ transform: true })) query: IncludesQueryDto,
    ): Promise<Paginate<User[]>> {
        return this.userService.findAll(
            pagination,
            filters,
            req.user.role,
            query.includes,
        );
    }

    @GetUserDoc()
    @PermissionsRequired(Module.USER, Permission.READ)
    @Get(':id')
    findOne(
        @Request() req: any,
        @Param('id') id: string,
        @Query(new ValidationPipe({ transform: true })) query: IncludesQueryDto,
    ) {
        return this.userService.findOne(id, req.user.role, query.includes);
    }

    @ChangeUserPasswordDoc()
    @HttpCode(204)
    @PermissionsRequired(Module.USER, Permission.EDIT)
    @Patch('change_password/:id')
    async change_password(
        @Request() req: any,
        @Param('id') id: string,
        @Body(new ValidationPipe()) data: ChangeUserPasswordDto,
    ) {
        const user = await this.userService.findOne(id, req.user.role);
        if (!user) {
            throw new NotFoundException('User tidak ditemukan');
        }

        if (data.password != data.confirm_password)
            throw new BadRequestException('Konfirmasi password tidak sesuai');

        const password = await bcrypt.hash(data.password, 10);

        return this.userService.change_password(id, password);
    }

    @UploadAvatarDoc()
    @PermissionsRequired(Module.USER, Permission.EDIT)
    @Post('avatar/:id')
    @UseInterceptors(FileInterceptor('avatar'))
    async uploadAvatar(
        @Request() req,
        @Param('id') id: string,
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
        const user = await this.userService.findOne(id, req.user.role);
        if (!user) {
            throw new NotFoundException('User tidak ditemukan');
        }

        const { large, medium } = await this.appService.save_images(
            avatar,
            '/avatar',
        );

        const dataUser: Prisma.UserUpdateInput = {
            avatar: large,
            avatar_md: medium,
        };

        return this.userService.update(
            req.user.id,
            req.user.role,
            id,
            dataUser,
        );
    }

    @UpdateUserDoc()
    @PermissionsRequired(Module.USER, Permission.EDIT)
    @Patch(':id')
    async update(
        @Request() req: any,
        @Param('id') id: string,
        @Body(new ValidationPipe()) dataDto: UpdateUserDto,
    ) {
        const userId = req.user.id;

        return this.userService.update(userId, req.user.role, id, dataDto);
    }

    @ActivateUserDoc()
    @HttpCode(204)
    @PermissionsRequired(Module.USER, Permission.EDIT)
    @Patch('activate/:id')
    activate(@Request() req: any, @Param('id') id: string) {
        const userId = req.user.id;

        const updateData: Prisma.UserUpdateInput = {
            active: true,
        };

        return this.userService.update(userId, req.user.role, id, updateData);
    }

    @DeactivateUserDoc()
    @HttpCode(204)
    @PermissionsRequired(Module.USER, Permission.EDIT)
    @Patch('deactivate/:id')
    deactivate(@Request() req: any, @Param('id') id: string) {
        const userId = req.user.id;

        const updateData: Prisma.UserUpdateInput = {
            active: false,
        };

        return this.userService.update(userId, req.user.role, id, updateData);
    }

    @DeleteUserDoc()
    @HttpCode(204)
    @PermissionsRequired(Module.USER, Permission.DELETE)
    @Delete('/remove/:id')
    remove(@Request() req: any, @Param('id') id: string) {
        const userId = req.user.id;

        return this.userService.remove(userId, req.user.role, id);
    }

    @AddUserPermissionDoc()
    @PermissionsRequired(Module.USER, Permission.EDIT)
    @HttpCode(204)
    @Post('add-permission')
    async addPermission(
        @Body(new ValidationPipe()) dataDto: UserPermissionDto,
    ): Promise<void> {
        const { userId, ...dt } = dataDto;

        const user: User = await this.userService.findUnique(userId);
        if (user.role == Role.SUPERADMIN || user.role == Role.ADMIN) {
            return;
        }

        const data: Prisma.UserPermissionCreateInput = {
            ...dt,
            user: { connect: { id: userId } },
        };

        await this.userService.addPermission(data);

        return;
    }

    @RemoveUserPermissionDoc()
    @PermissionsRequired(Module.USER, Permission.EDIT)
    @HttpCode(204)
    @Delete('remove-permission')
    async removePermission(
        @Body(new ValidationPipe()) dataDto: UserPermissionDto,
    ): Promise<void> {
        await this.userService.removePermission(dataDto);
        return;
    }
}
