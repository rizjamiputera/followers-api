import { ForbiddenException, Injectable } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { PrismaService } from 'src/prisma.service';
import { Comment, Prisma } from '@prisma/client';
import { AppService } from 'src/app.service';

const VALID_INCLUDES = ['user', 'replies', 'reactions'];

@Injectable()
export class CommentService {
    constructor(
        private prisma: PrismaService,
        private app: AppService,
    ) { }

    create(data: Prisma.CommentCreateInput): Promise<Comment> {
        return this.prisma.comment.create({ data });
    }

    findAll() {
        return `This action returns all comment`;
    }

    async findOne(id: string, includes: string[] = [],): Promise<Comment> {
        const include = this.app.getValidIncludes(VALID_INCLUDES, includes);

        return this.prisma.comment.findUniqueOrThrow({
            where: {
                id,
                deleted: false
            },
            include
        });
    }

    async update(id: string, updateBy: string, content: string): Promise<Comment> {
        const currentData = await this.findOne(id);

        if (currentData.userId != updateBy) {
            throw new ForbiddenException('Only the author can update this comment');
        }

        return this.prisma.comment.update({
            where: { id },
            data: {
                content,
                isEdited: true
            }
        })

    }

    async remove(id: string): Promise<void> {
        await this.findOne(id);

        await this.prisma.comment.update({
            where: { id },
            data: { deleted: true }
        });

        return;
    }
}
