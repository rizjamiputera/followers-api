import { PartialType } from '@nestjs/swagger';
import { CreateContentStatDto } from './create-content-stat.dto';

export class UpdateContentStatDto extends PartialType(CreateContentStatDto) {}
