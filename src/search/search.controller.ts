import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/auth.metadata';
import { SearchService } from './search.service';

@ApiTags('search')
@Controller({ path: 'search', version: '1' })
export class SearchController {
    constructor(private readonly searchService: SearchService) { }

    @Get()
    @Public()
    @ApiOperation({ summary: 'Unified search across published articles and events' })
    @ApiResponse({ status: 200, description: 'Returns { articles, events }' })
    search(@Query('q') q: string, @Query('limit') limit?: string) {
        return this.searchService.search(q, limit ? parseInt(limit, 10) : 10);
    }
}
