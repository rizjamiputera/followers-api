import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ValidationPipe } from '@nestjs/common';
import { CreatorService } from './creator.service';
import { PaginationIncludeQueryDto } from 'src/app/dto/pagination-query.dto';
import { IncludesQueryDto } from 'src/app/dto/include-query.dto';
import { Public } from 'src/auth/auth.metadata';

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
    @Get()
    findAll(
        @Query(new ValidationPipe({ transform: true }))
        pagination: PaginationIncludeQueryDto,
    ) {
        return this.creatorService.findAll(pagination);
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

    // @Delete(':id')
    // remove(@Param('id') id: string) {
    //     return this.creatorService.remove(+id);
    // }
}
