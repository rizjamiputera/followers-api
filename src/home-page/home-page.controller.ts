import {
    Controller,
    Get,
    Patch,
    Param,
    Body,
    Query,
    HttpCode,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HomePageService } from './home-page.service';
import { Public } from 'src/auth/auth.metadata';
import { PermissionsRequired } from 'src/auth/guards/permissions/permission.decorator';
import { Module, Permission } from '@prisma/client';

@ApiTags('Home Page')
@Controller({ path: 'home-page', version: '1' })
export class HomePageController {
    constructor(private readonly homePageService: HomePageService) { }

    // PUBLIC ENDPOINTS FOR HOMEPAGE DATA
    @Public()
    @Get('featured-articles')
    @ApiOperation({ summary: 'Get featured articles for homepage' })
    getFeaturedArticles(@Query('limit') limit?: number) {
        return this.homePageService.getFeaturedArticles(limit || 5);
    }

    @Public()
    @Get('featured-events')
    @ApiOperation({ summary: 'Get featured events for homepage' })
    getFeaturedEvents(@Query('limit') limit?: number) {
        return this.homePageService.getFeaturedEvents(limit || 5);
    }

    @Public()
    @Get('data')
    @ApiOperation({ summary: 'Get all homepage data (featured articles and events)' })
    getHomepageData() {
        return this.homePageService.getHomepageData();
    }

    // ADMIN ENDPOINTS FOR MANAGING FEATURED CONTENT
    @PermissionsRequired(Module.ARTICLE, Permission.EDIT)
    @ApiBearerAuth()
    @Patch('featured-articles/:id')
    @HttpCode(200)
    @ApiOperation({ summary: 'Set article as featured/unfeatured' })
    setArticleFeatured(
        @Param('id') id: string,
        @Body() body: { isFeatured: boolean }
    ) {
        return this.homePageService.setArticleFeatured(id, body.isFeatured);
    }

    @PermissionsRequired(Module.EVENT, Permission.EDIT)
    @ApiBearerAuth()
    @Patch('featured-events/:id')
    @HttpCode(200)
    @ApiOperation({ summary: 'Set event as featured/unfeatured' })
    setEventFeatured(
        @Param('id') id: string,
        @Body() body: { isFeatured: boolean }
    ) {
        return this.homePageService.setEventFeatured(id, body.isFeatured);
    }
}
