import { ApiQuery, ApiResponse } from '@nestjs/swagger';

export const Success204 = ApiResponse({
    status: 204,
    description: 'Success',
});

export const Unauthorized = ApiResponse({
    status: 401,
    description: 'Error: Unauthorized',
    schema: {
        example: {
            message: 'Unauthorized',
            statusCode: 401,
        },
    },
});

export const Forbidden = ApiResponse({
    status: 403,
    description: 'Forbidden. You do not have the required role.',
    schema: {
        example: {
            message: 'Forbidden resource',
            error: 'Forbidden',
            statusCode: 403,
        },
    },
});

export const SortByQuery = ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Sort by field',
});

export const OrderQuery = ApiQuery({
    name: 'order',
    required: false,
    type: String,
    description: 'Sort order (ASC/DESC)',
});

export const IncludeQuery = (relation: string) =>
    ApiQuery({
        name: 'includes',
        required: false,
        type: String,
        description: `Includes relation in return data, separated by coma (,) Available relation = ${relation}`,
    });
