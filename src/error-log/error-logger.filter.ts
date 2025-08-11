import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
    BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorLogService } from '../error-log/error-log.service';

@Catch()
export class ErrorLoggerFilter implements ExceptionFilter {
    private readonly logger = new Logger(ErrorLoggerFilter.name);

    constructor(private errorLogService: ErrorLogService) {}

    async catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        // Extract message and validation errors specially for BadRequestException (which class-validator uses)
        let message = exception.message;

        // const exceptionResponse = exception.getResponse() as any;
        const exceptionResponse =
            exception instanceof HttpException ? exception.getResponse() : null;

        // const error = exceptionResponse.error || null;
        const error =
            exceptionResponse && typeof exceptionResponse === 'object'
                ? exceptionResponse['error'] || null
                : null;

        if (exception instanceof BadRequestException && exceptionResponse) {
            // Handle class-validator error format
            if (
                exceptionResponse['message'] &&
                Array.isArray(exceptionResponse['message'])
            ) {
                message = exceptionResponse['message'];
                // } else if (typeof exceptionResponse === 'object') {
                //     // message = exceptionResponse.message || 'Bad request';
                //     message = exceptionResponse['errors'] || null;
            } else {
                message = exceptionResponse['message'];
            }
        }

        // Extract user information according to your AuthGuard implementation
        const user = request['user'] || {};
        const userId = user.id || null;

        // Extract relevant request data (be careful not to log sensitive information)
        const requestData = {
            body: this.sanitizeRequestBody(request.body),
            query: request.query,
            params: request.params,
        };

        // Create sanitized headers object (remove authorization tokens etc.)
        const headers = { ...request.headers };
        if (headers.authorization) {
            headers.authorization = '[REDACTED]';
        }

        try {
            // Log the error to the database
            const errorLog = await this.errorLogService.logError({
                message: Array.isArray(message) ? message.join(', ') : message,
                stack: exception.stack,
                path: request.url,
                method: request.method,
                statusCode: status,
                ...(userId != null && { user: { connect: { id: userId } } }),
                requestData,
                headers,
            });

            // Log to console as well
            this.logger.error(
                `[${errorLog.id}] ${message}`,
                exception.stack,
                `${request.method} ${request.url}`,
            );

            // Return the error response with the error ID
            response.status(status).json({
                statusCode: status,
                errorId: errorLog.id,
                error,
                message,
                // message: validationErrors
                //     ? validationErrors
                //     : `An error occurred. Reference ID: ${errorLog.id}`
                // ...(validationErrors && { errors: validationErrors }),
            });
        } catch (logError) {
            // Handle situation where logging to DB fails
            this.logger.error(
                'Failed to log error to database',
                logError.stack,
            );

            response.status(status).json({
                statusCode: status,
                message: 'An error occurred and could not be logged properly',
            });
        }
    }

    private sanitizeRequestBody(body: any): any {
        if (!body) return body;

        // Create a deep copy to avoid modifying the original
        const sanitized = JSON.parse(JSON.stringify(body));

        // Sanitize sensitive fields
        const sensitiveFields = [
            'password',
            'secret',
            'token',
            'apiKey',
            'creditCard',
        ];

        const sanitizeObject = (obj: any) => {
            if (!obj || typeof obj !== 'object') return;

            Object.keys(obj).forEach((key) => {
                if (
                    sensitiveFields.some((field) =>
                        key.toLowerCase().includes(field.toLowerCase()),
                    )
                ) {
                    obj[key] = '[REDACTED]';
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    sanitizeObject(obj[key]);
                }
            });
        };

        sanitizeObject(sanitized);
        return sanitized;
    }
}
