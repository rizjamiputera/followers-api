import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateContentTagDto } from './dto/create-content-tag.dto';

@Injectable()
export class ContentTagService {
  constructor(private prisma: PrismaService) {}

  async create(createContentTagDto: CreateContentTagDto) {
    const { articleId, eventId, tagId } = createContentTagDto;

    if (!articleId && !eventId) {
      throw new BadRequestException('Either articleId or eventId must be provided');
    }

    if (articleId && eventId) {
      throw new BadRequestException('Cannot provide both articleId and eventId');
    }

    const tag = await this.prisma.tag.findUnique({
      where: { id: tagId },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    if (articleId) {
      const article = await this.prisma.article.findUnique({
        where: { id: articleId },
      });

      if (!article) {
        throw new NotFoundException('Article not found');
      }

      const existingTag = await this.prisma.contentTag.findFirst({
        where: { articleId, tagId },
      });

      if (existingTag) {
        throw new BadRequestException('Tag already exists for this article');
      }
    }

    if (eventId) {
      const event = await this.prisma.event.findUnique({
        where: { id: eventId },
      });

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      const existingTag = await this.prisma.contentTag.findFirst({
        where: { eventId, tagId },
      });

      if (existingTag) {
        throw new BadRequestException('Tag already exists for this event');
      }
    }

    return this.prisma.contentTag.create({
      data: createContentTagDto,
      include: {
        tag: true,
      },
    });
  }

  async findByArticle(articleId: string) {
    return this.prisma.contentTag.findMany({
      where: { articleId },
      include: {
        tag: true,
      },
    });
  }

  async findByEvent(eventId: string) {
    return this.prisma.contentTag.findMany({
      where: { eventId },
      include: {
        tag: true,
      },
    });
  }

  async remove(id: string) {
    const contentTag = await this.prisma.contentTag.findUnique({
      where: { id },
    });

    if (!contentTag) {
      throw new NotFoundException('Content tag not found');
    }

    return this.prisma.contentTag.delete({
      where: { id },
    });
  }

  async removeByArticleAndTag(articleId: string, tagId: string) {
    const contentTag = await this.prisma.contentTag.findFirst({
      where: { articleId, tagId },
    });

    if (!contentTag) {
      throw new NotFoundException('Content tag not found');
    }

    return this.prisma.contentTag.delete({
      where: { id: contentTag.id },
    });
  }

  async removeByEventAndTag(eventId: string, tagId: string) {
    const contentTag = await this.prisma.contentTag.findFirst({
      where: { eventId, tagId },
    });

    if (!contentTag) {
      throw new NotFoundException('Content tag not found');
    }

    return this.prisma.contentTag.delete({
      where: { id: contentTag.id },
    });
  }

  async updateArticleTags(articleId: string, tagIds: string[]) {
    return this.prisma.$transaction(async (tx) => {
      await tx.contentTag.deleteMany({
        where: { articleId },
      });

      if (tagIds.length > 0) {
        const contentTags = tagIds.map((tagId) => ({
          articleId,
          tagId,
        }));

        await tx.contentTag.createMany({
          data: contentTags,
        });
      }

      return tx.contentTag.findMany({
        where: { articleId },
        include: { tag: true },
      });
    });
  }

  async updateEventTags(eventId: string, tagIds: string[]) {
    return this.prisma.$transaction(async (tx) => {
      await tx.contentTag.deleteMany({
        where: { eventId },
      });

      if (tagIds.length > 0) {
        const contentTags = tagIds.map((tagId) => ({
          eventId,
          tagId,
        }));

        await tx.contentTag.createMany({
          data: contentTags,
        });
      }

      return tx.contentTag.findMany({
        where: { eventId },
        include: { tag: true },
      });
    });
  }
}