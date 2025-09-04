import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { ArticleService } from '../article/article.service';
import { EventService } from '../event/event.service';
import { ArticleWithAuthReaction } from '../article/article-interfaces';
import { EventWithRegistrationCount } from '../event/event-interface';
import { Article, Event } from '@prisma/client';

@Injectable()
export class HomePageService {
    constructor(
        private articleService: ArticleService,
        private eventService: EventService,
    ) { }

    // FEATURED ARTICLES MANAGEMENT
    async getFeaturedArticles(limit: number = 5): Promise<Article[]> {
        return this.articleService.getFeaturedArticles(limit);
    }

    async setArticleFeatured(id: string, isFeatured: boolean) {
        return this.articleService.setFeatured(id, isFeatured);
    }

    // FEATURED EVENTS MANAGEMENT
    async getFeaturedEvents(limit: number = 5): Promise<Event[]> {
        return this.eventService.getFeaturedEvents(limit);
    }

    async setEventFeatured(id: string, isFeatured: boolean) {
        return this.eventService.setFeatured(id, isFeatured);
    }

    // COMBINED HOMEPAGE DATA
    async getHomepageData() {
        const [featuredArticles, featuredEvents] = await Promise.all([
            this.getFeaturedArticles(5),
            this.getFeaturedEvents(5),
        ]);

        return {
            featuredArticles,
            featuredEvents,
        };
    }
}
