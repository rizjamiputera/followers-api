import { Injectable } from '@nestjs/common';
import { CreateContentStatDto } from './dto/create-content-stat.dto';
import { UpdateContentStatDto } from './dto/update-content-stat.dto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class ContentStatsService {
    constructor(
        private prisma: PrismaService,
    ) { }

    findOne(id: string) {
        return this.prisma.contentStats.findUnique({
            where: { id }
        })
    }
}
