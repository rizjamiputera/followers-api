import {
    Controller,
    Post,
    Delete,
    Get,
    Param,
    Query,
    ValidationPipe,
    Request,
} from '@nestjs/common';
import { FollowService } from './follow.service';
import { PaginationQueryDto } from 'src/app/dto/pagination-query.dto';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@Controller({
    path: 'follow',
    version: '1',
})
export class FollowController {
    constructor(private readonly followService: FollowService) { }

    @Post(':userId')
    async follow(
        @Request() req: any,
        @Param('userId') followingId: string,
    ) {
        return this.followService.follow(req.user.id, followingId);
    }

    @Delete(':userId')
    async unfollow(
        @Request() req: any,
        @Param('userId') followingId: string,
    ) {
        return this.followService.unfollow(req.user.id, followingId);
    }

    @Get('status/:userId')
    async checkFollowStatus(
        @Request() req: any,
        @Param('userId') followingId: string,
    ) {
        return this.followService.checkFollowStatus(req.user.id, followingId);
    }

    @Get('followers/:userId')
    async getFollowers(
        @Request() req: any,
        @Param('userId') userId: string,
        @Query(new ValidationPipe({ transform: true })) query: PaginationQueryDto,
    ) {
        return this.followService.getFollowers(userId, query.page, query.limit);
    }

    @Get('following/:userId')
    async getFollowing(
        @Request() req: any,
        @Param('userId') userId: string,
        @Query(new ValidationPipe({ transform: true })) query: PaginationQueryDto,
    ) {
        return this.followService.getFollowing(userId, query.page, query.limit);
    }
}
