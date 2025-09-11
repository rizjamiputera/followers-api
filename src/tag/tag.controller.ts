import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TagService } from './tag.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { Public } from '../auth/auth.metadata';

@ApiTags('tags')
@Controller({ path: 'tags', version: '1' })
export class TagController {
    constructor(private readonly tagService: TagService) {}

    @Post()
    @ApiOperation({ summary: 'Create a new tag' })
    @ApiResponse({ status: 201, description: 'Tag created successfully' })
    @ApiResponse({ status: 409, description: 'Tag already exists' })
    create(@Body() createTagDto: CreateTagDto) {
        return this.tagService.create(createTagDto);
    }

    @Get()
    @Public()
    @ApiOperation({ summary: 'Get all tags' })
    @ApiResponse({ status: 200, description: 'List of all tags' })
    findAll() {
        return this.tagService.findAll();
    }

    @Get('search')
    @Public()
    @ApiOperation({ summary: 'Search tags' })
    @ApiResponse({ status: 200, description: 'List of matching tags' })
    search(@Query('q') query: string) {
        return this.tagService.search(query || '');
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get tag by ID' })
    @ApiResponse({ status: 200, description: 'Tag found' })
    @ApiResponse({ status: 404, description: 'Tag not found' })
    findOne(@Param('id') id: string) {
        return this.tagService.findOne(id);
    }

    @Get('slug/:slug')
    @Public()
    @ApiOperation({ summary: 'Get tag by slug' })
    @ApiResponse({ status: 200, description: 'Tag found' })
    @ApiResponse({ status: 404, description: 'Tag not found' })
    findBySlug(@Param('slug') slug: string) {
        return this.tagService.findBySlug(slug);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update tag' })
    @ApiResponse({ status: 200, description: 'Tag updated successfully' })
    @ApiResponse({ status: 404, description: 'Tag not found' })
    @ApiResponse({ status: 409, description: 'Tag name already exists' })
    update(@Param('id') id: string, @Body() updateTagDto: UpdateTagDto) {
        return this.tagService.update(id, updateTagDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete tag' })
    @ApiResponse({ status: 200, description: 'Tag deleted successfully' })
    @ApiResponse({ status: 404, description: 'Tag not found' })
    remove(@Param('id') id: string) {
        return this.tagService.remove(id);
    }
}
