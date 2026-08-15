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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const crypto = __importStar(require("crypto"));
let SubscriptionsService = class SubscriptionsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async initializeTransaction(userId, tier, billingCycle = 'MONTHLY') {
        const secret = process.env.PAYSTACK_SECRET_KEY;
        if (!secret)
            throw new common_1.BadRequestException('Paystack not configured');
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.BadRequestException('User not found');
        const countryCode = user.billingCountry || 'NG';
        const pricing = await this.prisma.countryPricing.findUnique({
            where: { countryCode: countryCode.toUpperCase() },
        });
        if (!pricing)
            throw new common_1.BadRequestException('Pricing not found for your region');
        const tierKey = tier.toLowerCase();
        const cycleKey = billingCycle.toLowerCase();
        let amountDecimal;
        if (tierKey === 'bronze')
            amountDecimal = cycleKey === 'annual' ? pricing.bronzeAnnual : pricing.bronzeMonthly;
        else if (tierKey === 'silver')
            amountDecimal = cycleKey === 'annual' ? pricing.silverAnnual : pricing.silverMonthly;
        else if (tierKey === 'gold')
            amountDecimal = cycleKey === 'annual' ? pricing.goldAnnual : pricing.goldMonthly;
        else
            throw new common_1.BadRequestException('Invalid tier');
        const amount = Math.round(Number(amountDecimal) * 100);
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
                    tier: tier.toUpperCase(),
                    billingCycle: billingCycle.toUpperCase(),
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
    async verifyTransaction(reference) {
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
        const amount = data.data.amount;
        const currency = data.data.currency || 'NGN';
        if (metadata?.userId && metadata?.tier) {
            await this._activateSubscription(metadata.userId, metadata.tier, metadata.billingCycle || 'MONTHLY', reference, amount, currency);
        }
        return { status: 'success', tier: metadata?.tier };
    }
    async handlePaystackWebhook(signature, payload) {
        const secret = process.env.PAYSTACK_SECRET_KEY;
        if (!secret)
            throw new common_1.BadRequestException('Paystack secret not configured');
        const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(payload)).digest('hex');
        if (hash !== signature) {
            throw new common_1.UnauthorizedException('Invalid Signature');
        }
        const event = payload.event;
        if (event === 'charge.success') {
            const data = payload.data;
            const metadata = data.metadata;
            if (metadata?.type === 'MOCK_EXAM' && metadata?.userId && metadata?.mockExamId) {
                const attempt = await this.prisma.mockAttempt.findFirst({
                    where: { userId: metadata.userId, mockExamId: metadata.mockExamId, status: 'IN_PROGRESS' }
                });
                if (!attempt) {
                    await this.prisma.mockAttempt.create({
                        data: {
                            userId: metadata.userId,
                            mockExamId: metadata.mockExamId,
                            status: 'IN_PROGRESS'
                        }
                    });
                }
            }
            else if (metadata?.userId && metadata?.tier) {
                await this._activateSubscription(metadata.userId, metadata.tier, metadata.billingCycle || 'MONTHLY', data.reference, data.amount, data.currency || 'NGN');
            }
        }
        return { status: 'success' };
    }
    async _activateSubscription(userId, tier, billingCycle, reference, amountKobo, currency) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            return;
        const now = new Date();
        const periodEnd = new Date(now);
        if (billingCycle === 'ANNUAL') {
            periodEnd.setFullYear(now.getFullYear() + 1);
        }
        else {
            periodEnd.setMonth(now.getMonth() + 1);
        }
        await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: userId },
                data: { tier: tier },
            }),
            this.prisma.subscriptionRecord.upsert({
                where: { paystackReference: reference },
                update: {
                    status: 'ACTIVE',
                    currentPeriodStart: now,
                    currentPeriodEnd: periodEnd,
                },
                create: {
                    userId,
                    tier: tier,
                    billingCycle,
                    status: 'ACTIVE',
                    amountPaid: amountKobo / 100,
                    currency,
                    paystackReference: reference,
                    currentPeriodStart: now,
                    currentPeriodEnd: periodEnd,
                },
            }),
            this.prisma.walletLedger.create({
                data: {
                    userId,
                    type: 'EARN',
                    amount: amountKobo / 100,
                    reference: `SUB_${reference}`,
                    region: user.billingCountry || 'NG',
                },
            }),
        ]);
    }
};
exports.SubscriptionsService = SubscriptionsService;
exports.SubscriptionsService = SubscriptionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SubscriptionsService);
//# sourceMappingURL=subscriptions.service.js.map