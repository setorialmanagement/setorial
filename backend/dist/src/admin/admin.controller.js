"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const payouts_service_1 = require("../payouts/payouts.service");
const prisma_service_1 = require("../prisma.service");
const mock_exams_service_1 = require("../mock-exams/mock-exams.service");
const notifications_service_1 = require("../notifications/notifications.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const users_service_1 = require("../users/users.service");
let AdminController = class AdminController {
    payoutsService;
    prisma;
    mockExamsService;
    notificationsService;
    usersService;
    constructor(payoutsService, prisma, mockExamsService, notificationsService, usersService) {
        this.payoutsService = payoutsService;
        this.prisma = prisma;
        this.mockExamsService = mockExamsService;
        this.notificationsService = notificationsService;
        this.usersService = usersService;
    }
    async getDashboardStats() {
        const earnAggregate = await this.prisma.walletLedger.aggregate({
            where: { type: 'EARN' },
            _sum: { amount: true },
        });
        const currentMonthRevenue = Number(earnAggregate._sum.amount ?? 0);
        const rewardPoolCap = currentMonthRevenue * 0.20;
        const eligAggregate = await this.prisma.walletLedger.aggregate({
            where: { type: 'ELIGIBLE_MOVE' },
            _sum: { amount: true },
        });
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
        const activeMonetizedUsers = await this.prisma.user.count({
            where: {
                tier: { in: ['SILVER', 'GOLD'] },
                isVerified: true,
                assessmentPassed: true,
            },
        });
        const projectedExposure = await this.prisma.walletLedger.aggregate({
            where: {
                type: { in: ['ELIGIBLE_MOVE', 'PAYOUT'] },
            },
            _sum: { amount: true },
        });
        const projectedPayoutExposure = Number(projectedExposure._sum.amount ?? 0);
        const distributionRatio = totalLiability > 0
            ? Math.min(1, rewardPoolCap / totalLiability)
            : 1;
        const baseConversionRate = 10;
        const dynamicConversionRate = baseConversionRate / distributionRatio;
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        const suspiciousHighEarners = await this.prisma.pointsLedger.groupBy({
            by: ['userId'],
            where: { createdAt: { gte: oneDayAgo } },
            _sum: { points: true },
            having: { points: { _sum: { gt: 50000 } } },
        });
        const cheatedAttempts = await this.prisma.mockAttempt.count({
            where: { status: 'CHEATED' },
        });
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
            liabilityRatio: Math.round(liabilityRatio * 10000) / 100,
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
    async getPendingKyc() {
        return this.prisma.user.findMany({
            where: { kycStatus: 'PENDING' },
            take: 1000,
            select: { id: true, name: true, email: true, tier: true, payoutMethod: true, payoutAccount: true, createdAt: true },
            orderBy: { updatedAt: 'asc' },
        });
    }
    async approveKyc(userId) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { kycStatus: 'APPROVED', isVerified: true },
            select: { id: true, name: true, email: true, kycStatus: true, isVerified: true },
        });
    }
    async rejectKyc(userId, reason) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { kycStatus: 'REJECTED' },
        });
        return { success: true, userId, reason };
    }
    async getAllUsers(tier, kycStatus, role) {
        const where = {};
        if (role) {
            where.role = role.toUpperCase();
        }
        else {
            where.role = { in: ['STUDENT', 'TUTOR'] };
        }
        if (tier)
            where.tier = tier.toUpperCase();
        if (kycStatus)
            where.kycStatus = kycStatus.toUpperCase();
        return this.prisma.user.findMany({
            where,
            take: 1000,
            select: { id: true, name: true, email: true, tier: true, kycStatus: true, isVerified: true, role: true, isFrozen: true, isFlagged: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
        });
    }
    async createTutor(data) {
        const { email, password, name } = data;
        if (!email || !password || !name) {
            throw new common_1.BadRequestException('Missing required fields: email, password, name');
        }
        const existing = await this.prisma.user.findUnique({ where: { email } });
        if (existing) {
            throw new common_1.BadRequestException('Email already in use');
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
    async freezeUser(userId, isFrozen) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { isFrozen },
            select: { id: true, email: true, isFrozen: true },
        });
    }
    async flagUser(userId, isFlagged) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { isFlagged },
            select: { id: true, email: true, isFlagged: true },
        });
    }
    async getConfigs() {
        return this.prisma.globalConfig.findMany();
    }
    async getPublicConfig(key) {
        const SAFE_KEYS = ['mascot_mood_override', 'public_branding'];
        if (!SAFE_KEYS.includes(key)) {
            return { error: 'not_allowed' };
        }
        const cfg = await this.prisma.globalConfig.findUnique({ where: { key } });
        if (!cfg)
            return { key, value: null };
        return { key: cfg.key, value: cfg.value };
    }
    async updateConfig(key, value, description) {
        return this.prisma.globalConfig.upsert({
            where: { key },
            update: { value, description },
            create: { key, value, description },
        });
    }
    async getDiscounts() {
        return this.prisma.discountCode.findMany();
    }
    async createDiscount(data) {
        return this.prisma.discountCode.create({
            data: {
                ...data,
                expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
            },
        });
    }
    async toggleDiscount(id, isActive) {
        return this.prisma.discountCode.update({
            where: { id },
            data: { isActive },
        });
    }
    async getPayoutBatches() {
        return this.prisma.payoutBatch.findMany({ take: 100, orderBy: { createdAt: 'desc' } });
    }
    async triggerPayout(month) {
        return this.payoutsService.processPayout(month);
    }
    async simulatePayout(month, revenue) {
        return this.payoutsService.simulatePayout(month, revenue ? parseFloat(revenue) : undefined);
    }
    async createMock(data, req) {
        const isApproved = req.user.role === 'TUTOR' ? false : true;
        return this.prisma.mockExam.create({
            data: {
                title: data.title,
                description: data.description,
                durationMinutes: data.durationMinutes,
                price: data.price,
                isActive: data.isActive ?? true,
                isApproved,
                questions: {
                    create: data.questions.map((q) => ({
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
    async legacyUpdateMock(id, data, req) {
        return this.patchMock(id, data, req);
    }
    async getMock(id) {
        return this.prisma.mockExam.findUnique({
            where: { id },
            include: { questions: true }
        });
    }
    async deleteMock(id) {
        return this.prisma.mockExam.delete({ where: { id } });
    }
    async patchMock(id, data, req) {
        const isApproved = req.user.role === 'TUTOR' ? false : true;
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
                    create: data.questions.map((q) => ({
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
    async approveMock(id) {
        return this.prisma.mockExam.update({
            where: { id },
            data: { isApproved: true }
        });
    }
    async getSupportMessages() {
        return this.prisma.supportMessage.findMany({
            take: 1000,
            include: { user: { select: { name: true, email: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }
    async replyToSupport(id, data) {
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
    async sendNotification(data) {
        if (data.userId) {
            return this.notificationsService.sendPush(data.userId, data.title, data.body, data.data);
        }
        else {
            let whereClause = { expoPushToken: { not: null } };
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
    async sendEmailBroadcast(data) {
        let emails = [];
        if (data.emails && Array.isArray(data.emails) && data.emails.length > 0) {
            emails = data.emails;
        }
        else {
            const users = await this.prisma.user.findMany({
                where: { role: 'STUDENT', isEmailVerified: true },
                select: { email: true },
            });
            emails = users.map(u => u.email);
        }
        return this.notificationsService.sendBroadcastEmail(emails, data.subject, data.body);
    }
    async getUserStats(id) {
        return this.usersService.getUserStats(id);
    }
    async getUserAnalytics(id) {
        const user = await this.prisma.user.findUnique({ where: { id }, select: { id: true, name: true, email: true, createdAt: true, lastActiveAt: true } });
        if (!user)
            throw new common_1.BadRequestException('User not found');
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
        const lessonMap = lessons.reduce((acc, l) => { acc[l.id] = l; return acc; }, {});
        const videoPlayBreakdown = breakdownRaw.map(b => ({ lessonId: b.lessonId, lessonName: lessonMap[b.lessonId]?.name ?? 'Unknown', count: (b._count && b._count.lessonId) || 0 }));
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
        const totalsByTier = { FREE: 0, BRONZE: 0, SILVER: 0, GOLD: 0 };
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
        const cohortRetention = async (days) => {
            const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
            const cohort = await this.prisma.user.findMany({
                where: { role: 'STUDENT', createdAt: { lte: cutoff } },
                select: { id: true, createdAt: true, lastActiveAt: true },
            });
            if (cohort.length === 0)
                return 0;
            const retained = cohort.filter(user => {
                const expectedDate = new Date(user.createdAt);
                expectedDate.setDate(expectedDate.getDate() + days);
                return user.lastActiveAt && user.lastActiveAt >= expectedDate;
            }).length;
            return Number(((retained / cohort.length) * 100).toFixed(2));
        };
        const signups = await this.prisma.user.findMany({
            where: { role: 'STUDENT' },
            select: { createdAt: true },
            orderBy: { createdAt: 'asc' },
        });
        const dailyTrend = Array.from({ length: 30 }, (_, index) => {
            const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (29 - index));
            const key = date.toISOString().slice(0, 10);
            return { date: key, count: signups.filter(user => user.createdAt && user.createdAt.toISOString().slice(0, 10) === key).length };
        });
        const weeklyTrend = Array.from({ length: 8 }, (_, index) => {
            const start = new Date(now);
            start.setDate(now.getDate() - (7 * (7 - index)));
            start.setHours(0, 0, 0, 0);
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            const count = signups.filter(user => {
                if (!user.createdAt)
                    return false;
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
        const csvRows = [headers.join(',')].concat(rows.map(row => headers.map(header => `"${String(row[header] ?? '').replace(/"/g, '""')}"`).join(',')));
        return { csv: csvRows.join('\n') };
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('dashboard'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDashboardStats", null);
__decorate([
    (0, common_1.Get)('kyc'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPendingKyc", null);
__decorate([
    (0, common_1.Post)('kyc/:id/approve'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "approveKyc", null);
__decorate([
    (0, common_1.Post)('kyc/:id/reject'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "rejectKyc", null);
__decorate([
    (0, common_1.Get)('users'),
    __param(0, (0, common_1.Query)('tier')),
    __param(1, (0, common_1.Query)('kycStatus')),
    __param(2, (0, common_1.Query)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllUsers", null);
__decorate([
    (0, common_1.Post)('users/tutor'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createTutor", null);
__decorate([
    (0, common_1.Post)('users/:id/freeze'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('isFrozen')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "freezeUser", null);
__decorate([
    (0, common_1.Post)('users/:id/flag'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('isFlagged')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "flagUser", null);
__decorate([
    (0, common_1.Get)('configs'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getConfigs", null);
__decorate([
    (0, common_1.Get)('public/configs/:key'),
    __param(0, (0, common_1.Param)('key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPublicConfig", null);
__decorate([
    (0, common_1.Post)('configs/:key'),
    __param(0, (0, common_1.Param)('key')),
    __param(1, (0, common_1.Body)('value')),
    __param(2, (0, common_1.Body)('description')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateConfig", null);
__decorate([
    (0, common_1.Get)('discounts'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDiscounts", null);
__decorate([
    (0, common_1.Post)('discounts'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createDiscount", null);
__decorate([
    (0, common_1.Post)('discounts/:id/toggle'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('isActive')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "toggleDiscount", null);
__decorate([
    (0, common_1.Get)('payout-batches'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPayoutBatches", null);
__decorate([
    (0, common_1.Post)('payout/trigger'),
    __param(0, (0, common_1.Query)('month')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "triggerPayout", null);
__decorate([
    (0, common_1.Get)('payout/simulate'),
    __param(0, (0, common_1.Query)('month')),
    __param(1, (0, common_1.Query)('revenue')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "simulatePayout", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.TUTOR),
    (0, common_1.Post)('mocks'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createMock", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.TUTOR),
    (0, common_1.Post)('mocks/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "legacyUpdateMock", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.TUTOR),
    (0, common_1.Get)('mocks/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getMock", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.TUTOR),
    (0, common_1.Delete)('mocks/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteMock", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.TUTOR),
    (0, common_1.Patch)('mocks/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "patchMock", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, common_1.Post)('mocks/:id/approve'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "approveMock", null);
__decorate([
    (0, common_1.Get)('support'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getSupportMessages", null);
__decorate([
    (0, common_1.Post)('support/:id/reply'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "replyToSupport", null);
__decorate([
    (0, common_1.Post)('notifications/send'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "sendNotification", null);
__decorate([
    (0, common_1.Post)('notifications/email'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "sendEmailBroadcast", null);
__decorate([
    (0, common_1.Get)('users/:id/stats'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUserStats", null);
__decorate([
    (0, common_1.Get)('users/:id/analytics'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUserAnalytics", null);
__decorate([
    (0, common_1.Get)('analytics/overview'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getCohortOverview", null);
__decorate([
    (0, common_1.Get)('analytics/export'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "exportAnalyticsCsv", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    __metadata("design:paramtypes", [payouts_service_1.PayoutsService,
        prisma_service_1.PrismaService,
        mock_exams_service_1.MockExamsService,
        notifications_service_1.NotificationsService,
        users_service_1.UsersService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map