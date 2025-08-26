import { ContentReaction, Event } from '@prisma/client';

export type EventWithAuthReaction = Event & {
    auth_reaction?: ContentReaction | null;
};
