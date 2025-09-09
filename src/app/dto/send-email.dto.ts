import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendEmailDto {
    @ApiProperty({ 
        description: 'Recipient email address',
        example: 'user@example.com'
    })
    @IsEmail({}, { message: 'Please provide a valid email address' })
    @IsNotEmpty({ message: 'Email is required' })
    to: string;

    @ApiProperty({ 
        description: 'Email subject',
        example: 'Hello from Followers Bicara!',
        default: 'Hello!'
    })
    @IsString({ message: 'Subject must be a string' })
    @IsOptional()
    subject?: string;

    @ApiProperty({ 
        description: 'HTML content for the email',
        example: '<h1>Hello World!</h1><p>This is a test email from our API.</p>',
        required: false
    })
    @IsString({ message: 'HTML content must be a string' })
    @IsOptional()
    html?: string;

    @ApiProperty({ 
        description: 'Plain text content for the email',
        example: 'Hello World! This is a test email from our API.',
        required: false
    })
    @IsString({ message: 'Text content must be a string' })
    @IsOptional()
    text?: string;
}