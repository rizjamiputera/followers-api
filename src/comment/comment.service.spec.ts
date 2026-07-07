import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { CommentService } from './comment.service';
import { PrismaService } from '../prisma.service';
import { AppService } from '../app.service';

describe('CommentService', () => {
    let service: CommentService;
    let prisma: {
        comment: Record<string, jest.Mock>;
        contentStats: Record<string, jest.Mock>;
        article: Record<string, jest.Mock>;
        event: Record<string, jest.Mock>;
        commentReaction: Record<string, jest.Mock>;
    };
    let app: Record<string, jest.Mock>;

    beforeEach(async () => {
        prisma = {
            comment: {
                create: jest.fn(),
                count: jest.fn(),
                findMany: jest.fn(),
                findUniqueOrThrow: jest.fn(),
                update: jest.fn(),
                updateMany: jest.fn(),
            },
            contentStats: { update: jest.fn() },
            article: { findUnique: jest.fn() },
            event: { findUnique: jest.fn() },
            commentReaction: { upsert: jest.fn() },
        };
        app = {
            getValidIncludes: jest.fn(() => ({})),
            transformImageUrls: jest.fn((d) => d),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CommentService,
                { provide: PrismaService, useValue: prisma },
                { provide: AppService, useValue: app },
            ],
        }).compile();

        service = module.get<CommentService>(CommentService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('persists the comment and syncs the non-deleted count onto stats', async () => {
            prisma.comment.create.mockResolvedValue({ id: 'c1' });
            prisma.comment.count.mockResolvedValue(5);

            const result = await service.create(
                { comment: 'hi' } as any,
                'content-1',
                'stats-1',
                [],
            );

            expect(prisma.comment.count).toHaveBeenCalledWith({
                where: { contentId: 'content-1', deleted: false },
            });
            expect(prisma.contentStats.update).toHaveBeenCalledWith({
                where: { id: 'stats-1' },
                data: { commentCount: 5 },
            });
            expect(result).toEqual({ id: 'c1' });
        });
    });

    describe('findOne', () => {
        it('fetches a non-deleted comment', async () => {
            prisma.comment.findUniqueOrThrow.mockResolvedValue({ id: 'c1' });
            await service.findOne('c1');
            expect(prisma.comment.findUniqueOrThrow).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'c1', deleted: false },
                }),
            );
        });
    });

    describe('update', () => {
        it('throws when the editor is not the author', async () => {
            prisma.comment.findUniqueOrThrow.mockResolvedValue({
                id: 'c1',
                userId: 'owner',
            });
            await expect(
                service.update('c1', 'someone-else', 'edited'),
            ).rejects.toThrow(ForbiddenException);
            expect(prisma.comment.update).not.toHaveBeenCalled();
        });

        it('updates and marks edited when the author edits', async () => {
            prisma.comment.findUniqueOrThrow.mockResolvedValue({
                id: 'c1',
                userId: 'owner',
            });
            prisma.comment.update.mockResolvedValue({ id: 'c1' });

            await service.update('c1', 'owner', 'edited text');

            expect(prisma.comment.update).toHaveBeenCalledWith({
                where: { id: 'c1' },
                data: { comment: 'edited text', isEdited: true },
            });
        });
    });

    describe('remove', () => {
        it('soft-deletes the comment and its replies, then resyncs the count', async () => {
            prisma.comment.findUniqueOrThrow.mockResolvedValue({
                id: 'c1',
                contentId: 'content-1',
            });
            prisma.comment.count.mockResolvedValue(3);
            prisma.article.findUnique.mockResolvedValue({ statsId: 'stats-1' });

            await service.remove('c1');

            // comment + its direct replies are soft-deleted
            expect(prisma.comment.updateMany).toHaveBeenCalledWith({
                where: { OR: [{ id: 'c1' }, { parentId: 'c1' }] },
                data: { deleted: true },
            });
            // count recomputed from non-deleted, synced to the article's stats
            expect(prisma.comment.count).toHaveBeenCalledWith({
                where: { contentId: 'content-1', deleted: false },
            });
            expect(prisma.contentStats.update).toHaveBeenCalledWith({
                where: { id: 'stats-1' },
                data: { commentCount: 3 },
            });
        });

        it('falls back to the event stats when the content is an event', async () => {
            prisma.comment.findUniqueOrThrow.mockResolvedValue({
                id: 'c1',
                contentId: 'content-1',
            });
            prisma.comment.count.mockResolvedValue(2);
            prisma.article.findUnique.mockResolvedValue(null);
            prisma.event.findUnique.mockResolvedValue({ statsId: 'stats-ev' });

            await service.remove('c1');

            expect(prisma.contentStats.update).toHaveBeenCalledWith({
                where: { id: 'stats-ev' },
                data: { commentCount: 2 },
            });
        });

        it('skips the stats update when no article/event owns the content', async () => {
            prisma.comment.findUniqueOrThrow.mockResolvedValue({
                id: 'c1',
                contentId: 'orphan',
            });
            prisma.comment.count.mockResolvedValue(0);
            prisma.article.findUnique.mockResolvedValue(null);
            prisma.event.findUnique.mockResolvedValue(null);

            await service.remove('c1');

            expect(prisma.contentStats.update).not.toHaveBeenCalled();
        });
    });

    describe('react', () => {
        it('upserts a reaction for the user on the comment', async () => {
            await service.react('u1', 'c1', 'like' as any);
            expect(prisma.commentReaction.upsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        commentId_userId: { commentId: 'c1', userId: 'u1' },
                    },
                }),
            );
        });
    });
});
