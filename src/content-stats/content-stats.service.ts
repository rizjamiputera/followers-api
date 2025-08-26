import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class ContentStatsService {
    constructor(private prisma: PrismaService) {}

    findOne(id: string) {
        return this.prisma.contentStats.findUnique({
            where: { id },
        });
    }
}
