import { Controller, Get, Body, Patch, Param, Query, ValidationPipe, HttpCode, Request } from '@nestjs/common';
import { CreatorService } from './creator.service';
import { PaginationIncludeQueryDto } from 'src/app/dto/pagination-query.dto';
import { IncludesQueryDto } from 'src/app/dto/include-query.dto';
import { Public } from 'src/auth/auth.metadata';
import { ApiBearerAuth } from '@nestjs/swagger';
import { FilterCreatorDto } from './dto/filter-creator.dto';
import { PermissionsRequired } from 'src/auth/guards/permissions/permission.decorator';
import { Module, Permission } from '@prisma/client';

@Controller({
    path: 'creator',
    version: '1',
})
export class CreatorController {
    constructor(private readonly creatorService: CreatorService) { }

    @Public()
    @Get('public')
    findAllPublic(
        @Query(new ValidationPipe({ transform: true }))
        pagination: PaginationIncludeQueryDto,
    ) {
        return this.creatorService.findAll(pagination, { isPublic: true });
    }

    @ApiBearerAuth()
    @PermissionsRequired(Module.USER, Permission.READ)
    @Get()
    findAll(
        @Query(new ValidationPipe({ transform: true }))
        pagination: PaginationIncludeQueryDto,
        @Query(new ValidationPipe({ transform: true }))
        filter: FilterCreatorDto,
    ) {
        return this.creatorService.findAll(pagination, filter);
    }

    @ApiBearerAuth()
    @Get('stats')
    getStats() {
        return this.creatorService.getStats();
    }

    @ApiBearerAuth()
    @Get('my/profile')
    getMyProfile(
        @Request() req: any,
        @Query(new ValidationPipe({ transform: true })) query: IncludesQueryDto,
    ) {
        console.log('masuk my profile')
        return this.creatorService.findOneByUserId(req.user.id, query.includes);
    }

    @ApiBearerAuth()
    @Patch('my/profile')
    updateMyProfile(@Request() req: any, @Body() updateCreatorDto: any) {
        return this.creatorService.update(req.user.id, updateCreatorDto);
    }

    @ApiBearerAuth()
    @Get(':userId')
    findOne(
        @Param('userId') userId: string,
        @Query(new ValidationPipe({ transform: true })) query: IncludesQueryDto,
    ) {
        console.log('by user id')
        return this.creatorService.findOneByUserId(userId, query.includes);
    }

    @Public()
    @Get('public/:slug')
    findOnePublic(
        @Param('slug') slug: string,
        @Query(new ValidationPipe({ transform: true })) query: IncludesQueryDto,
    ) {
        return this.creatorService.findOne(slug, query.includes);
    }

    @ApiBearerAuth()
    @PermissionsRequired(Module.USER, Permission.EDIT)
    @Patch(':userId')
    update(@Param('userId') userId: string, @Body() updateCreatorDto: any) {
        return this.creatorService.update(userId, updateCreatorDto);
    }

    @ApiBearerAuth()
    @PermissionsRequired(Module.USER, Permission.EDIT)
    @Patch(':id/toggle-public')
    @HttpCode(200)
    togglePublic(@Param('id') id: string) {
        return this.creatorService.togglePublic(id);
    }
}
