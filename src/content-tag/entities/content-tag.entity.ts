import { ContentTag as PrismaContentTag } from '@prisma/client';

export class ContentTag implements PrismaContentTag {
    id: string;
    articleId: string | null;
    eventId: string | null;
    tagId: string;
}
