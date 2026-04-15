import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { Module, Permission } from '@prisma/client';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Public } from '../auth/auth.metadata';
import { PermissionsRequired } from '../auth/guards/permissions/permission.decorator';

@ApiTags('categories')
@Controller({ path: 'categories', version: '1' })
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) {}

    @Post()
    @ApiBearerAuth()
    @PermissionsRequired(Module.ARTICLE, Permission.CREATE)
    @ApiOperation({ summary: 'Create category (Admin only)' })
    @ApiResponse({ status: 201 })
    @ApiResponse({ status: 409, description: 'Category already exists' })
    create(@Body() dto: CreateCategoryDto) {
        return this.categoryService.create(dto);
    }

    @Get()
    @Public()
    @ApiOperation({ summary: 'List all categories with published counts' })
    findAll() {
        return this.categoryService.findAll();
    }

    @Get(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get category by id' })
    findOne(@Param('id') id: string) {
        return this.categoryService.findOne(id);
    }

    @Get('slug/:slug')
    @Public()
    @ApiOperation({ summary: 'Get category by slug' })
    findBySlug(@Param('slug') slug: string) {
        return this.categoryService.findBySlug(slug);
    }

    @Patch(':id')
    @ApiBearerAuth()
    @PermissionsRequired(Module.ARTICLE, Permission.EDIT)
    @ApiOperation({ summary: 'Update category (Admin only)' })
    update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
        return this.categoryService.update(id, dto);
    }

    @Delete(':id')
    @ApiBearerAuth()
    @PermissionsRequired(Module.ARTICLE, Permission.DELETE)
    @ApiOperation({ summary: 'Delete category (Admin only)' })
    remove(@Param('id') id: string) {
        return this.categoryService.remove(id);
    }
}
