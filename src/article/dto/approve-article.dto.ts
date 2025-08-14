import { PartialType } from '@nestjs/swagger';
import { PublishArticleDto } from './publish-article.dto';

export class ApproveArticleDto extends PartialType(PublishArticleDto) {
}
