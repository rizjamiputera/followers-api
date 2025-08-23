import { PartialType } from '@nestjs/swagger';
import { PublishEventDto } from './publish-event.dto';

export class ApproveEventDto extends PartialType(PublishEventDto) { }
