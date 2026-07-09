import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AppService } from '../app.service';
import { UpdateSiteSettingDto } from './dto/update-site-setting.dto';

const SINGLETON_ID = 1;

interface SocialShape {
    instagram: string;
    youtube: string;
    tiktok: string;
    facebook: string;
    x: string;
    whatsapp: string;
}
interface ContactShape {
    email: string;
    phone: string;
}

const EMPTY_SOCIAL: SocialShape = {
    instagram: '', youtube: '', tiktok: '', facebook: '', x: '', whatsapp: '',
};
const EMPTY_CONTACT: ContactShape = { email: '', phone: '' };

@Injectable()
export class SiteSettingService {
    constructor(
        private prisma: PrismaService,
        private app: AppService,
    ) {}

    // Absolute URL for the stored (relative) og image path; '' stays '' so
    // the frontend can fall back to its baked-in default share card.
    private ogImageUrl(path: string): string {
        if (!path) return '';
        if (/^https?:\/\//.test(path)) return path;
        const apiUri = process.env.API_URI || 'http://localhost:5111';
        return apiUri + path;
    }

    // Map the DB row to the public snake_case API contract.
    private serialize(row: {
        siteTitle: string;
        metaDescription: string;
        tagline: string;
        ogImage: string;
        social: unknown;
        contact: unknown;
    }) {
        return {
            site_title: row.siteTitle,
            meta_description: row.metaDescription,
            tagline: row.tagline,
            og_image: this.ogImageUrl(row.ogImage),
            social: { ...EMPTY_SOCIAL, ...((row.social as object) ?? {}) },
            contact: { ...EMPTY_CONTACT, ...((row.contact as object) ?? {}) },
        };
    }

    // Ensure the singleton row exists and return it.
    private async ensureRow() {
        return this.prisma.siteSetting.upsert({
            where: { id: SINGLETON_ID },
            create: { id: SINGLETON_ID },
            update: {},
        });
    }

    async get() {
        const row = await this.ensureRow();
        return this.serialize(row);
    }

    async update(dto: UpdateSiteSettingDto) {
        const current = await this.ensureRow();

        const data: Record<string, unknown> = {};
        if (dto.site_title !== undefined) data.siteTitle = dto.site_title;
        if (dto.meta_description !== undefined) data.metaDescription = dto.meta_description;
        if (dto.tagline !== undefined) data.tagline = dto.tagline;
        if (dto.social !== undefined) {
            data.social = { ...EMPTY_SOCIAL, ...((current.social as object) ?? {}), ...dto.social };
        }
        if (dto.contact !== undefined) {
            data.contact = { ...EMPTY_CONTACT, ...((current.contact as object) ?? {}), ...dto.contact };
        }

        const row = await this.prisma.siteSetting.update({
            where: { id: SINGLETON_ID },
            data,
        });
        return this.serialize(row);
    }

    async updateOgImage(file: Express.Multer.File) {
        const current = await this.ensureRow();
        const saved = await this.app.save_images(file, '/site');

        // Remove the previously uploaded image (skip external/default URLs).
        if (current.ogImage && current.ogImage.startsWith('/')) {
            await this.app.removeFile(current.ogImage.replace(/^\//, ''));
        }

        const row = await this.prisma.siteSetting.update({
            where: { id: SINGLETON_ID },
            data: { ogImage: saved.large },
        });
        return this.serialize(row);
    }
}
