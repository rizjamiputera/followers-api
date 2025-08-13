import { applyDecorators } from '@nestjs/common';
import {
    ApiBody,
    ApiConsumes,
    ApiOperation,
    ApiResponse,
} from '@nestjs/swagger';
import {
    Forbidden,
    IncludeQuery,
    Success204,
    Unauthorized,
} from 'src/app/doc/app.doc';
import { CreateUserDto } from './dto/user-create.dto';
import { ChangeUserPasswordDto } from './dto/user-change-password.dto';
import { CreateUserPermissionDto } from './dto/user-create-permission.dto';
import { CreateUserOperatorDto } from './dto/user-create-operator.dto';

const NotFound = ApiResponse({
    status: 404,
    description: 'Error: Not Found',
    schema: {
        example: {
            message: 'User tidak ditemukan',
            error: 'Not Found',
            statusCode: 404,
        },
    },
});

const PasswordNotMatch = ApiResponse({
    status: 400,
    description: 'Error: Bad Request',
    schema: {
        example: {
            message: 'Konfirmasi password tidak sesuai',
            error: 'Bad Request',
            statusCode: 400,
        },
    },
});

const ConflictEmail = ApiResponse({
    status: 409,
    description: 'Error: Conflict',
    schema: {
        example: {
            message: 'Email sudah terdaftar',
            statusCode: 409,
        },
    },
});

export function CreateSuperadminDoc() {
    return applyDecorators(
        ApiOperation({
            summary: 'Create Superadmin',
            description: `Accessible only to users with the following roles:\n
    - SUPERADMIN`,
        }),
        ApiBody({
            type: CreateUserDto,
        }),
        ApiResponse({
            status: 200,
            description: 'Success',
            schema: {
                example: sampleUser1,
            },
        }),
        ConflictEmail,
        PasswordNotMatch,
        Unauthorized,
    );
}

export function CreateAdminDoc() {
    return applyDecorators(
        ApiOperation({
            summary: 'Create Admin',
            description: `Accessible only to users with the following roles:\n
    - SUPERADMIN
    - ADMIN`,
        }),
        ApiBody({
            type: CreateUserDto,
        }),
        ApiResponse({
            status: 200,
            description: 'Success',
            schema: {
                example: sampleUser1,
            },
        }),
        ConflictEmail,
        PasswordNotMatch,
        Unauthorized,
    );
}

export function CreateOperatorDoc() {
    return applyDecorators(
        ApiOperation({
            summary: 'Create Manager',
            description: `Accessible only to users with the following roles:\n
    - SUPERADMIN
    - ADMIN
    - or Permission: USER.CREATE`,
        }),
        ApiBody({
            type: CreateUserOperatorDto,
        }),
        ApiResponse({
            status: 200,
            description: 'Success',
            schema: {
                example: sampleUser1,
            },
        }),
        ConflictEmail,
        PasswordNotMatch,
        Unauthorized,
    );
}

export function GetAllUserDoc() {
    return applyDecorators(
        ApiOperation({
            summary: 'Get All Users. Permission: USER.READ',
        }),
        IncludeQuery('permissions'),
        ApiResponse({
            status: 200,
            description: 'Success',
            schema: {
                example: {
                    last_page: [sampleUser1, sampleUser2],
                    limit: 10,
                    total: 2,
                    page: 1,
                    maxPages: 1,
                },
            },
        }),
        Unauthorized,
        Forbidden,
    );
}

export function GetUserDoc() {
    return applyDecorators(
        ApiOperation({
            summary: 'Get User By Id. Permission: USER.READ',
        }),
        IncludeQuery('permissions'),
        ApiResponse({
            status: 200,
            description: 'Success',
            schema: {
                example: sampleUser1,
            },
        }),
        NotFound,
        Unauthorized,
    );
}

export function ActivateUserDoc() {
    return applyDecorators(
        ApiOperation({
            summary: 'Activate User By Id. Permission: USER.EDIT',
        }),
        Success204,
        NotFound,
        Unauthorized,
    );
}

export function ChangeUserPasswordDoc() {
    return applyDecorators(
        ApiOperation({
            summary: 'Change User Password By Id. Permission: USER.EDIT',
        }),
        ApiBody({
            type: ChangeUserPasswordDto,
        }),
        Success204,
        NotFound,
        Unauthorized,
    );
}

export function UploadAvatarDoc() {
    return applyDecorators(
        ApiOperation({
            summary: 'Change user avatar. Permission: USER.EDIT',
            description: 'Support file type: jpeg|jpg|png. Max file size 10mb.',
        }),
        ApiConsumes('multipart/form-data'),
        ApiBody({
            schema: {
                type: 'object',
                properties: {
                    avatar: {
                        type: 'string',
                        format: 'binary',
                    },
                },
            },
        }),
        ApiResponse({
            status: 200,
            description: 'Success',
            schema: {
                example: sampleUser1,
            },
        }),
        ApiResponse({
            status: 400,
            description: 'Error: Bad Request',
            content: {
                'application/json': {
                    examples: {
                        'File type is not supported': {
                            value: {
                                message:
                                    'Validation failed (expected type is image/jpeg|jpg|png)"',
                                error: 'Bad Request',
                                statusCode: 400,
                            },
                        },
                    },
                },
            },
        }),
        NotFound,
    );
}

export function DeactivateUserDoc() {
    return applyDecorators(
        ApiOperation({
            summary: 'Deactivate User By ID. Permission: USER.EDIT',
        }),
        Success204,
        NotFound,
        Unauthorized,
    );
}

export function UpdateUserDoc() {
    return applyDecorators(
        ApiOperation({
            summary: 'Update User By ID. Permission: USER.EDIT',
        }),
        // ApiBody({
        //     type: UpdateUserDto,
        // }),
        ApiResponse({
            status: 200,
            description: 'Success',
            schema: {
                example: sampleUser1,
            },
        }),
        NotFound,
        Unauthorized,
    );
}

export function DeleteUserDoc() {
    return applyDecorators(
        ApiOperation({
            summary: 'Delete User By Id. Permission: USER.DELETE',
        }),
        Success204,
        NotFound,
        Unauthorized,
    );
}

export function AddUserPermissionDoc() {
    return applyDecorators(
        ApiOperation({
            summary: 'Add permission to user. Permission: USER.EDIT',
        }),
        ApiBody({
            type: CreateUserPermissionDto,
        }),
        Success204,
        Unauthorized,
    );
}

export function RemoveUserPermissionDoc() {
    return applyDecorators(
        ApiOperation({
            summary: 'Remove permission to user. Permission: USER.EDIT',
        }),
        Success204,
        Unauthorized,
    );
}

const sampleUser1 = {
    id: 'dfd7c578-4aaa-4653-b36a-ae75ce396634',
    warehouseId: 'dfd9cdde-f796-4ec4-be92-657a14773124',
    role: 'WAREHOUSE_STAFF',
    name: 'Warehouse staff 5',
    email: 'warehouse_staff5@example.com',
    avatar: '/dummy/avatar.jpg',
    avatar_md: '/dummy/avatar.jpg',
    createdAt: '2025-03-23T16:04:47.171Z',
    updatedAt: '2025-03-23T16:04:47.210Z',
    active: true,
    deleted: false,
};
const sampleUser2 = {
    id: '437a9627-0a86-4f3f-942c-4286b287de90',
    warehouseId: 'dfd9cdde-f796-4ec4-be92-657a14773124',
    role: 'WAREHOUSE_STAFF',
    name: 'Warehouse staff 4',
    email: 'warehouse_staff4@example.com',
    avatar: '/dummy/avatar.jpg',
    avatar_md: '/dummy/avatar.jpg',
    createdAt: '2025-03-23T16:04:47.167Z',
    updatedAt: '2025-03-23T16:04:47.210Z',
    active: true,
    deleted: false,
};
