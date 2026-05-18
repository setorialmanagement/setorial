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
let AdminController = class AdminController {
    payoutsService;
    prisma;
    mockExamsService;
    notificationsService;
    constructor(payoutsService, prisma, mockExamsService, notificationsService) {
        this.payoutsService = payoutsService;
        this.prisma = prisma;
        this.mockExamsService = mockExamsService;
        this.notificationsService = notificationsService;
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
        return this.prisma.payoutBatch.findMany({ orderBy: { createdAt: 'desc' } });
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
            const users = await this.prisma.user.findMany({
                where: { expoPushToken: { not: null } },
                select: { id: true },
            });
            const userIds = users.map(u => u.id);
            return this.notificationsService.sendPushToMany(userIds, data.title, data.body, data.data);
        }
    }
    async sendEmailBroadcast(data) {
        const users = await this.prisma.user.findMany({
            where: { role: 'STUDENT', isEmailVerified: true },
            select: { email: true },
        });
        const emails = users.map(u => u.email);
        return this.notificationsService.sendBroadcastEmail(emails, data.subject, data.body);
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
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __metadata("design:paramtypes", [payouts_service_1.PayoutsService,
        prisma_service_1.PrismaService,
        mock_exams_service_1.MockExamsService,
        notifications_service_1.NotificationsService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map