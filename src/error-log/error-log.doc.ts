import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { IncludeQuery, Unauthorized } from 'src/app/doc/app.doc';

const NotFound = ApiResponse({
    status: 404,
    description: 'Error: Not Found',
    schema: {
        example: {
            message: 'Error Log tidak ditemukan',
            error: 'Not Found',
            statusCode: 404,
        },
    },
});

export function GetAllErrorLogsDoc() {
    return applyDecorators(
        ApiOperation({ summary: 'Get All Error Logs. Role: Superadmin' }),
        IncludeQuery('user'),
        ApiResponse({
            status: 200,
            description: 'Success',
            schema: {
                example: {
                    last_page: [sample1, sample2],
                    limit: 10,
                    total: 2,
                    page: 1,
                    maxPages: 1,
                },
            },
        }),
        Unauthorized,
    );
}

export function GetErorLogsDoc() {
    return applyDecorators(
        ApiOperation({ summary: 'Get Error Logs By Id. Role: Superadmin' }),
        IncludeQuery('user'),
        ApiResponse({
            status: 200,
            description: 'Success',
            schema: {
                example: sample1,
            },
        }),
        NotFound,
        Unauthorized,
    );
}

const sample1 = {
    id: 2,
    message: 'Akun anda tidak aktif.',
    stack: 'UnauthorizedException: Akun anda tidak aktif.\n    at AuthService.login (C:\\Users\\rizja\\OneDrive\\Documents\\Projects\\areta\\logistic-sys-aas-BE\\src\\auth\\auth.service.ts:47:19)\n    at async C:\\Users\\rizja\\OneDrive\\Documents\\Projects\\areta\\logistic-sys-aas-BE\\node_modules\\@nestjs\\core\\router\\router-execution-context.js:46:28\n    at async C:\\Users\\rizja\\OneDrive\\Documents\\Projects\\areta\\logistic-sys-aas-BE\\node_modules\\@nestjs\\core\\router\\router-proxy.js:9:17',
    path: '/v1/auth/login',
    method: 'POST',
    statusCode: 401,
    userId: null,
    requestData: {
        body: {
            email: 'superadmin1@example.com',
            password: '[REDACTED]',
        },
        query: {},
        params: {},
    },
    headers: {
        host: 'localhost:5003',
        accept: 'application/json',
        cookie: 'access_token=88%7CMdXD6I6ecWDYpEtocI19a1c6oHf52u9XmqxRHu4096cdd4f4',
        origin: 'http://localhost:5003',
        referer: 'http://localhost:5003/api',
        'sec-ch-ua':
            '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
        connection: 'keep-alive',
        'user-agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
        'content-type': 'application/json',
        'content-length': '65',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'accept-encoding': 'gzip, deflate, br, zstd',
        'accept-language':
            'en-ID,en;q=0.9,id-ID;q=0.8,id;q=0.7,en-GB;q=0.6,en-US;q=0.5',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
    },
    createdAt: '2025-04-08T08:31:53.307Z',
};
const sample2 = {
    id: 4,
    message: 'Akun anda tidak aktif.',
    stack: 'UnauthorizedException: Akun anda tidak aktif.\n    at AuthService.login (C:\\Users\\rizja\\OneDrive\\Documents\\Projects\\areta\\logistic-sys-aas-BE\\src\\auth\\auth.service.ts:47:19)\n    at async C:\\Users\\rizja\\OneDrive\\Documents\\Projects\\areta\\logistic-sys-aas-BE\\node_modules\\@nestjs\\core\\router\\router-execution-context.js:46:28\n    at async C:\\Users\\rizja\\OneDrive\\Documents\\Projects\\areta\\logistic-sys-aas-BE\\node_modules\\@nestjs\\core\\router\\router-proxy.js:9:17',
    path: '/v1/auth/login',
    method: 'POST',
    statusCode: 401,
    userId: null,
    requestData: {
        body: {
            email: 'superadmin3@example.com',
            password: '[REDACTED]',
        },
        query: {},
        params: {},
    },
    headers: {
        host: 'localhost:5003',
        accept: 'application/json',
        cookie: 'access_token=88%7CMdXD6I6ecWDYpEtocI19a1c6oHf52u9XmqxRHu4096cdd4f4',
        origin: 'http://localhost:5003',
        referer: 'http://localhost:5003/api',
        'sec-ch-ua':
            '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
        connection: 'keep-alive',
        'user-agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
        'content-type': 'application/json',
        'content-length': '65',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'accept-encoding': 'gzip, deflate, br, zstd',
        'accept-language':
            'en-ID,en;q=0.9,id-ID;q=0.8,id;q=0.7,en-GB;q=0.6,en-US;q=0.5',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
    },
    createdAt: '2025-04-08T08:32:05.007Z',
};
