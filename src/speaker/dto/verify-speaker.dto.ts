import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class VerifySpeakerDto {
    @ApiProperty({ description: 'Verified status' })
    @Transform(({ value }) => value === true || value === 'true')
    @IsBoolean()
    verified: boolean;
}
