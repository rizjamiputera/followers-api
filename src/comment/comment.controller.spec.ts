import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { UserService } from '../user/user.service';

describe('CommentController', () => {
    let controller: CommentController;
    let commentService: Record<string, jest.Mock>;
    let userService: Record<string, jest.Mock>;

    beforeEach(async () => {
        commentService = {
            create: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn().mockResolvedValue(undefined),
            react: jest.fn(),
        };
        userService = {
            hasPermission: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [CommentController],
            providers: [
                { provide: CommentService, useValue: commentService },
                { provide: UserService, useValue: userService },
            ],
        }).compile();

        controller = module.get<CommentController>(CommentController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('create', () => {
        it('builds the create input and connects a parent/mention for replies', async () => {
            const req = { user: { id: 'u1' } };
            await controller.create(
                req,
                {
                    contentId: 'content-1',
                    statsId: 'stats-1',
                    parentId: 'top-1',
                    mentionedId: 'u2',
                    comment: 'a reply',
                } as any,
                { includes: ['user'] } as any,
            );

            const [data, contentId, statsId, includes] =
                commentService.create.mock.calls[0];
            expect(contentId).toBe('content-1');
            expect(statsId).toBe('stats-1');
            expect(includes).toEqual(['user']);
            expect(data).toEqual(
                expect.objectContaining({
                    comment: 'a reply',
                    user: { connect: { id: 'u1' } },
                    content: { connect: { id: 'content-1' } },
                    parent: { connect: { id: 'top-1' } },
                    mentioned: { connect: { id: 'u2' } },
                }),
            );
        });

        it('omits parent/mention for a top-level comment', async () => {
            await controller.create(
                { user: { id: 'u1' } },
                {
                    contentId: 'content-1',
                    statsId: 'stats-1',
                    comment: 'hi',
                } as any,
                { includes: [] } as any,
            );
            const [data] = commentService.create.mock.calls[0];
            expect(data.parent).toBeUndefined();
            expect(data.mentioned).toBeUndefined();
        });
    });

    describe('remove (permissions)', () => {
        const setOwner = (userId: string) =>
            commentService.findOne.mockResolvedValue({ id: 'c1', userId });

        it('lets the author delete their own comment', async () => {
            setOwner('u1');
            await controller.remove({ user: { id: 'u1', role: Role.USER } }, 'c1');
            expect(commentService.remove).toHaveBeenCalledWith('c1');
        });

        it('forbids a USER from deleting someone else’s comment', async () => {
            setOwner('other');
            await expect(
                controller.remove({ user: { id: 'u1', role: Role.USER } }, 'c1'),
            ).rejects.toThrow(ForbiddenException);
            expect(commentService.remove).not.toHaveBeenCalled();
        });

        it('lets an ADMIN delete any comment', async () => {
            setOwner('other');
            await controller.remove(
                { user: { id: 'admin', role: Role.ADMIN } },
                'c1',
            );
            expect(commentService.remove).toHaveBeenCalledWith('c1');
        });

        it('lets an OPERATOR with COMMENT.DELETE delete any comment', async () => {
            setOwner('other');
            userService.hasPermission.mockResolvedValue(true);
            await controller.remove(
                { user: { id: 'op', role: Role.OPERATOR } },
                'c1',
            );
            expect(commentService.remove).toHaveBeenCalledWith('c1');
        });

        it('forbids an OPERATOR without COMMENT.DELETE', async () => {
            setOwner('other');
            userService.hasPermission.mockResolvedValue(false);
            await expect(
                controller.remove(
                    { user: { id: 'op', role: Role.OPERATOR } },
                    'c1',
                ),
            ).rejects.toThrow(ForbiddenException);
            expect(commentService.remove).not.toHaveBeenCalled();
        });
    });

    describe('react', () => {
        it('delegates to the service with the user, comment and type', async () => {
            await controller.react(
                { user: { id: 'u1' } },
                'c1',
                { type: 'like' } as any,
            );
            expect(commentService.react).toHaveBeenCalledWith('u1', 'c1', 'like');
        });
    });
});
