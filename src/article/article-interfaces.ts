import { Article, ContentReaction } from "@prisma/client";

export type ArticleWithAuthReaction = Article & {
    auth_reaction?: ContentReaction | null
    authBookmark?: boolean
};
