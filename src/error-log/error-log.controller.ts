import { Controller, Get, Param, Query, ValidationPipe } from '@nestjs/common';
import { ErrorLogService } from './error-log.service';
import { Roles } from 'src/auth/guards/roles/roles.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Paginate } from 'src/app/interface/app.interface';
import { PaginationIncludeQueryDto } from 'src/app/dto/pagination-query.dto';
import { GetAllErrorLogsDoc, GetErorLogsDoc } from './error-log.doc';
import { IncludesQueryDto } from 'src/app/dto/include-query.dto';
import { ErrorLog, Role } from '@prisma/client';

// @Controller('error-logs')
@ApiBearerAuth()
@ApiTags('Error Logs')
@Controller({
    path: 'error-logs',
    version: '1',
})
export class ErrorLogController {
    constructor(private errorLogService: ErrorLogService) {}

    @GetAllErrorLogsDoc()
    @Get()
    @Roles(Role.SUPERADMIN)
    findAll(
        @Query(new ValidationPipe({ transform: true }))
        pagination: PaginationIncludeQueryDto,
    ): Promise<Paginate<ErrorLog[]>> {
        try {
            return this.errorLogService.findAll(pagination);
        } catch (error) {
            throw error;
        }
    }

    @GetErorLogsDoc()
    @Get(':id')
    @Roles(Role.SUPERADMIN)
    async getErrorById(
        @Param('id') id: number,
        @Query(new ValidationPipe({ transform: true })) query: IncludesQueryDto,
    ) {
        try {
            return this.errorLogService.getErrorById(+id, query.includes);
        } catch (error) {
            throw error;
        }
    }
}
