import { applyDecorators } from '@nestjs/common';
import {
    ApiBody,
    ApiConsumes,
    ApiOperation,
    ApiResponse,
} from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { IncludeQuery, Success204, Unauthorized } from 'src/app/doc/app.doc';

export function LoginDoc() {
    return applyDecorators(
        ApiOperation({
            summary: 'Login for User',
        }),
        ApiBody({
            type: LoginDto,
        }),
        ApiResponse({
            status: 201,
            // description: 'success',
            schema: {
                example: {
                    access_token:
                        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0NmE4NmJmMy0xMjllLTQ4YTQtOTQwNS0zZGE3YzA4OGIzMzMiLCJ1c2VybmFtZSI6ImFuYV9hYnNoaXJlNjFAZ21haWwuY29tIiwicm9sZSI6Ik1FTUJFUiIsImlhdCI6MTcyNzE0NDE3MSwiZXhwIjoxNzI3NzQ4OTcxfQ.R_WfgIA-SYsnk1GxylOcgTvXvbF9uWZ-NY8deptdXZs',
                    exp: 1727748971396,
                    user: {
                        id: '08c1bedf-05bb-4b23-99f0-fcf8edc2caf7',
                        name: 'Louis Langworth',
                        email: 'louislangworth16@gmail.com',
                    },
                },
            },
        }),
        ApiResponse({
            status: 401,
            description: 'Error: Unauthorized',
            schema: {
                example: {
                    message: 'Email atau password salah.',
                    error: 'Unauthorized',
                    statusCode: 401,
                },
            },
        }),
        ApiResponse({
            status: 400,
            description: 'Error: Bad Request',
            schema: {
                example: {
                    message: ['email must be an email'],
                    error: 'Bad Request',
                    statusCode: 400,
                },
            },
        }),
    );
}

export function RegisterDoc() {
    return applyDecorators(
        ApiOperation({
            summary: 'Register user, Public',
        }),
        ApiBody({
            type: RegisterDto,
        }),
        ApiResponse({
            status: 201,
            description: 'Success',
            schema: {
                example: {
                    message: 'Silahkan periksa email untuk verifikasi akun.',
                    statusCode: 201,
                },
            },
        }),
        ApiResponse({
            status: 400,
            description: 'Error: Bad Request',
            schema: {
                example: {
                    message: 'Email sudah terdaftar.',
                    statusCode: 400,
                },
            },
        }),
        ApiResponse({
            status: 400,
            description: 'Error: Bad Request',
            content: {
                'application/json': {
                    examples: {
                        'Bad Request': {
                            value: {
                                message: [
                                    'email must be an email',
                                    'password is not strong enough',
                                ],
                                error: 'Bad Request',
                                statusCode: 400,
                            },
                        },
                        'Password Mismatch': {
                            value: {
                                message: 'Konfirmasi password tidak sesuai',
                                error: 'Bad Request',
                                statusCode: 400,
                            },
                        },
                    },
                },
            },
        }),
    );
}

export function GetProfileDoc() {
    return applyDecorators(
        ApiOperation({
            summary: 'Get Profile, Private',
        }),
        IncludeQuery('permissions'),
        ApiResponse({
            status: 200,
            description: 'Success',
            schema: {
                example: exampleUser,
            },
        }),
        ApiResponse({
            status: 404,
            description: 'Error: Not Found',
            schema: {
                examples: {
                    message: 'User tidak ditemukan.',
                    statusCode: 404,
                },
            },
        }),
    );
}

export function UploadAvatarDoc() {
    return applyDecorators(
        ApiOperation({
            summary: 'Upload user avatar.',
            description: 'Support file type: jpeg|jpg|png. Max file size 10mb',
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
                example: exampleUser,
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
        ApiResponse({
            status: 404,
            description: 'Error: Not Found',
            schema: {
                examples: {
                    message: 'User tidak ditemukan.',
                    statusCode: 404,
                },
            },
        }),
    );
}

export function ChangePasswordDoc() {
    return applyDecorators(
        ApiOperation({
            summary: 'Change Password, Private',
        }),
        ApiBody({
            type: ChangePasswordDto,
        }),
        ApiResponse({
            status: 204,
        }),
        ApiResponse({
            status: 404,
            description: 'Error: Not Found',
            schema: {
                example: {
                    message: 'User not found',
                    statusCode: 404,
                },
            },
        }),
        ApiResponse({
            status: 400,
            description: 'Error: Bad Request',
            content: {
                'application/json': {
                    examples: {
                        'Password Is Not Strong': {
                            value: {
                                message: ['password is not strong enough'],
                                error: 'Bad Request',
                                statusCode: 400,
                            },
                        },
                        'Password Mismatch': {
                            value: {
                                message: 'Konfirmasi password tidak sesuai',
                                error: 'Bad Request',
                                statusCode: 400,
                            },
                        },
                        'Incorrect Old Password': {
                            value: {
                                message: 'Password lama salah.',
                                error: 'Bad Request',
                                statusCode: 400,
                            },
                        },
                    },
                },
            },
        }),
        Unauthorized,
    );
}

export function LogoutDoc() {
    return applyDecorators(
        ApiOperation({
            summary: 'Logout, Private',
        }),
        Success204,
        ApiResponse({
            status: 401,
            description: 'Error: Unauthorized',
            schema: {
                example: {
                    error: 'Unauthorized',
                    statusCode: 401,
                },
            },
        }),
    );
}

const exampleUser = {
    id: '46a86bf3-129e-48a4-9405-3da7c088b333',
    email: 'ana_abshire61@gmail.com',
    name: 'Ana Moen455',
    createdAt: '2023-10-23T12:23:40.488Z',
    updatedAt: '2024-09-17T02:49:13.652Z',
};
