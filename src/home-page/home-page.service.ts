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
        const [featuredArticles, allFeaturedEvents] = await Promise.all([
            this.getFeaturedArticles(5),
            this.getFeaturedEvents(5),
        ]);

        // Filter out events that have already passed
        // const today = new Date();
        // today.setHours(0, 0, 0, 0); // Start of today

        // const featuredEvents = allFeaturedEvents.filter((event) => {
        //     // If event has end_at, use it for comparison
        //     if (event.end_at) {
        //         const eventEndDate = new Date(event.end_at);
        //         eventEndDate.setHours(0, 0, 0, 0);
        //         return eventEndDate >= today; // Include if end date is today or future
        //     }

        //     // If no end_at, use start_at for comparison
        //     const eventStartDate = new Date(event.start_at);
        //     eventStartDate.setHours(0, 0, 0, 0);
        //     return eventStartDate >= today; // Include if start date is today or future
        // });

        return {
            featuredArticles,
            allFeaturedEvents,
        };
    }
}
