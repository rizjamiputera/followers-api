import { Test, TestingModule } from '@nestjs/testing';
import {
    BadRequestException,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';
import { SpeakerService } from './speaker.service';
import { PrismaService } from '../prisma.service';
import { AppService } from '../app.service';

describe('SpeakerService', () => {
    let service: SpeakerService;
    let prisma: {
        speaker: Record<string, jest.Mock>;
        user: Record<string, jest.Mock>;
    };
    let app: Record<string, jest.Mock>;

    beforeEach(async () => {
        prisma = {
            speaker: {
                findFirst: jest.fn(),
                findUnique: jest.fn(),
                findMany: jest.fn(),
                count: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
            },
            user: {
                findUnique: jest.fn(),
            },
        };
        app = {
            // identity passthrough so we can assert on the underlying record
            transformImageUrls: jest.fn((d) => d),
            transformImageUrlsArray: jest.fn((d) => d),
            removeFile: jest.fn().mockResolvedValue(undefined),
            save_images: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SpeakerService,
                { provide: PrismaService, useValue: prisma },
                { provide: AppService, useValue: app },
            ],
        }).compile();

        service = module.get<SpeakerService>(SpeakerService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('generates a slug from the name and persists the speaker', async () => {
            prisma.speaker.findFirst.mockResolvedValue(null); // slug is free
            prisma.speaker.create.mockImplementation(({ data }) => ({
                id: 's1',
                ...data,
            }));

            const result = await service.create({ name: 'Fadhil Amir' });

            expect(prisma.speaker.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    name: 'Fadhil Amir',
                    slug: 'fadhil-amir',
                }),
            });
            expect(result.slug).toBe('fadhil-amir');
            expect(app.transformImageUrls).toHaveBeenCalled();
        });

        it('appends a numeric suffix when the base slug is taken', async () => {
            prisma.speaker.findFirst
                .mockResolvedValueOnce({ id: 'existing' }) // fadhil-amir taken
                .mockResolvedValueOnce(null); // fadhil-amir-2 free
            prisma.speaker.create.mockImplementation(({ data }) => ({
                id: 's2',
                ...data,
            }));

            await service.create({ name: 'Fadhil Amir' });

            expect(prisma.speaker.create).toHaveBeenCalledWith({
                data: expect.objectContaining({ slug: 'fadhil-amir-2' }),
            });
        });

        it('throws when the linked user does not exist', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            await expect(
                service.create({ name: 'X', userId: 'u1' }),
            ).rejects.toThrow(NotFoundException);
            expect(prisma.speaker.create).not.toHaveBeenCalled();
        });

        it('throws when the user is already linked to another speaker', async () => {
            prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
            prisma.speaker.findUnique.mockResolvedValue({ id: 'other' });

            await expect(
                service.create({ name: 'X', userId: 'u1' }),
            ).rejects.toThrow(ConflictException);
            expect(prisma.speaker.create).not.toHaveBeenCalled();
        });
    });

    describe('resolveContentSpeakers', () => {
        it('resolves an existing speaker id after verifying it exists', async () => {
            prisma.speaker.findFirst.mockResolvedValue({ id: 'sp1' });

            const result = await service.resolveContentSpeakers([
                { speakerId: 'sp1', role: 'pemateri utama' },
            ]);

            expect(result).toEqual([
                { speakerId: 'sp1', role: 'pemateri utama', sortOrder: 0 },
            ]);
            expect(prisma.speaker.create).not.toHaveBeenCalled();
        });

        it('throws NotFound when a referenced speaker is missing', async () => {
            prisma.speaker.findFirst.mockResolvedValue(null);

            await expect(
                service.resolveContentSpeakers([{ speakerId: 'ghost' }]),
            ).rejects.toThrow(NotFoundException);
        });

        it('creates a new speaker on the fly from a name', async () => {
            prisma.speaker.findFirst.mockResolvedValue(null); // slug is free
            prisma.speaker.create.mockResolvedValue({ id: 'new1' });

            const result = await service.resolveContentSpeakers([
                { name: 'Fadhil Amir', honorific: 'Ustadz' },
            ]);

            expect(prisma.speaker.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        name: 'Fadhil Amir',
                        honorific: 'Ustadz',
                        slug: 'fadhil-amir',
                    }),
                }),
            );
            expect(result).toEqual([
                { speakerId: 'new1', role: null, sortOrder: 0 },
            ]);
        });

        it('throws BadRequest when an item has neither speakerId nor name', async () => {
            await expect(
                service.resolveContentSpeakers([{ role: 'moderator' }]),
            ).rejects.toThrow(BadRequestException);
        });

        it('deduplicates repeated speaker ids and preserves order', async () => {
            prisma.speaker.findFirst.mockResolvedValue({ id: 'x' }); // all exist

            const result = await service.resolveContentSpeakers([
                { speakerId: 'a' },
                { speakerId: 'b' },
                { speakerId: 'a' }, // duplicate, dropped
            ]);

            expect(result).toEqual([
                { speakerId: 'a', role: null, sortOrder: 0 },
                { speakerId: 'b', role: null, sortOrder: 1 },
            ]);
        });
    });

    describe('findAll', () => {
        it('returns a paginated envelope filtering out deleted speakers', async () => {
            prisma.speaker.count.mockResolvedValue(1);
            prisma.speaker.findMany.mockResolvedValue([{ id: 's1' }]);

            const result = await service.findAll(
                { page: 1, limit: 10 } as any,
                {},
            );

            expect(result).toEqual({
                data: [{ id: 's1' }],
                limit: 10,
                total: 1,
                page: 1,
                last_page: 1,
            });
            expect(prisma.speaker.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ deleted: false }),
                    skip: 0,
                    take: 10,
                }),
            );
        });

        it('applies the verified filter and search term to the where clause', async () => {
            prisma.speaker.count.mockResolvedValue(0);
            prisma.speaker.findMany.mockResolvedValue([]);

            await service.findAll(
                { page: 1, limit: 10, search: 'fadhil' } as any,
                { verified: true },
            );

            const where = prisma.speaker.findMany.mock.calls[0][0].where;
            expect(where.verified).toBe(true);
            expect(where.OR).toEqual(
                expect.arrayContaining([
                    { name: { contains: 'fadhil', mode: 'insensitive' } },
                ]),
            );
        });

        it('returns all rows without pagination when limit is 0', async () => {
            prisma.speaker.count.mockResolvedValue(3);
            prisma.speaker.findMany.mockResolvedValue([{}, {}, {}]);

            const result = await service.findAll(
                { page: 1, limit: 0 } as any,
                {},
            );

            expect(prisma.speaker.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ take: undefined }),
            );
            expect(result.last_page).toBe(1);
        });
    });

    describe('findOne', () => {
        it('returns the speaker when found', async () => {
            prisma.speaker.findFirst.mockResolvedValue({ id: 's1' });
            await expect(service.findOne('s1')).resolves.toEqual({ id: 's1' });
        });

        it('throws NotFound when missing', async () => {
            prisma.speaker.findFirst.mockResolvedValue(null);
            await expect(service.findOne('nope')).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('findBySlug', () => {
        it('throws NotFound when the slug does not resolve', async () => {
            prisma.speaker.findFirst.mockResolvedValue(null);
            await expect(service.findBySlug('nope')).rejects.toThrow(
                NotFoundException,
            );
        });

        it('returns the speaker with content when found', async () => {
            prisma.speaker.findFirst.mockResolvedValue({
                id: 's1',
                contents: [],
            });
            const result = await service.findBySlug('fadhil-amir');
            expect(result.id).toBe('s1');
        });
    });

    describe('update', () => {
        it('throws NotFound when the speaker does not exist', async () => {
            prisma.speaker.findFirst.mockResolvedValue(null);
            await expect(
                service.update('nope', { name: 'X' }),
            ).rejects.toThrow(NotFoundException);
        });

        it('re-generates the slug when the name changes', async () => {
            prisma.speaker.findFirst
                .mockResolvedValueOnce({ id: 's1', name: 'Old Name' }) // existence
                .mockResolvedValueOnce(null); // uniqueSlug check
            prisma.speaker.update.mockImplementation(({ data }) => ({
                id: 's1',
                ...data,
            }));

            await service.update('s1', { name: 'New Name' });

            expect(prisma.speaker.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 's1' },
                    data: expect.objectContaining({
                        name: 'New Name',
                        slug: 'new-name',
                    }),
                }),
            );
        });

        it('disconnects the user when userId is cleared', async () => {
            prisma.speaker.findFirst.mockResolvedValue({
                id: 's1',
                name: 'Same',
            });
            prisma.speaker.update.mockImplementation(({ data }) => data);

            await service.update('s1', { userId: '' });

            const data = prisma.speaker.update.mock.calls[0][0].data;
            expect(data.user).toEqual({ disconnect: true });
        });

        it('connects a valid, unlinked user', async () => {
            prisma.speaker.findFirst.mockResolvedValue({
                id: 's1',
                name: 'Same',
            });
            prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
            prisma.speaker.findUnique.mockResolvedValue(null); // not linked
            prisma.speaker.update.mockImplementation(({ data }) => data);

            await service.update('s1', { userId: 'u1' });

            const data = prisma.speaker.update.mock.calls[0][0].data;
            expect(data.user).toEqual({ connect: { id: 'u1' } });
        });
    });

    describe('setVerified', () => {
        it('throws NotFound when the speaker is missing', async () => {
            prisma.speaker.findFirst.mockResolvedValue(null);
            await expect(service.setVerified('nope', true)).rejects.toThrow(
                NotFoundException,
            );
        });

        it('updates the verified flag', async () => {
            prisma.speaker.findFirst.mockResolvedValue({ id: 's1' });
            prisma.speaker.update.mockResolvedValue({
                id: 's1',
                verified: true,
            });

            const result = await service.setVerified('s1', true);

            expect(prisma.speaker.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 's1' },
                    data: { verified: true },
                }),
            );
            expect(result.verified).toBe(true);
        });
    });

    describe('updateAvatar', () => {
        it('removes previous files and persists the new paths', async () => {
            prisma.speaker.findFirst.mockResolvedValue({
                id: 's1',
                avatar: '/avatar/old_lg.webp',
                avatar_md: '/avatar/old_md.webp',
            });
            prisma.speaker.update.mockImplementation(({ data }) => data);

            await service.updateAvatar(
                's1',
                '/avatar/new_lg.webp',
                '/avatar/new_md.webp',
            );

            expect(app.removeFile).toHaveBeenCalledWith('/avatar/old_lg.webp');
            expect(app.removeFile).toHaveBeenCalledWith('/avatar/old_md.webp');
            expect(prisma.speaker.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: {
                        avatar: '/avatar/new_lg.webp',
                        avatar_md: '/avatar/new_md.webp',
                    },
                }),
            );
        });

        it('throws NotFound when the speaker is missing', async () => {
            prisma.speaker.findFirst.mockResolvedValue(null);
            await expect(
                service.updateAvatar('nope', 'a', 'b'),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('remove', () => {
        it('throws NotFound when the speaker is missing', async () => {
            prisma.speaker.findFirst.mockResolvedValue(null);
            await expect(service.remove('nope')).rejects.toThrow(
                NotFoundException,
            );
        });

        it('rejects deletion while still attached to content', async () => {
            prisma.speaker.findFirst.mockResolvedValue({
                id: 's1',
                _count: { contents: 2 },
            });
            await expect(service.remove('s1')).rejects.toThrow(
                BadRequestException,
            );
            expect(prisma.speaker.update).not.toHaveBeenCalled();
        });

        it('soft-deletes an unattached speaker', async () => {
            prisma.speaker.findFirst.mockResolvedValue({
                id: 's1',
                _count: { contents: 0 },
            });
            prisma.speaker.update.mockResolvedValue({});

            const result = await service.remove('s1');

            expect(prisma.speaker.update).toHaveBeenCalledWith({
                where: { id: 's1' },
                data: { deleted: true },
            });
            expect(result).toEqual({ message: 'Pemateri berhasil dihapus' });
        });
    });
});
