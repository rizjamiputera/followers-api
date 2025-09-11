import { PartialType } from '@nestjs/swagger';
import { CreateContentTagDto } from './create-content-tag.dto';

export class UpdateContentTagDto extends PartialType(CreateContentTagDto) {}
