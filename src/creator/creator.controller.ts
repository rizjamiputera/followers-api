import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ValidationPipe, HttpCode } from '@nestjs/common';
import { CreatorService } from './creator.service';
import { PaginationIncludeQueryDto } from 'src/app/dto/pagination-query.dto';
import { IncludesQueryDto } from 'src/app/dto/include-query.dto';
import { Public } from 'src/auth/auth.metadata';
import { ApiBearerAuth } from '@nestjs/swagger';
import { FilterCreatorDto } from './dto/filter-creator.dto';

@Controller({
    path: 'creator',
    version: '1',
})
export class CreatorController {
    constructor(private readonly creatorService: CreatorService) { }

    // @Post()
    // create(@Body() createCreatorDto: CreateCreatorDto) {
    //     return this.creatorService.create(createCreatorDto);
    // }

    @Public()
    @Get('public')
    findAllPublic(
        @Query(new ValidationPipe({ transform: true }))
        pagination: PaginationIncludeQueryDto,
    ) {
        return this.creatorService.findAll(pagination, { isPublic: true });
    }

    @ApiBearerAuth()
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

    @Public()
    @Get(':slug')
    findOne(
        @Param('slug') slug: string,
        @Query(new ValidationPipe({ transform: true })) query: IncludesQueryDto,
    ) {
        return this.creatorService.findOne(slug, query.includes);
    }

    // @Patch(':id')
    // update(@Param('id') id: string, @Body() updateCreatorDto: UpdateCreatorDto) {
    //     return this.creatorService.update(+id, updateCreatorDto);
    // }

    @ApiBearerAuth()
    @Patch(':id/toggle-public')
    @HttpCode(200)
    togglePublic(@Param('id') id: string) {
        return this.creatorService.togglePublic(id);
    }

    // @Delete(':id')
    // remove(@Param('id') id: string) {
    //     return this.creatorService.remove(+id);
    // }
}
