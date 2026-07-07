import { Test, TestingModule } from '@nestjs/testing';
import { EventService } from './event.service';
import { PrismaService } from '../prisma.service';
import { AppService } from '../app.service';
import { SpeakerService } from '../speaker/speaker.service';

describe('EventService', () => {
    let service: EventService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EventService,
                { provide: PrismaService, useValue: {} },
                { provide: AppService, useValue: {} },
                { provide: SpeakerService, useValue: {} },
            ],
        }).compile();

        service = module.get<EventService>(EventService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
