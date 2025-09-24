import { ApiProperty } from '@nestjs/swagger';

export class VisitMetricDto {
    @ApiProperty()
    total: number;

    @ApiProperty()
    today: number;

    @ApiProperty()
    yesterday: number;

    @ApiProperty()
    thisWeek: number;

    @ApiProperty()
    lastWeek: number;

    @ApiProperty()
    thisMonth: number;

    @ApiProperty()
    lastMonth: number;

    @ApiProperty()
    growthRate: number;
}

export class VisitAnalyticsDto {
    @ApiProperty({ type: VisitMetricDto })
    visits: VisitMetricDto;

    @ApiProperty({ type: VisitMetricDto })
    uniqueVisitors: VisitMetricDto;

    @ApiProperty()
    averageSessionDuration: number;

    @ApiProperty()
    bounceRate: number;

    @ApiProperty()
    avgVisitsPerVisitor: number;
}

export class VisitorDemographicsDto {
    @ApiProperty()
    totalVisitors: number;

    @ApiProperty()
    newVisitors: number;

    @ApiProperty()
    returningVisitors: number;

    @ApiProperty()
    registeredUsers: number;

    @ApiProperty()
    anonymousUsers: number;
}

export class VisitorAnalyticsDto {
    @ApiProperty({ type: VisitorDemographicsDto })
    demographics: VisitorDemographicsDto;

    @ApiProperty()
    dailyActiveVisitors: { date: string; count: number }[];

    @ApiProperty()
    visitorRetention: {
        day1: number;
        day7: number;
        day30: number;
    };
}

export class TopPageDto {
    @ApiProperty()
    path: string;

    @ApiProperty()
    visits: number;

    @ApiProperty()
    uniqueVisitors: number;

    @ApiProperty()
    title?: string;

    @ApiProperty()
    contentType?: string;

    @ApiProperty()
    avgTimeOnPage?: number;
}

export class TopPagesDto {
    @ApiProperty({ type: [TopPageDto] })
    pages: TopPageDto[];

    @ApiProperty()
    totalPages: number;
}

export class TimelineDataPointDto {
    @ApiProperty()
    timestamp: string;

    @ApiProperty()
    visits: number;

    @ApiProperty()
    uniqueVisitors: number;

    @ApiProperty()
    pageViews: number;
}

export class VisitTimelineDto {
    @ApiProperty({ type: [TimelineDataPointDto] })
    timeline: TimelineDataPointDto[];

    @ApiProperty()
    interval: string;

    @ApiProperty()
    totalDataPoints: number;
}

export class ReferrerDto {
    @ApiProperty()
    referrer: string;

    @ApiProperty()
    visits: number;

    @ApiProperty()
    uniqueVisitors: number;

    @ApiProperty()
    percentage: number;
}

export class TopReferrersDto {
    @ApiProperty({ type: [ReferrerDto] })
    referrers: ReferrerDto[];

    @ApiProperty()
    directTraffic: number;

    @ApiProperty()
    totalReferrers: number;
}

export class BrowserDto {
    @ApiProperty()
    name: string;

    @ApiProperty()
    visits: number;

    @ApiProperty()
    percentage: number;
}

export class DeviceDto {
    @ApiProperty()
    type: string;

    @ApiProperty()
    visits: number;

    @ApiProperty()
    percentage: number;
}

export class OSDto {
    @ApiProperty()
    name: string;

    @ApiProperty()
    visits: number;

    @ApiProperty()
    percentage: number;
}

export class UserAgentAnalyticsDto {
    @ApiProperty({ type: [BrowserDto] })
    browsers: BrowserDto[];

    @ApiProperty({ type: [DeviceDto] })
    devices: DeviceDto[];

    @ApiProperty({ type: [OSDto] })
    operatingSystems: OSDto[];

    @ApiProperty()
    totalAnalyzed: number;
}