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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Module, Permission } from '@prisma/client';
import { TagService } from './tag.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { Public } from '../auth/auth.metadata';
import { PermissionsRequired } from '../auth/guards/permissions/permission.decorator';

@ApiTags('tags')
@Controller({ path: 'tags', version: '1' })
export class TagController {
    constructor(private readonly tagService: TagService) { }

    @Post()
    @ApiBearerAuth()
    @PermissionsRequired(Module.ARTICLE, Permission.CREATE)
    @ApiOperation({ summary: 'Create a new tag (Admin only)' })
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
    @ApiBearerAuth()
    @PermissionsRequired(Module.ARTICLE, Permission.EDIT)
    @ApiOperation({ summary: 'Update tag (Admin only)' })
    @ApiResponse({ status: 200, description: 'Tag updated successfully' })
    @ApiResponse({ status: 404, description: 'Tag not found' })
    @ApiResponse({ status: 409, description: 'Tag name already exists' })
    update(@Param('id') id: string, @Body() updateTagDto: UpdateTagDto) {
        return this.tagService.update(id, updateTagDto);
    }

    @Delete(':id')
    @ApiBearerAuth()
    @PermissionsRequired(Module.ARTICLE, Permission.DELETE)
    @ApiOperation({ summary: 'Delete tag (Admin only)' })
    @ApiResponse({ status: 200, description: 'Tag deleted successfully' })
    @ApiResponse({ status: 404, description: 'Tag not found' })
    remove(@Param('id') id: string) {
        return this.tagService.remove(id);
    }

    @Post(':id/merge-into/:targetId')
    @ApiBearerAuth()
    @PermissionsRequired(Module.ARTICLE, Permission.DELETE)
    @ApiOperation({ summary: 'Merge tag into another — moves all content, deletes source (Admin only)' })
    @ApiResponse({ status: 201, description: 'Merged successfully, returns target tag' })
    @ApiResponse({ status: 404, description: 'Tag not found' })
    @ApiResponse({ status: 409, description: 'Cannot merge tag into itself' })
    merge(@Param('id') id: string, @Param('targetId') targetId: string) {
        return this.tagService.merge(id, targetId);
    }
}
