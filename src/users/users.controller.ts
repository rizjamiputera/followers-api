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
import { UsersService } from './users.service';
import { ApiBearerAuth } from '@nestjs/swagger';
// import { User } from './users.interface';
import { Paginate } from 'src/app/interface/app.interface';
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
} from './users.doc';
import { PaginationDeletedIncludeQueryDto } from 'src/app/dto/pagination-query.dto';
import { Module, Permission, Prisma, User, UserRole } from '@prisma/client';
import { UserFilterQueryDto } from './dto/user-filter.dto';
import { Roles } from 'src/auth/guards/roles/roles.decorator';
import { Role } from 'src/auth/guards/roles/role.enum';
import { CreateUserDto } from './dto/user-create.dto';
import { AuthService } from 'src/auth/auth.service';
import { ChangeUserPasswordDto } from './dto/user-change-password.dto';
import * as bcrypt from 'bcrypt';
import { FileInterceptor } from '@nestjs/platform-express';
import { AppService } from 'src/app.service';
import * as path from 'path';
import { UpdateUserDto } from './dto/user-update.dto';
import { PermissionsRequired } from 'src/auth/guards/permissions/permission.decorator';
import { CreateUserPermissionDto } from './dto/user-create-permission.dto';
import { IncludesQueryDto } from 'src/app/dto/include-query.dto';
import { CreateUserOperatorDto } from './dto/user-create-operator.dto';

@ApiBearerAuth()
@Controller({
    path: 'users',
    version: '1',
})
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly authService: AuthService,
        private readonly appService: AppService,
    ) { }

    @CreateSuperadminDoc()
    @Roles(Role.SUPERADMIN)
    @Post('superadmin')
    async createSuperadmin(
        @Body(new ValidationPipe()) dt: CreateUserDto,
    ): Promise<User> {
        const { warehouseId, ...dataDto } = dt;
        await this.authService.validateNewUser(dataDto);

        const password = await bcrypt.hash(dt.password, 10);

        const dataUser: Prisma.UserCreateInput = {
            ...dataDto,
            role: UserRole.SUPERADMIN,
            ...(warehouseId && {
                warehouse: { connect: { id: warehouseId } },
            }),
            password: {
                create: {
                    password,
                },
            },
        };

        return this.usersService.create(dataUser);
    }

    @CreateAdminDoc()
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @Post('admin')
    async createAdmin(
        @Body(new ValidationPipe()) dt: CreateUserDto,
    ): Promise<User> {
        const { warehouseId, ...dataDto } = dt;
        await this.authService.validateNewUser(dataDto);
        const password = await bcrypt.hash(dt.password, 10);

        const dataUser: Prisma.UserCreateInput = {
            ...dataDto,
            role: UserRole.ADMIN,
            ...(warehouseId && {
                warehouse: { connect: { id: warehouseId } },
            }),
            password: {
                create: {
                    password,
                },
            },
        };

        return this.usersService.create(dataUser);
    }

    @CreateOperatorDoc()
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @PermissionsRequired(Module.USER, Permission.CREATE)
    @Post('operator')
    async createManager(
        @Body(new ValidationPipe()) dt: CreateUserOperatorDto,
    ): Promise<User> {
        const { warehouseId, ...dataDto } = dt;

        await this.authService.validateNewUser(dataDto);
        const password = await bcrypt.hash(dt.password, 10);

        const dataUser: Prisma.UserCreateInput = {
            ...dataDto,
            role: UserRole.OPERATOR,
            ...(warehouseId && {
                warehouse: { connect: { id: warehouseId } },
            }),
            password: {
                create: {
                    password,
                },
            },
        };

        return this.usersService.create(dataUser);
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
        return this.usersService.findAll(
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
        return this.usersService.findOne(id, req.user.role, query.includes);
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
        const user = await this.usersService.findOne(id, req.user.role);
        if (!user) {
            throw new NotFoundException('User tidak ditemukan');
        }

        if (data.password != data.confirm_password)
            throw new BadRequestException(
                'Konfirmasi password tidak sesuai',
            );

        const password = await bcrypt.hash(data.password, 10);

        return this.usersService.change_password(id, password);
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
        const user = await this.usersService.findOne(id, req.user.role);
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

        return this.usersService.update(
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

        const currentData = await this.usersService.findOne(
            id,
            req.user.role,
        );
        const { warehouseId, ...dt } = dataDto;

        if (warehouseId === null) {
            if (
                [
                    Role.SALES_MANAGER,
                    Role.SALES_STAFF,
                    Role.WAREHOUSE_MANAGER,
                    Role.WAREHOUSE_STAFF,
                ].includes(currentData.role as Role)
            ) {
                throw new BadRequestException(
                    `User dengan role "${currentData.role.replaceAll('_', ' ')}" harus memiliki warehouse`,
                );
            }
        }

        const dataUser: Prisma.UserUpdateInput = {
            ...dt,
            ...(warehouseId !== undefined
                ? warehouseId !== null && warehouseId !== ''
                    ? { warehouse: { connect: { id: warehouseId } } }
                    : { warehouse: { disconnect: true } }
                : {}),
        };

        return this.usersService.update(
            userId,
            req.user.role,
            id,
            dataUser,
        );
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

        return this.usersService.update(
            userId,
            req.user.role,
            id,
            updateData,
        );
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

        return this.usersService.update(
            userId,
            req.user.role,
            id,
            updateData,
        );
    }

    @DeleteUserDoc()
    @HttpCode(204)
    @PermissionsRequired(Module.USER, Permission.DELETE)
    @Delete(':id')
    remove(@Request() req: any, @Param('id') id: string) {
        const userId = req.user.id;

        return this.usersService.remove(userId, req.user.role, id);
    }

    @AddUserPermissionDoc()
    @PermissionsRequired(Module.USER, Permission.EDIT)
    @HttpCode(204)
    @Post('add-permission')
    async addPermission(
        @Body(new ValidationPipe()) dataDto: CreateUserPermissionDto,
    ): Promise<void> {
        const { userId, ...dt } = dataDto;

        const user: User = await this.usersService.findUnique(userId);
        if (
            user.role == UserRole.SUPERADMIN ||
            user.role == UserRole.ADMIN
        ) {
            return;
        }

        const data: Prisma.UserPermissionCreateInput = {
            ...dt,
            user: { connect: { id: userId } },
        };

        await this.usersService.addPermission(data);

        return;
    }

    @RemoveUserPermissionDoc()
    @PermissionsRequired(Module.USER, Permission.EDIT)
    @HttpCode(204)
    @Delete('remove-permission/:id')
    async removePermission(@Param('id') id: string): Promise<void> {
        await this.usersService.removePermission(id);
        return;
    }
}
