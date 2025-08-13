import { Injectable } from '@nestjs/common';
import { Article, ArticleContent, Prisma } from '@prisma/client';
import { AppService } from 'src/app.service';
import { PrismaService } from 'src/prisma.service';

const VALID_INCLUDES = ['content', 'tags', 'comments', 'comments.replies', 'comments.reactions', 'reactions', 'versions'];

@Injectable()
export class ArticleService {
    constructor(
        private prisma: PrismaService,
        private app: AppService,
    ) { }

    create(data: Prisma.ArticleCreateInput) {
        return 'This action adds a new article';
    }

    findAll() {
        return `This action returns all article`;
    }

    async findOne(id: string, includes: string[] = [],): Promise<Article> {
        const include = this.app.getValidIncludes(VALID_INCLUDES, includes);

        return this.prisma.article.findUniqueOrThrow({
            where: {
                id,
                deleted: false
            },
            include
        });
    }

    async update(id: string, data: Prisma.ArticleUpdateInput): Promise<Article> {
        const current = await this.findOne(id, ['content']) as Article & { content: ArticleContent };

        const update = await this.prisma.article.update({
            where: { id },
            data: {
                ...data,
                ...(data.content && {
                    versions: {
                        create: current.content
                    }
                })
            }
        });

        if (data.content) {

        }

        return update;
    }

    async remove(id: string): Promise<void> {
        await this.findOne(id);

        await this.prisma.article.update({
            where: { id },
            data: { deleted: true }
        });

        return;
    }
}
