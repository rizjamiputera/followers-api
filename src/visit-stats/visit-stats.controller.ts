import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from 'src/auth/guards/roles/role.guards';
import { Roles } from 'src/auth/guards/roles/roles.decorator';
import { Role } from '@prisma/client';
import { VisitStatsService } from './visit-stats.service';
import { VisitAnalyticsDto, VisitorAnalyticsDto, TopPagesDto, VisitTimelineDto } from './dto/visit-stats.dto';

@ApiTags('visit-stats')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller({ path: 'visit-stats', version: '1' })
export class VisitStatsController {
    constructor(private readonly visitStatsService: VisitStatsService) {}

    @Get('analytics')
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @ApiOperation({ summary: 'Get comprehensive visit analytics for control panel' })
    @ApiResponse({ status: 200, description: 'Visit analytics data', type: VisitAnalyticsDto })
    @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days to analyze (default: 30)' })
    async getVisitAnalytics(@Query('days') days?: string) {
        const daysNumber = days ? parseInt(days, 10) : 30;
        return this.visitStatsService.getVisitAnalytics(daysNumber);
    }

    @Get('visitors')
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @ApiOperation({ summary: 'Get visitor analytics and demographics' })
    @ApiResponse({ status: 200, description: 'Visitor analytics data', type: VisitorAnalyticsDto })
    @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days to analyze (default: 30)' })
    async getVisitorAnalytics(@Query('days') days?: string) {
        const daysNumber = days ? parseInt(days, 10) : 30;
        return this.visitStatsService.getVisitorAnalytics(daysNumber);
    }

    @Get('top-pages')
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @ApiOperation({ summary: 'Get top visited pages and content' })
    @ApiResponse({ status: 200, description: 'Top pages data', type: TopPagesDto })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of top pages to return (default: 20)' })
    @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days to analyze (default: 30)' })
    async getTopPages(@Query('limit') limit?: string, @Query('days') days?: string) {
        const limitNumber = limit ? parseInt(limit, 10) : 20;
        const daysNumber = days ? parseInt(days, 10) : 30;
        return this.visitStatsService.getTopPages(limitNumber, daysNumber);
    }

    @Get('timeline')
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @ApiOperation({ summary: 'Get visit timeline data for charts' })
    @ApiResponse({ status: 200, description: 'Visit timeline data', type: VisitTimelineDto })
    @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days to analyze (default: 30)' })
    @ApiQuery({ name: 'interval', required: false, enum: ['hour', 'day', 'week'], description: 'Timeline interval (default: day)' })
    async getVisitTimeline(@Query('days') days?: string, @Query('interval') interval?: 'hour' | 'day' | 'week') {
        const daysNumber = days ? parseInt(days, 10) : 30;
        const timeInterval = interval || 'day';
        return this.visitStatsService.getVisitTimeline(daysNumber, timeInterval);
    }

    @Get('referrers')
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @ApiOperation({ summary: 'Get top referrer sources' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of top referrers to return (default: 20)' })
    @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days to analyze (default: 30)' })
    async getTopReferrers(@Query('limit') limit?: string, @Query('days') days?: string) {
        const limitNumber = limit ? parseInt(limit, 10) : 20;
        const daysNumber = days ? parseInt(days, 10) : 30;
        return this.visitStatsService.getTopReferrers(limitNumber, daysNumber);
    }

    @Get('user-agents')
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @ApiOperation({ summary: 'Get user agent analytics (browsers, devices, OS)' })
    @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days to analyze (default: 30)' })
    async getUserAgentAnalytics(@Query('days') days?: string) {
        const daysNumber = days ? parseInt(days, 10) : 30;
        return this.visitStatsService.getUserAgentAnalytics(daysNumber);
    }

    // Visitor Journey Analytics Endpoints

    @Get('journeys')
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @ApiOperation({ summary: 'Get individual visitor journey paths' })
    @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days to analyze (default: 30)' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Maximum number of journeys to return (default: 100)' })
    async getVisitorJourneys(@Query('days') days?: string, @Query('limit') limit?: string) {
        const daysNumber = days ? parseInt(days, 10) : 30;
        const limitNumber = limit ? parseInt(limit, 10) : 100;
        return this.visitStatsService.getVisitorJourneys(daysNumber, limitNumber);
    }

    @Get('path-flow')
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @ApiOperation({ summary: 'Get visitor path flow transitions between pages' })
    @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days to analyze (default: 30)' })
    async getPathFlow(@Query('days') days?: string) {
        const daysNumber = days ? parseInt(days, 10) : 30;
        return this.visitStatsService.getPathFlow(daysNumber);
    }

    @Get('funnels')
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @ApiOperation({ summary: 'Get visitor funnel analysis for common user journeys' })
    @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days to analyze (default: 30)' })
    async getVisitorFunnels(@Query('days') days?: string) {
        const daysNumber = days ? parseInt(days, 10) : 30;
        return this.visitStatsService.getVisitorFunnels(daysNumber);
    }

    @Get('entry-exit')
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    @ApiOperation({ summary: 'Get top entry and exit pages' })
    @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days to analyze (default: 30)' })
    async getEntryExitPages(@Query('days') days?: string) {
        const daysNumber = days ? parseInt(days, 10) : 30;
        return this.visitStatsService.getEntryExitPages(daysNumber);
    }
}