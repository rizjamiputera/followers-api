import { ApiProperty } from '@nestjs/swagger';
import {
    IsArray,
    IsBoolean,
    IsDateString,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum FormFieldType {
    TEXT = 'TEXT',
    EMAIL = 'EMAIL',
    PHONE = 'PHONE',
    NUMBER = 'NUMBER',
    TEXTAREA = 'TEXTAREA',
    SELECT = 'SELECT',
    CHECKBOX = 'CHECKBOX',
    RADIO = 'RADIO',
    DATE = 'DATE',
}

export class FormFieldDto {
    @ApiProperty({ description: 'Field key/name' })
    @IsString()
    @IsNotEmpty()
    key: string;

    @ApiProperty({ description: 'Field label displayed to user' })
    @IsString()
    @IsNotEmpty()
    label: string;

    @ApiProperty({
        enum: FormFieldType,
        description: 'Type of form field'
    })
    @IsNotEmpty()
    type: FormFieldType;

    @ApiProperty({
        description: 'Whether this field is required',
        default: false
    })
    @IsBoolean()
    @IsOptional()
    required?: boolean = false;

    @ApiProperty({
        description: 'Placeholder text for the field',
        required: false
    })
    @IsString()
    @IsOptional()
    placeholder?: string;

    @ApiProperty({
        description: 'Help text for the field',
        required: false
    })
    @IsString()
    @IsOptional()
    helpText?: string;

    @ApiProperty({
        description: 'Options for SELECT, CHECKBOX, or RADIO fields',
        required: false,
        type: [String]
    })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    options?: string[];

    @ApiProperty({
        description: 'Validation rules (e.g., min/max length, pattern)',
        required: false
    })
    @IsOptional()
    validation?: Record<string, any>;
}

export class CreateRegistrationConfigDto {
    @ApiProperty({ description: 'Enable registration for this event' })
    @IsBoolean()
    isEnabled: boolean;

    @ApiProperty({
        description: 'Custom label for registration form',
        default: 'Registrasi',
        required: false
    })
    @IsString()
    @IsOptional()
    label?: string;

    @ApiProperty({
        description: 'Maximum number of participants (null for unlimited)',
        required: false
    })
    @IsNumber()
    @IsOptional()
    @Transform(({ value }) => value === null ? null : parseInt(value))
    participantLimit?: number | null;

    @ApiProperty({
        description: 'Registration start date (ISO string)',
        required: false
    })
    @IsDateString()
    @IsOptional()
    registrationStart?: string;

    @ApiProperty({
        description: 'Registration end date (ISO string)',
        required: false
    })
    @IsDateString()
    @IsOptional()
    registrationEnd?: string;

    @ApiProperty({
        description: 'Form fields configuration',
        type: [FormFieldDto]
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => FormFieldDto)
    formFields: FormFieldDto[];

    @ApiProperty({
        description: 'Whether registrations require manual approval',
        default: false
    })
    @IsBoolean()
    @IsOptional()
    requireApproval?: boolean = false;

    @ApiProperty({
        description: 'Custom confirmation message after registration',
        required: false
    })
    @IsString()
    @IsOptional()
    confirmationMessage?: string;
}

export class UpdateRegistrationConfigDto {
    @ApiProperty({
        description: 'Enable registration for this event',
        required: false
    })
    @IsBoolean()
    @IsOptional()
    isEnabled?: boolean;

    @ApiProperty({
        description: 'Custom label for registration form',
        required: false
    })
    @IsString()
    @IsOptional()
    label?: string;

    @ApiProperty({
        description: 'Maximum number of participants (null for unlimited)',
        required: false
    })
    @IsNumber()
    @IsOptional()
    @Transform(({ value }) => value === null ? null : parseInt(value))
    participantLimit?: number | null;

    @ApiProperty({
        description: 'Registration start date (ISO string)',
        required: false
    })
    @IsDateString()
    @IsOptional()
    registrationStart?: string;

    @ApiProperty({
        description: 'Registration end date (ISO string)',
        required: false
    })
    @IsDateString()
    @IsOptional()
    registrationEnd?: string;

    @ApiProperty({
        description: 'Form fields configuration',
        type: [FormFieldDto],
        required: false
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => FormFieldDto)
    @IsOptional()
    formFields?: FormFieldDto[];

    @ApiProperty({
        description: 'Whether registrations require manual approval',
        required: false
    })
    @IsBoolean()
    @IsOptional()
    requireApproval?: boolean;

    @ApiProperty({
        description: 'Custom confirmation message after registration',
        required: false
    })
    @IsString()
    @IsOptional()
    confirmationMessage?: string;
}
