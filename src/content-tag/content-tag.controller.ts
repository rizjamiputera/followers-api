import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ContentTagService } from './content-tag.service';
import { CreateContentTagDto } from './dto/create-content-tag.dto';

@ApiTags('content-tags')
@Controller({ path: 'content-tags', version: '1' })
export class ContentTagController {
  constructor(private readonly contentTagService: ContentTagService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new content tag' })
  @ApiResponse({ status: 201, description: 'Content tag created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Article/Event/Tag not found' })
  create(@Body() createContentTagDto: CreateContentTagDto) {
    return this.contentTagService.create(createContentTagDto);
  }

  @Get('article/:articleId')
  @ApiOperation({ summary: 'Get all tags for an article' })
  @ApiResponse({ status: 200, description: 'List of tags for the article' })
  findByArticle(@Param('articleId') articleId: string) {
    return this.contentTagService.findByArticle(articleId);
  }

  @Get('event/:eventId')
  @ApiOperation({ summary: 'Get all tags for an event' })
  @ApiResponse({ status: 200, description: 'List of tags for the event' })
  findByEvent(@Param('eventId') eventId: string) {
    return this.contentTagService.findByEvent(eventId);
  }

  @Put('article/:articleId')
  @ApiOperation({ summary: 'Update all tags for an article' })
  @ApiResponse({ status: 200, description: 'Article tags updated successfully' })
  updateArticleTags(
    @Param('articleId') articleId: string,
    @Body() body: { tagIds: string[] },
  ) {
    return this.contentTagService.updateArticleTags(articleId, body.tagIds);
  }

  @Put('event/:eventId')
  @ApiOperation({ summary: 'Update all tags for an event' })
  @ApiResponse({ status: 200, description: 'Event tags updated successfully' })
  updateEventTags(
    @Param('eventId') eventId: string,
    @Body() body: { tagIds: string[] },
  ) {
    return this.contentTagService.updateEventTags(eventId, body.tagIds);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a content tag' })
  @ApiResponse({ status: 200, description: 'Content tag removed successfully' })
  @ApiResponse({ status: 404, description: 'Content tag not found' })
  remove(@Param('id') id: string) {
    return this.contentTagService.remove(id);
  }

  @Delete('article/:articleId/tag/:tagId')
  @ApiOperation({ summary: 'Remove a specific tag from an article' })
  @ApiResponse({ status: 200, description: 'Tag removed from article successfully' })
  @ApiResponse({ status: 404, description: 'Content tag not found' })
  removeByArticleAndTag(
    @Param('articleId') articleId: string,
    @Param('tagId') tagId: string,
  ) {
    return this.contentTagService.removeByArticleAndTag(articleId, tagId);
  }

  @Delete('event/:eventId/tag/:tagId')
  @ApiOperation({ summary: 'Remove a specific tag from an event' })
  @ApiResponse({ status: 200, description: 'Tag removed from event successfully' })
  @ApiResponse({ status: 404, description: 'Content tag not found' })
  removeByEventAndTag(
    @Param('eventId') eventId: string,
    @Param('tagId') tagId: string,
  ) {
    return this.contentTagService.removeByEventAndTag(eventId, tagId);
  }
}