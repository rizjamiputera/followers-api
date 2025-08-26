import { Controller, Get, Param } from '@nestjs/common';
import { ContentStatsService } from './content-stats.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('Content Stats')
@Controller({
    path: 'content-stats',
    version: '1',
})
export class ContentStatsController {
    constructor(private readonly contentStatsService: ContentStatsService) {}

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.contentStatsService.findOne(id);
    }
}
