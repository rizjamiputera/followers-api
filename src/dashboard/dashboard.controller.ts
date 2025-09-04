import { Controller, Get, Query, Request } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { Role } from '@prisma/client';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from 'src/auth/guards/roles/roles.decorator';

@ApiBearerAuth()
@ApiTags('Dashboard')
@Controller({ path: 'dashboard', version: '1' })
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get('overview')
    @Roles(Role.ADMIN, Role.SUPERADMIN, Role.OPERATOR)
    async getWebsiteOverview() {
        return {
            success: true,
            data: await this.dashboardService.getWebsiteOverview()
        };
    }

    @Get('top-content')
    @Roles(Role.ADMIN, Role.SUPERADMIN, Role.OPERATOR)
    async getTopPerformingContent(@Query('limit') limit?: string) {
        const parsedLimit = limit ? parseInt(limit, 10) : 10;
        return {
            success: true,
            data: await this.dashboardService.getTopPerformingContent(parsedLimit)
        };
    }

    @Get('creator-stats')
    async getCreatorStatistics(@Request() req) {
        return {
            success: true,
            data: await this.dashboardService.getCreatorStatistics(req.user.id)
        };
    }

    @Get('activity-timeline')
    @Roles(Role.ADMIN, Role.SUPERADMIN, Role.OPERATOR)
    async getActivityTimeline(@Query('limit') limit?: string) {
        const parsedLimit = limit ? parseInt(limit, 10) : 20;
        return {
            success: true,
            data: await this.dashboardService.getActivityTimeline(parsedLimit)
        };
    }

    @Get('growth')
    @Roles(Role.ADMIN, Role.SUPERADMIN, Role.OPERATOR)
    async getPlatformGrowth() {
        return {
            success: true,
            data: await this.dashboardService.getPlatformGrowth()
        };
    }

    @Get('admin-overview')
    @Roles(Role.ADMIN, Role.SUPERADMIN)
    async getAdminDashboard() {
        const [overview, topContent, activityTimeline, growth] = await Promise.all([
            this.dashboardService.getWebsiteOverview(),
            this.dashboardService.getTopPerformingContent(5),
            this.dashboardService.getActivityTimeline(10),
            this.dashboardService.getPlatformGrowth()
        ]);

        return {
            success: true,
            data: {
                overview,
                topContent,
                recentActivity: activityTimeline,
                growth
            }
        };
    }

    @Get('creator-dashboard')
    async getCreatorDashboard(@Request() req) {
        const creatorStats = await this.dashboardService.getCreatorStatistics(req.user.id);

        return {
            success: true,
            data: {
                user: {
                    name: req.user.name,
                    role: req.user.role,
                    email: req.user.email
                },
                statistics: creatorStats
            }
        };
    }
}
