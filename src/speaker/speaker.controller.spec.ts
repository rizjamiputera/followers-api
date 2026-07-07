import { Test, TestingModule } from '@nestjs/testing';
import { SpeakerController } from './speaker.controller';
import { SpeakerService } from './speaker.service';
import { AppService } from '../app.service';

describe('SpeakerController', () => {
    let controller: SpeakerController;
    let speakerService: Record<string, jest.Mock>;
    let appService: Record<string, jest.Mock>;

    beforeEach(async () => {
        speakerService = {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            findBySlug: jest.fn(),
            update: jest.fn(),
            setVerified: jest.fn(),
            updateAvatar: jest.fn(),
            remove: jest.fn(),
        };
        appService = {
            save_images: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [SpeakerController],
            providers: [
                { provide: SpeakerService, useValue: speakerService },
                { provide: AppService, useValue: appService },
            ],
        }).compile();

        controller = module.get<SpeakerController>(SpeakerController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('create() delegates to the service', async () => {
        const dto = { name: 'Fadhil Amir' };
        speakerService.create.mockResolvedValue({ id: 's1' });

        await expect(controller.create(dto)).resolves.toEqual({ id: 's1' });
        expect(speakerService.create).toHaveBeenCalledWith(dto);
    });

    it('findAll() forwards pagination and filter', async () => {
        const pagination = { page: 1, limit: 10 };
        const filter = { verified: true };
        speakerService.findAll.mockResolvedValue({ data: [] });

        await controller.findAll(pagination as any, filter);

        expect(speakerService.findAll).toHaveBeenCalledWith(pagination, filter);
    });

    it('findBySlug() delegates to the service', async () => {
        speakerService.findBySlug.mockResolvedValue({ id: 's1' });
        await controller.findBySlug('fadhil-amir');
        expect(speakerService.findBySlug).toHaveBeenCalledWith('fadhil-amir');
    });

    it('findOne() delegates to the service', async () => {
        speakerService.findOne.mockResolvedValue({ id: 's1' });
        await controller.findOne('s1');
        expect(speakerService.findOne).toHaveBeenCalledWith('s1');
    });

    it('update() delegates to the service', async () => {
        const dto = { name: 'New' };
        await controller.update('s1', dto);
        expect(speakerService.update).toHaveBeenCalledWith('s1', dto);
    });

    it('setVerified() passes through the boolean flag', async () => {
        await controller.setVerified('s1', { verified: true });
        expect(speakerService.setVerified).toHaveBeenCalledWith('s1', true);
    });

    it('uploadAvatar() resizes the file then persists the paths', async () => {
        const file = { buffer: Buffer.from('x') } as Express.Multer.File;
        appService.save_images.mockResolvedValue({
            large: '/avatar/lg.webp',
            medium: '/avatar/md.webp',
        });
        speakerService.updateAvatar.mockResolvedValue({ id: 's1' });

        await controller.uploadAvatar('s1', file);

        expect(appService.save_images).toHaveBeenCalledWith(file, '/avatar');
        expect(speakerService.updateAvatar).toHaveBeenCalledWith(
            's1',
            '/avatar/lg.webp',
            '/avatar/md.webp',
        );
    });

    it('remove() delegates to the service', async () => {
        speakerService.remove.mockResolvedValue({ message: 'ok' });
        await controller.remove('s1');
        expect(speakerService.remove).toHaveBeenCalledWith('s1');
    });
});
