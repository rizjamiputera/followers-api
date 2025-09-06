import { ContentReaction, Event, EventRegistration } from '@prisma/client';

export type EventWithAuthReaction = Event & {
    auth_reaction?: ContentReaction | null;
    userRegistration?: EventRegistration | null;
    registeredCount?: number;
    availableSpots?: number | null;
};

export type EventWithRegistrationCount = Event & {
    registeredCount: number;
};
