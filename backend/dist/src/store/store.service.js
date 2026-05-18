"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoreService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const gamification_service_1 = require("../gamification/gamification.service");
let StoreService = class StoreService {
    prisma;
    gamification;
    constructor(prisma, gamification) {
        this.prisma = prisma;
        this.gamification = gamification;
    }
    async seedPowerUps() {
        const defaults = [
            {
                type: 'STREAK_FREEZE',
                name: 'Streak Freeze',
                description: 'Protects your streak for 1 day if you miss studying.',
                icon: 'Snowflake',
                price: 50,
                durationDays: 1,
            },
            {
                type: 'DOUBLE_POINTS',
                name: '2x Points Boost',
                description: 'Earn double points on all quizzes for 24 hours.',
                icon: 'Zap',
                price: 100,
                durationDays: 1,
            },
        ];
        for (const p of defaults) {
            await this.prisma.powerUp.upsert({
                where: { type: p.type },
                update: {},
                create: p,
            });
        }
    }
    async getStore() {
        await this.seedPowerUps();
        return this.prisma.powerUp.findMany();
    }
    async initializePurchase(userId, powerUpType) {
        await this.seedPowerUps();
        const secret = process.env.PAYSTACK_SECRET_KEY;
        if (!secret)
            throw new common_1.BadRequestException('Paystack not configured');
        const powerUp = await this.prisma.powerUp.findUnique({
            where: { type: powerUpType },
        });
        if (!powerUp)
            throw new common_1.NotFoundException('Power-up not found');
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.BadRequestException('User not found');
        const amount = Math.round(Number(powerUp.price) * 100);
        const response = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${secret}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: user.email,
                amount,
                metadata: {
                    userId: user.id,
                    powerUpType: powerUp.type,
                    purchaseType: 'POWERUP',
                },
                callback_url: `setorial://payment-callback`,
            }),
        });
        const data = await response.json();
        if (!data.status)
            throw new common_1.BadRequestException(data.message || 'Payment initialization failed');
        return {
            authorization_url: data.data.authorization_url,
            access_code: data.data.access_code,
            reference: data.data.reference,
        };
    }
    async verifyPurchase(reference) {
        const secret = process.env.PAYSTACK_SECRET_KEY;
        if (!secret)
            throw new common_1.BadRequestException('Paystack not configured');
        const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: { 'Authorization': `Bearer ${secret}` },
        });
        const data = await response.json();
        if (!data.status || data.data.status !== 'success') {
            return { status: 'failed', message: 'Payment not verified' };
        }
        const metadata = data.data.metadata;
        if (metadata?.purchaseType === 'POWERUP' && metadata?.userId && metadata?.powerUpType) {
            const powerUp = await this.prisma.powerUp.findUnique({
                where: { type: metadata.powerUpType },
            });
            if (powerUp) {
                const expiresAt = powerUp.durationDays
                    ? new Date(Date.now() + powerUp.durationDays * 24 * 60 * 60 * 1000)
                    : null;
                await this.prisma.userPowerUp.create({
                    data: {
                        userId: metadata.userId,
                        powerUpId: powerUp.id,
                        expiresAt,
                    },
                });
                if (powerUp.type === 'STREAK_FREEZE') {
                    await this.gamification.applyStreakFreeze(metadata.userId);
                }
            }
        }
        return { status: 'success', powerUpType: metadata?.powerUpType };
    }
    async getMyPowerUps(userId) {
        return this.prisma.userPowerUp.findMany({
            where: {
                userId,
                isActive: true,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } },
                ],
            },
            include: { powerUp: true },
            orderBy: { activatedAt: 'desc' },
        });
    }
    async hasActiveBoost(userId) {
        const boost = await this.prisma.userPowerUp.findFirst({
            where: {
                userId,
                isActive: true,
                expiresAt: { gt: new Date() },
                powerUp: { type: 'DOUBLE_POINTS' },
            },
        });
        return !!boost;
    }
};
exports.StoreService = StoreService;
exports.StoreService = StoreService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        gamification_service_1.GamificationService])
], StoreService);
//# sourceMappingURL=store.service.js.map