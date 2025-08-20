import { PartialType } from '@nestjs/swagger';
import { CreatePhotoContentDto } from './create-photo-content.dto';

export class UpdatePhotoContentDto extends PartialType(CreatePhotoContentDto) {}
