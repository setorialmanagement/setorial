import { Controller, Get, Post, Patch, Delete, Param, Query, UseGuards, ParseFloatPipe, Body, Request, BadRequestException } from '@nestjs/common';
import { PayoutsService } from '../payouts/payouts.service';
import { PrismaService } from '../prisma.service';
import { MockExamsService } from '../mock-exams/mock-exams.service';
import { NotificationsService } from '../notifications/notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
    constructor(
        private payoutsService: PayoutsService,
        private prisma: PrismaService,
        private mockExamsService: MockExamsService,
        private notificationsService: NotificationsService,
        private usersService: UsersService,
    ) { }


    // ─── Financial Dashboard ─────────────────────────────────────────────────

    @Get('dashboard')
    async getDashboardStats() {
        // Real revenue = sum of all EARN wallet entries
        const earnAggregate = await this.prisma.walletLedger.aggregate({
            where: { type: 'EARN' },
            _sum: { amount: true },
        });
        const currentMonthRevenue = Number(earnAggregate._sum.amount ?? 0);
        const rewardPoolCap = currentMonthRevenue * 0.20;

        // Sum all eligible (ELIGIBLE_MOVE) wallet entries
        const eligAggregate = await this.prisma.walletLedger.aggregate({
            where: { type: 'ELIGIBLE_MOVE' },
            _sum: { amount: true },
        });
        // Sum all payouts
        const payoutAggregate = await this.prisma.walletLedger.aggregate({
            where: { type: 'PAYOUT' },
            _sum: { amount: true },
        });
        const totalEarned = Number(eligAggregate._sum.amount ?? 0);
        const totalPaidOut = Number(payoutAggregate._sum.amount ?? 0);
        const totalLiability = totalEarned - totalPaidOut;

        const pendingKycCount = await this.prisma.user.count({ where: { kycStatus: 'PENDING' } });
        const approvedKycCount = await this.prisma.user.count({ where: { kycStatus: 'APPROVED' } });
        const totalUsers = await this.prisma.user.count({ where: { role: 'STUDENT' } });

        const latestBatch = await this.prisma.payoutBatch.findFirst({ orderBy: { createdAt: 'desc' } });

        // ─── NEW: PRD Section 7.7 Metrics ─────────────────────────────────────

        // Active monetized user count (Silver/Gold, verified, passed assessment)
        const activeMonetizedUsers = await this.prisma.user.count({
            where: {
                tier: { in: ['SILVER', 'GOLD'] },
                isVerified: true,
                assessmentPassed: true,
            },
        });

        // Projected Payout Exposure: total wallet balance across ALL monetized users
        const projectedExposure = await this.prisma.walletLedger.aggregate({
            where: {
                type: { in: ['ELIGIBLE_MOVE', 'PAYOUT'] },
            },
            _sum: { amount: true },
        });
        const projectedPayoutExposure = Number(projectedExposure._sum.amount ?? 0);

        // Distribution ratio (PRD 7.4): what % of eligible balance can we actually pay?
        const distributionRatio = totalLiability > 0
            ? Math.min(1, rewardPoolCap / totalLiability)
            : 1;

        // Dynamic Conversion Rate (PRD 7.3): adjust points-to-cash ratio
        // Base: 10 pts = ₦1. Modified by pool pressure.
        const baseConversionRate = 10; // 10 points per ₦1
        const dynamicConversionRate = baseConversionRate / distributionRatio;

        // Fraud Flags: users with suspicious activity patterns
        // Flag 1: Users with > 50,000 points earned in a single day (point farming)
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        const suspiciousHighEarners = await this.prisma.pointsLedger.groupBy({
            by: ['userId'],
            where: { createdAt: { gte: oneDayAgo } },
            _sum: { points: true },
            having: { points: { _sum: { gt: 50000 } } },
        });

        // Flag 2: Mock exam cheaters (CHEATED status)
        const cheatedAttempts = await this.prisma.mockAttempt.count({
            where: { status: 'CHEATED' },
        });

        // Sustainability tier
        const sustainabilityTier = rewardPoolCap <= currentMonthRevenue * 0.20
            ? 'YEAR_1 (20% cap)'
            : rewardPoolCap <= currentMonthRevenue * 0.25
                ? 'YEAR_2 (25% cap)'
                : 'HARD_CAP (30% — board review required)';

        const liabilityRatio = currentMonthRevenue > 0
            ? totalLiability / currentMonthRevenue
            : 0;

        const riskLevel = liabilityRatio > 0.3
            ? 'CRITICAL'
            : liabilityRatio > 0.2
                ? 'WARNING'
                : 'SAFE';

        return {
            currentMonthRevenue,
            rewardPoolCap,
            totalLiability,
            liabilityRatio: Math.round(liabilityRatio * 10000) / 100, // as percentage
            projectedPayoutExposure,
            distributionRatio: Math.round(distributionRatio * 10000) / 100,
            dynamicConversionRate: Math.round(dynamicConversionRate * 100) / 100,
            riskLevel,
            sustainabilityTier,
            activeMonetizedUsers,
            fraudFlags: {
                suspiciousHighEarners: suspiciousHighEarners.length,
                cheatedMockAttempts: cheatedAttempts,
                flaggedUserIds: suspiciousHighEarners.map(u => u.userId),
            },
            pendingKycCount,
            approvedKycCount,
            totalUsers,
            latestPayoutBatch: latestBatch ?? null,
        };
    }

    // ─── KYC Management ─────────────────────────────────────────────────────

    @Get('kyc')
    async getPendingKyc() {
        return this.prisma.user.findMany({
            where: { kycStatus: 'PENDING' },
            take: 1000,
            select: { id: true, name: true, email: true, tier: true, payoutMethod: true, payoutAccount: true, createdAt: true },
            orderBy: { updatedAt: 'asc' },
        });
    }

    @Post('kyc/:id/approve')
    async approveKyc(@Param('id') userId: string) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { kycStatus: 'APPROVED', isVerified: true },
            select: { id: true, name: true, email: true, kycStatus: true, isVerified: true },
        });
    }

    @Post('kyc/:id/reject')
    async rejectKyc(@Param('id') userId: string, @Body('reason') reason: string) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { kycStatus: 'REJECTED' },
        });
        return { success: true, userId, reason };
    }

    // ─── User Management ────────────────────────────────────────────────────

    @Get('users')
    async getAllUsers(
        @Query('tier') tier?: string,
        @Query('kycStatus') kycStatus?: string,
        @Query('role') role?: string,
    ) {
        const where: any = {};
        if (role) {
            where.role = role.toUpperCase() as any;
        } else {
            where.role = { in: ['STUDENT', 'TUTOR'] };
        }
        if (tier) where.tier = tier.toUpperCase();
        if (kycStatus) where.kycStatus = kycStatus.toUpperCase();
        return this.prisma.user.findMany({
            where,
            take: 1000,
            select: { id: true, name: true, email: true, tier: true, kycStatus: true, isVerified: true, role: true, isFrozen: true, isFlagged: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    @Post('users/tutor')
    async createTutor(@Body() data: any) {
        const { email, password, name } = data;
        if (!email || !password || !name) {
            throw new BadRequestException('Missing required fields: email, password, name');
        }
        const existing = await this.prisma.user.findUnique({ where: { email } });
        if (existing) {
            throw new BadRequestException('Email already in use');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        return this.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: 'TUTOR',
                isEmailVerified: true,
                kycStatus: 'APPROVED'
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true
            }
        });
    }

    @Post('users/:id/freeze')
    async freezeUser(@Param('id') userId: string, @Body('isFrozen') isFrozen: boolean) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { isFrozen },
            select: { id: true, email: true, isFrozen: true },
        });
    }

    @Post('users/:id/flag')
    async flagUser(@Param('id') userId: string, @Body('isFlagged') isFlagged: boolean) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { isFlagged },
            select: { id: true, email: true, isFlagged: true },
        });
    }

    // ─── Global Configuration ───────────────────────────────────────────────

    @Get('configs')
    async getConfigs() {
        return this.prisma.globalConfig.findMany();
    }

    // Publicly-queryable config for safe keys (unguarded)
    @Get('public/configs/:key')
    async getPublicConfig(@Param('key') key: string) {
        // Only allow safe keys to be returned publicly
        const SAFE_KEYS = ['mascot_mood_override', 'public_branding'];
        if (!SAFE_KEYS.includes(key)) {
            return { error: 'not_allowed' };
        }
        const cfg = await this.prisma.globalConfig.findUnique({ where: { key } });
        if (!cfg) return { key, value: null };
        return { key: cfg.key, value: cfg.value };
    }

    @Post('configs/:key')
    async updateConfig(@Param('key') key: string, @Body('value') value: string, @Body('description') description?: string) {
        return this.prisma.globalConfig.upsert({
            where: { key },
            update: { value, description },
            create: { key, value, description },
        });
    }

    // ─── Discount Codes ─────────────────────────────────────────────────────

    @Get('discounts')
    async getDiscounts() {
        return this.prisma.discountCode.findMany();
    }

    @Post('discounts')
    async createDiscount(@Body() data: { code: string, discountPercent: number, maxUses?: number, expiryDate?: string }) {
        return this.prisma.discountCode.create({
            data: {
                ...data,
                expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
            },
        });
    }

    @Post('discounts/:id/toggle')
    async toggleDiscount(@Param('id') id: string, @Body('isActive') isActive: boolean) {
        return this.prisma.discountCode.update({
            where: { id },
            data: { isActive },
        });
    }

    // ─── Payout Batches ─────────────────────────────────────────────────────

    @Get('payout-batches')
    async getPayoutBatches() {
        return this.prisma.payoutBatch.findMany({ take: 100, orderBy: { createdAt: 'desc' } });
    }

    /** Manual trigger for testing — production version runs on cron */
    @Post('payout/trigger')
    async triggerPayout(@Query('month') month: string) {
        return this.payoutsService.processPayout(month);
    }

    @Get('payout/simulate')
    async simulatePayout(
        @Query('month') month: string,
        @Query('revenue') revenue?: string,
    ) {
        return this.payoutsService.simulatePayout(month, revenue ? parseFloat(revenue) : undefined);
    }

    // ─── Mock Exams (Admin) ─────────────────────────────────────────────────

    @Roles(Role.ADMIN, Role.TUTOR)
    @Post('mocks')
    async createMock(@Body() data: any, @Request() req: any) {
        const isApproved = req.user.role === 'TUTOR' ? false : true;
        // Simple creation via prisma for now, expects questions array
        return this.prisma.mockExam.create({
            data: {
                title: data.title,
                description: data.description,
                durationMinutes: data.durationMinutes,
                price: data.price,
                isActive: data.isActive ?? true,
                isApproved,
                questions: {
                    create: data.questions.map((q: any) => ({
                        text: q.text,
                        options: q.options,
                        correctOption: q.correctOption,
                        explanation: q.explanation,
                    })),
                },
            },
            include: { questions: true },
        });
    }

    @Roles(Role.ADMIN, Role.TUTOR)
    @Post('mocks/:id') // Using POST for some older axios setups, but PATCH is better
    async legacyUpdateMock(@Param('id') id: string, @Body() data: any, @Request() req: any) {
        return this.patchMock(id, data, req);
    }

    @Roles(Role.ADMIN, Role.TUTOR)
    @Get('mocks/:id')
    async getMock(@Param('id') id: string) {
        return this.prisma.mockExam.findUnique({
            where: { id },
            include: { questions: true }
        });
    }

    @Roles(Role.ADMIN, Role.TUTOR)
    @Delete('mocks/:id')
    async deleteMock(@Param('id') id: string) {
        // Delete questions first if necessary, but schema has onDelete: Cascade
        return this.prisma.mockExam.delete({ where: { id } });
    }

    @Roles(Role.ADMIN, Role.TUTOR)
    @Patch('mocks/:id')
    async patchMock(@Param('id') id: string, @Body() data: any, @Request() req: any) {
        const isApproved = req.user.role === 'TUTOR' ? false : true;
        // Delete existing questions and recreate
        await this.prisma.question.deleteMany({ where: { mockExamId: id } });
        
        return this.prisma.mockExam.update({
            where: { id },
            data: {
                title: data.title,
                description: data.description,
                durationMinutes: data.durationMinutes,
                price: data.price,
                isActive: data.isActive ?? true,
                isApproved,
                questions: {
                    create: data.questions.map((q: any) => ({
                        text: q.text,
                        options: q.options,
                        correctOption: q.correctOption,
                        explanation: q.explanation,
                    })),
                },
            },
            include: { questions: true },
        });
    }

    @Roles(Role.ADMIN)
    @Post('mocks/:id/approve')
    async approveMock(@Param('id') id: string) {
        return this.prisma.mockExam.update({
            where: { id },
            data: { isApproved: true }
        });
    }

    // ─── Support Management (Admin) ──────────────────────────────────────────

    @Get('support')
    async getSupportMessages() {
        return this.prisma.supportMessage.findMany({
            take: 1000,
            include: { user: { select: { name: true, email: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    @Post('support/:id/reply')
    async replyToSupport(@Param('id') id: string, @Body() data: { reply: string, adminName: string }) {
        return this.prisma.supportMessage.update({
            where: { id },
            data: {
                adminReply: data.reply,
                repliedBy: data.adminName,
                repliedAt: new Date(),
                status: 'RESOLVED',
            },
        });
    }

    // ─── Notifications (Admin) ───────────────────────────────────────────────

    @Post('notifications/send')
    async sendNotification(@Body() data: { userId?: string, recentOnly?: boolean, title: string, body: string, data?: any }) {
        if (data.userId) {
            return this.notificationsService.sendPush(data.userId, data.title, data.body, data.data);
        } else {
            let whereClause: any = { expoPushToken: { not: null } };
            if (data.recentOnly) {
                const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                whereClause.lastActiveAt = { gte: oneDayAgo };
            }
            
            const users = await this.prisma.user.findMany({
                where: whereClause,
                select: { id: true },
            });
            const userIds = users.map(u => u.id);
            return this.notificationsService.sendPushToMany(userIds, data.title, data.body, data.data);
        }
    }

    @Post('notifications/email')
    async sendEmailBroadcast(@Body() data: { subject: string, body: string, emails?: string[] }) {
        let emails: string[] = [];

        if (data.emails && Array.isArray(data.emails) && data.emails.length > 0) {
            emails = data.emails;
        } else {
            const users = await this.prisma.user.findMany({
                where: { role: 'STUDENT', isEmailVerified: true },
                select: { email: true },
            });
            emails = users.map(u => u.email);
        }

        return this.notificationsService.sendBroadcastEmail(emails, data.subject, data.body);
    }

    @Get('users/:id/stats')
    async getUserStats(@Param('id') id: string) {
        return this.usersService.getUserStats(id);
    }

    @Get('users/:id/analytics')
    async getUserAnalytics(@Param('id') id: string) {
        const user = await this.prisma.user.findUnique({ where: { id }, select: { id: true, name: true, email: true, createdAt: true, lastActiveAt: true } });
        if (!user) throw new BadRequestException('User not found');

        const [lessonsCompleted, mockAttempts, mockCompleted, walletEarnedAgg, walletPayoutAgg, pointsAgg, supportCount, tutorSessionsCount, videoPlaysCount] = await Promise.all([
            this.prisma.userProgress.count({ where: { userId: id } }),
            this.prisma.mockAttempt.count({ where: { userId: id } }),
            this.prisma.mockAttempt.count({ where: { userId: id, status: 'COMPLETED' } }),
            this.prisma.walletLedger.aggregate({ where: { userId: id, type: 'EARN' }, _sum: { amount: true } }),
            this.prisma.walletLedger.aggregate({ where: { userId: id, type: 'PAYOUT' }, _sum: { amount: true } }),
            this.prisma.pointsLedger.aggregate({ where: { userId: id }, _sum: { points: true } }),
            this.prisma.supportMessage.count({ where: { userId: id } }),
            this.prisma.tutorSession.count({ where: { userId: id } }),
            this.prisma.videoPlay.count({ where: { userId: id } }),
        ]);

        const stats = await this.usersService.getUserStats(id);

        const breakdownRaw = await this.prisma.videoPlay.groupBy({
            by: ['lessonId'],
            where: { userId: id },
            _count: { lessonId: true },
            orderBy: { _count: { lessonId: 'desc' } }
        });

        const lessonIds = breakdownRaw.map(b => b.lessonId);
        const lessons = lessonIds.length > 0 ? await this.prisma.lesson.findMany({ where: { id: { in: lessonIds } }, select: { id: true, name: true } }) : [];
        const lessonMap = lessons.reduce((acc, l) => { acc[l.id] = l; return acc; }, {} as any);
        const videoPlayBreakdown = breakdownRaw.map(b => ({ lessonId: b.lessonId, lessonName: lessonMap[b.lessonId]?.name ?? 'Unknown', count: (b._count && (b._count as any).lessonId) || 0 }));

        return {
            user,
            ...stats,
            lessonsCompleted,
            mockAttempts,
            mockCompleted,
            totalEarned: Number(walletEarnedAgg._sum.amount ?? 0),
            totalPayouts: Number(walletPayoutAgg._sum.amount ?? 0),
            totalPoints: Number(pointsAgg._sum.points ?? 0),
            supportTickets: supportCount,
            tutorSessions: tutorSessionsCount,
            videoPlays: videoPlaysCount,
            videoPlayBreakdown,
        };
    }

    @Get('analytics/overview')
    async getCohortOverview() {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
        startOfWeek.setHours(0, 0, 0, 0);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [students, pointRows, freezeRows, lessonCount] = await Promise.all([
            this.prisma.user.findMany({
                where: { role: 'STUDENT' },
                select: {
                    id: true,
                    tier: true,
                    createdAt: true,
                    lastActiveAt: true,
                    currentStreak: true,
                    assessmentPassed: true,
                    isVerified: true,
                },
            }),
            this.prisma.pointsLedger.groupBy({ by: ['userId'], _sum: { points: true } }),
            this.prisma.userPowerUp.findMany({
                where: { powerUp: { type: 'STREAK_FREEZE' } },
                select: { userId: true, isActive: true },
            }),
            this.prisma.lesson.count({ where: { isApproved: true } }),
        ]);

        const totalsByTier = { FREE: 0, BRONZE: 0, SILVER: 0, GOLD: 0 } as Record<string, number>;
        students.forEach(user => {
            const tier = user.tier || 'FREE';
            totalsByTier[tier] = (totalsByTier[tier] ?? 0) + 1;
        });

        const activeToday = students.filter(user => user.lastActiveAt && user.lastActiveAt >= startOfToday).length;
        const activeThisWeek = students.filter(user => user.lastActiveAt && user.lastActiveAt >= startOfWeek).length;
        const activeThisMonth = students.filter(user => user.lastActiveAt && user.lastActiveAt >= startOfMonth).length;

        const dormant24h = students.filter(user => user.lastActiveAt && user.lastActiveAt < new Date(now.getTime() - 24 * 60 * 60 * 1000)).length;
        const dormant3d = students.filter(user => user.lastActiveAt && user.lastActiveAt < new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)).length;
        const dormant7d = students.filter(user => user.lastActiveAt && user.lastActiveAt < new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)).length;

        const freezeUsers = new Set(freezeRows.map(item => item.userId)).size;
        const freezesRemaining = freezeRows.filter(item => item.isActive).length;

        const eligiblePayoutUsers = await this.prisma.user.count({
            where: {
                role: 'STUDENT',
                tier: { in: ['SILVER', 'GOLD'] },
                isVerified: true,
                assessmentPassed: true,
            }
        });

        const payoutAgg = await this.prisma.walletLedger.aggregate({
            where: { type: 'ELIGIBLE_MOVE' },
            _sum: { amount: true },
        });

        const averageStreak = students.length > 0
            ? students.reduce((sum, user) => sum + (user.currentStreak || 0), 0) / students.length
            : 0;

        const avgCompletionRate = students.length > 0
            ? (await Promise.all(students.map(async (user) => {
                const lessonsCompleted = await this.prisma.userProgress.count({ where: { userId: user.id } });
                const completionRate = lessonCount > 0 ? (lessonsCompleted / lessonCount) * 100 : 0;
                return completionRate;
            }))).reduce((sum, rate) => sum + rate, 0) / students.length
            : 0;

        const cohortRetention = async (days: number) => {
            const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
            const cohort = await this.prisma.user.findMany({
                where: { role: 'STUDENT', createdAt: { lte: cutoff } },
                select: { id: true, createdAt: true, lastActiveAt: true },
            });

            if (cohort.length === 0) return 0;
            const retained = cohort.filter(user => {
                const expectedDate = new Date(user.createdAt);
                expectedDate.setDate(expectedDate.getDate() + days);
                return user.lastActiveAt && user.lastActiveAt >= expectedDate;
            }).length;

            return Number(((retained / cohort.length) * 100).toFixed(2));
        };

        const signups = await this.prisma.user.findMany({
            where: { role: 'STUDENT' },
            select: { createdAt: true, tier: true },
            orderBy: { createdAt: 'asc' },
        });

        const TIERS = ['FREE', 'BRONZE', 'SILVER', 'GOLD'];

        const dailyTrend = Array.from({ length: 30 }, (_, index) => {
            const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (29 - index));
            const key = date.toISOString().slice(0, 10);
            const dayUsers = signups.filter(user => user.createdAt && user.createdAt.toISOString().slice(0, 10) === key);
            const tiers: Record<string, number> = { FREE: 0, BRONZE: 0, SILVER: 0, GOLD: 0 };
            dayUsers.forEach(u => {
                const t = (u as any).tier || 'FREE';
                tiers[t] = (tiers[t] ?? 0) + 1;
            });
            return { date: key, count: dayUsers.length, tiers };
        });

        const weeklyTrend = Array.from({ length: 8 }, (_, index) => {
            const start = new Date(now);
            start.setDate(now.getDate() - (7 * (7 - index)));
            start.setHours(0, 0, 0, 0);
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            const count = signups.filter(user => {
                if (!user.createdAt) return false;
                return user.createdAt >= start && user.createdAt <= end;
            }).length;
            return { period: `${start.toISOString().slice(0, 10)} to ${end.toISOString().slice(0, 10)}`, count };
        });

        const topPerformers = pointRows
            .map(item => ({ userId: item.userId, points: Number(item._sum.points ?? 0) }))
            .sort((a, b) => b.points - a.points)
            .slice(0, 10)
            .map(async (item) => {
                const user = await this.prisma.user.findUnique({
                    where: { id: item.userId },
                    select: { name: true, avatarUrl: true, tier: true },
                });
                return {
                    userId: item.userId,
                    name: user?.name || 'Student',
                    avatarUrl: user?.avatarUrl || null,
                    tier: user?.tier || 'FREE',
                    points: item.points,
                };
            });

        const atRisk = students.filter(user => {
            const daysSinceActive = user.lastActiveAt ? Math.floor((now.getTime() - new Date(user.lastActiveAt).getTime()) / 86400000) : null;
            return daysSinceActive !== null && daysSinceActive >= 2 && daysSinceActive <= 7 && (user.currentStreak || 0) < 5;
        }).map(user => ({
            userId: user.id,
            lastActiveAt: user.lastActiveAt,
            currentStreak: user.currentStreak || 0,
        }));

        return {
            totalRegisteredUsers: students.length,
            planTierBreakdown: totalsByTier,
            active: {
                today: activeToday,
                thisWeek: activeThisWeek,
                thisMonth: activeThisMonth,
            },
            dormantUsers: {
                last24Hours: dormant24h,
                last3Days: dormant3d,
                last7Days: dormant7d,
            },
            streakFreezeUsage: {
                usersWhoUsedFreeze: freezeUsers,
                freezesRemaining,
            },
            learnAndEarn: {
                eligibleUsers: eligiblePayoutUsers,
                totalAmountOwed: Number(payoutAgg._sum.amount ?? 0),
            },
            averageStreakLength: Number(averageStreak.toFixed(2)),
            averageLessonCompletionRate: Number(avgCompletionRate.toFixed(2)),
            retentionRate: {
                day1: await cohortRetention(1),
                day7: await cohortRetention(7),
                day30: await cohortRetention(30),
            },
            newSignupsTrend: {
                daily: dailyTrend,
                weekly: weeklyTrend,
            },
            atRiskUsers: atRisk,
            topPerformers: await Promise.all(topPerformers),
        };
    }

    @Get('analytics/export')
    async exportAnalyticsCsv() {
        const users = await this.prisma.user.findMany({
            where: { role: 'STUDENT' },
            select: {
                id: true,
                name: true,
                email: true,
                tier: true,
                createdAt: true,
                lastActiveAt: true,
                currentStreak: true,
                longestStreak: true,
                totalActiveDays: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        const rows = await Promise.all(users.map(async (user) => {
            const points = await this.prisma.pointsLedger.aggregate({ where: { userId: user.id }, _sum: { points: true } });
            const lessons = await this.prisma.userProgress.count({ where: { userId: user.id } });
            return {
                id: user.id,
                name: user.name || '',
                email: user.email,
                tier: user.tier,
                dateJoined: user.createdAt.toISOString(),
                lastActiveAt: user.lastActiveAt ? user.lastActiveAt.toISOString() : '',
                currentStreak: user.currentStreak,
                longestStreak: user.longestStreak,
                totalActiveDays: user.totalActiveDays,
                totalLessonsCompleted: lessons,
                totalPoints: Number(points._sum.points ?? 0),
            };
        }));

        const headers = ['id', 'name', 'email', 'tier', 'dateJoined', 'lastActiveAt', 'currentStreak', 'longestStreak', 'totalActiveDays', 'totalLessonsCompleted', 'totalPoints'];
        const csvRows = [headers.join(',')].concat(rows.map(row => headers.map(header => `"${String((row as any)[header] ?? '').replace(/"/g, '""')}"`).join(',')));
        return { csv: csvRows.join('\n') };
    }
}
