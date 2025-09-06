import { ApiProperty } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsOptional,
    IsString,
    IsObject,
} from 'class-validator';

export class RegisterForEventDto {
    @ApiProperty({ 
        description: 'Form data responses based on event registration config',
        example: {
            phone: '+628123456789',
            dietary_requirements: 'Vegetarian',
            company: 'Tech Corp'
        }
    })
    @IsObject()
    @IsNotEmpty()
    formData: Record<string, any>;
}

export class UpdateRegistrationDto {
    @ApiProperty({ 
        description: 'Updated form data responses',
        required: false
    })
    @IsObject()
    @IsOptional()
    formData?: Record<string, any>;
}

export class ConfirmRegistrationDto {
    @ApiProperty({ 
        description: 'Confirmation note (optional)',
        required: false
    })
    @IsString()
    @IsOptional()
    note?: string;
}

export class CancelRegistrationDto {
    @ApiProperty({ 
        description: 'Cancellation reason',
        required: false
    })
    @IsString()
    @IsOptional()
    cancellationNote?: string;
}

export class RegistrationFilterDto {
    @ApiProperty({ 
        description: 'Filter by registration status',
        enum: ['PENDING', 'CONFIRMED', 'CANCELLED'],
        required: false
    })
    @IsString()
    @IsOptional()
    status?: string;

    @ApiProperty({ 
        description: 'Search by user name or email',
        required: false
    })
    @IsString()
    @IsOptional()
    search?: string;
}