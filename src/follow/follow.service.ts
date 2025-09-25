import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class FollowService {
    constructor(private prisma: PrismaService) { }

    async follow(followerId: string, followingId: string) {
        // Check if trying to follow self
        if (followerId === followingId) {
            throw new BadRequestException('Tidak dapat mengikuti diri sendiri');
        }

        // Check if following user exists and has public profile
        const followingUser = await this.prisma.user.findFirst({
            where: {
                id: followingId,
                // active: true,
                // profile: {
                //     isPublic: true
                // }
            },
            include: {
                profile: true
            }
        });

        if (!followingUser) {
            throw new NotFoundException('Pengguna tidak ditemukan atau profil tidak publik');
        }

        // Check if already following
        const existingFollow = await this.prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId,
                },
            },
        });

        if (existingFollow) {
            throw new BadRequestException('Sudah mengikuti pengguna ini');
        }

        // Create follow relationship
        const follow = await this.prisma.follow.create({
            data: {
                followerId,
                followingId,
            },
            include: {
                following: {
                    select: {
                        id: true,
                        name: true,
                        avatar_md: true,
                    },
                },
            },
        });

        // Update follower count in profile
        await this.updateFollowerCount(followingId);

        return {
            message: 'Berhasil mengikuti pengguna',
            follow,
        };
    }

    async unfollow(followerId: string, followingId: string) {
        // Check if follow relationship exists
        const existingFollow = await this.prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId,
                },
            },
        });

        if (!existingFollow) {
            throw new BadRequestException('Tidak mengikuti pengguna ini');
        }

        // Delete follow relationship
        await this.prisma.follow.delete({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId,
                },
            },
        });

        // Update follower count in profile
        await this.updateFollowerCount(followingId);

        return {
            message: 'Berhasil berhenti mengikuti pengguna',
        };
    }

    async checkFollowStatus(followerId: string, followingId: string) {
        const follow = await this.prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId,
                },
            },
        });

        return {
            isFollowing: !!follow,
            followedAt: follow?.createdAt || null,
        };
    }

    async getFollowers(userId: string, page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;

        const [total, followers] = await Promise.all([
            this.prisma.follow.count({
                where: { followingId: userId },
            }),
            this.prisma.follow.findMany({
                where: { followingId: userId },
                include: {
                    follower: {
                        select: {
                            id: true,
                            name: true,
                            avatar_md: true,
                            // profile: {
                            //     select: {
                            //         slug: true,
                            //         specializations: true,
                            //     },
                            // },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
        ]);

        return {
            data: followers.map(f => f.follower),
            total,
            page,
            limit,
            last_page: Math.ceil(total / limit),
        };
    }

    async getFollowing(userId: string, page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;

        const [total, following] = await Promise.all([
            this.prisma.follow.count({
                where: { followerId: userId },
            }),
            this.prisma.follow.findMany({
                where: { followerId: userId },
                include: {
                    following: {
                        select: {
                            id: true,
                            name: true,
                            avatar_md: true,
                            // profile: {
                            //     select: {
                            //         slug: true,
                            //         specializations: true,
                            //     },
                            // },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
        ]);

        return {
            data: following.map(f => f.following),
            total,
            page,
            limit,
            last_page: Math.ceil(total / limit),
        };
    }

    private async updateFollowerCount(userId: string) {
        const followerCount = await this.prisma.follow.count({
            where: { followingId: userId },
        });

        await this.prisma.profile.update({
            where: { userId },
            data: { totalFollowers: followerCount },
        });
    }
}
