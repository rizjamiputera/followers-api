// src/error-log/error-log.service.ts
import { Injectable } from '@nestjs/common';
import { ErrorLog, Prisma } from '@prisma/client';
import { AppService } from 'src/app.service';
import { nestedOrderBy } from 'src/app/decorator/nestedOrderBy';
import { PaginationIncludeQueryDto } from 'src/app/dto/pagination-query.dto';
import { Paginate } from 'src/app/interface/app.interface';
import { PrismaService } from 'src/prisma.service';

// Define reusable includes
const VALID_INCLUDES = ['user'];

@Injectable()
export class ErrorLogService {
    constructor(
        private prisma: PrismaService,
        private app: AppService,
    ) {}

    async logError(errorData: {
        message: string;
        stack?: string;
        path?: string;
        method?: string;
        statusCode?: number;
        userId?: string;
        requestData?: any;
        headers?: any;
    }) {
        return this.prisma.errorLog.create({
            data: errorData,
        });
    }

    async findAll(
        pagination: PaginationIncludeQueryDto,
    ): Promise<Paginate<ErrorLog[]>> {
        const { page, limit, sortBy, order, includes, search } = pagination;
        const include = this.app.getValidIncludes(VALID_INCLUDES, includes);

        /**
         * Case-insensitive search
         * Search condition for:
         * - name
         * - phone
         * - address
         * - identity_no
         * - licence_no
         */
        const searchCondition: Prisma.ErrorLogWhereInput = search
            ? {
                  OR: [
                      ...(!isNaN(Number(search))
                          ? [{ id: Number(search) }]
                          : []),
                      { message: { contains: search, mode: 'insensitive' } },
                      { stack: { contains: search, mode: 'insensitive' } },
                      { path: { contains: search, mode: 'insensitive' } },
                      { method: { contains: search, mode: 'insensitive' } },
                  ],
              }
            : {};

        const where: Prisma.ErrorLogWhereInput = {
            AND: [searchCondition],
        };

        const skip = (page - 1) * limit;
        const take = limit > 0 ? limit : undefined;

        const [total, data] = await Promise.all([
            this.prisma.errorLog.count({ where }),
            this.prisma.errorLog.findMany({
                where,
                orderBy: nestedOrderBy(sortBy, order),
                skip,
                take,
                include,
            }),
        ]);
        return {
            data,
            limit,
            total,
            page,
            last_page:
                limit > 0 ? (limit > 0 ? Math.ceil(total / limit) : 1) : 1,
        };
    }

    async getErrorById(id: number, includes: string[] = []) {
        const include = this.app.getValidIncludes(VALID_INCLUDES, includes);

        return this.prisma.errorLog.findUniqueOrThrow({
            where: { id },
            include,
        });
    }
}
