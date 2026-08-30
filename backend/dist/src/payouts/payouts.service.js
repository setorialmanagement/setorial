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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var PayoutsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayoutsService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma.service");
const client_1 = require("@prisma/client");
const paystack_utils_1 = require("./paystack-utils");
const notifications_service_1 = require("../notifications/notifications.service");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
let PayoutsService = PayoutsService_1 = class PayoutsService {
    prisma;
    notificationsService;
    payoutsQueue;
    logger = new common_1.Logger(PayoutsService_1.name);
    constructor(prisma, notificationsService, payoutsQueue) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
        this.payoutsQueue = payoutsQueue;
    }
    async simulatePayout(month, globalEstimatedRevenue) {
        const [year, m] = month.split('-').map(Number);
        const startDate = new Date(year, m - 1, 1);
        const endDate = new Date(year, m, 1);
        const regionsAgg = await this.prisma.walletLedger.groupBy({
            by: ['region'],
            where: { type: 'ELIGIBLE_MOVE', region: { not: null } },
        });
        const simulationResults = [];
        for (const { region } of regionsAgg) {
            const currentRegion = region;
            const earnAgg = await this.prisma.walletLedger.aggregate({
                where: {
                    type: 'EARN',
                    region: currentRegion,
                    createdAt: { gte: startDate, lt: endDate }
                },
                _sum: { amount: true },
            });
            const regionalRevenue = globalEstimatedRevenue !== undefined && globalEstimatedRevenue > 0
                ? globalEstimatedRevenue
                : Number(earnAgg?._sum?.amount ?? 0);
            const rewardPool = regionalRevenue * 0.20;
            const credits = await this.prisma.walletLedger.groupBy({
                by: ['userId'],
                where: { type: 'ELIGIBLE_MOVE', region: currentRegion },
                _sum: { amount: true },
            });
            const debits = await this.prisma.walletLedger.groupBy({
                by: ['userId'],
                where: { type: 'PAYOUT', region: currentRegion },
                _sum: { amount: true },
            });
            const debitMap = new Map(debits.map((d) => [d.userId, Number(d?._sum?.amount ?? 0)]));
            const balances = credits
                .map((c) => ({
                userId: c.userId,
                eligibleBalance: Number(c?._sum?.amount ?? 0) - Number(debitMap.get(c.userId) ?? 0),
            }))
                .filter((b) => b.eligibleBalance > 0);
            const totalEligibleBalance = balances.reduce((acc, b) => acc + b.eligibleBalance, 0);
            const distributionRatio = totalEligibleBalance > rewardPool && totalEligibleBalance > 0
                ? rewardPool / totalEligibleBalance
                : 1;
            const simulatedPayouts = balances.map((b) => ({
                userId: b.userId,
                eligibleBalance: b.eligibleBalance,
                simulatedPayout: parseFloat((b.eligibleBalance * distributionRatio).toFixed(2)),
            }));
            simulationResults.push({
                region: currentRegion,
                regionalRevenue,
                rewardPool,
                totalEligibleBalance,
                distributionRatio,
                safeToExecute: totalEligibleBalance <= rewardPool,
                simulatedPayoutsCount: simulatedPayouts.length,
                simulatedPayouts,
            });
        }
        return {
            month,
            globalEstimatedRevenue,
            regions: simulationResults,
        };
    }
    async processPayout(month) {
        this.logger.log(`📤 Processing payout batches for ${month}`);
        const [year, m] = month.split('-').map(Number);
        const startDate = new Date(year, m - 1, 1);
        const endDate = new Date(year, m, 1);
        const verifiedUsers = await this.prisma.user.findMany({
            where: { kycStatus: 'APPROVED', isVerified: true, tier: { in: ['SILVER', 'GOLD'] } },
            select: { id: true, billingCountry: true, email: true },
        });
        const verifiedIds = verifiedUsers.map((u) => u.id);
        if (verifiedIds.length === 0) {
            this.logger.warn('No verified eligible users found for payout.');
            return { message: 'No eligible verified users found', month, totalPaid: 0 };
        }
        const regionsAgg = await this.prisma.walletLedger.groupBy({
            by: ['region'],
            where: { type: 'ELIGIBLE_MOVE', userId: { in: verifiedIds }, region: { not: null } },
        });
        const batchResults = [];
        let totalGlobalPaid = 0;
        for (const { region } of regionsAgg) {
            const currentRegion = region;
            this.logger.log(`🌍 Processing Region: ${currentRegion}`);
            const earnAgg = await this.prisma.walletLedger.aggregate({
                where: {
                    type: 'EARN',
                    region: currentRegion,
                    createdAt: { gte: startDate, lt: endDate }
                },
                _sum: { amount: true },
            });
            const regionalRevenue = Number(earnAgg?._sum?.amount ?? 0);
            const rewardPool = regionalRevenue * 0.20;
            const credits = await this.prisma.walletLedger.groupBy({
                by: ['userId'],
                where: { type: 'ELIGIBLE_MOVE', userId: { in: verifiedIds }, region: currentRegion },
                _sum: { amount: true },
            });
            const debits = await this.prisma.walletLedger.groupBy({
                by: ['userId'],
                where: { type: 'PAYOUT', userId: { in: verifiedIds }, region: currentRegion },
                _sum: { amount: true },
            });
            const debitMap = new Map(debits.map((d) => [d.userId, Number(d?._sum?.amount ?? 0)]));
            const balances = credits
                .map((c) => ({
                userId: c.userId,
                eligibleBalance: Number(c?._sum?.amount ?? 0) - Number(debitMap.get(c.userId) ?? 0),
            }))
                .filter((b) => b.eligibleBalance > 0);
            if (balances.length === 0) {
                this.logger.log(`Skipping region ${currentRegion}: No eligible balances`);
                continue;
            }
            const totalEligibleBalance = balances.reduce((acc, b) => acc + b.eligibleBalance, 0);
            const distributionRatio = totalEligibleBalance > rewardPool && totalEligibleBalance > 0
                ? rewardPool / totalEligibleBalance
                : 1;
            let regionalTotalPaid = 0;
            const batchRef = `BATCH-${currentRegion}-${month}-${Date.now()}`;
            await this.prisma.$transaction(async (tx) => {
                for (const { userId, eligibleBalance } of balances) {
                    const payAmount = parseFloat((eligibleBalance * distributionRatio).toFixed(2));
                    if (payAmount <= 0)
                        continue;
                    regionalTotalPaid += payAmount;
                    await tx.walletLedger.create({
                        data: {
                            userId,
                            type: 'PAYOUT',
                            amount: new client_1.Prisma.Decimal(-payAmount),
                            reference: batchRef,
                            region: currentRegion,
                            exchangeRate: 1600.0
                        },
                    });
                    try {
                        await this.disburseFunds(userId, payAmount, currentRegion);
                        const user = verifiedUsers.find((u) => u.id === userId);
                        if (user && user.email) {
                            this.notificationsService.sendPayoutConfirmation(user.email, payAmount, month)
                                .catch(e => this.logger.warn(`Failed to send payout email to ${user.email}: ${e.message}`));
                        }
                    }
                    catch (disbursementError) {
                        this.logger.error(`❌ Disbursement failed for user ${userId}: ${disbursementError.message}`);
                    }
                }
            });
            const batch = await this.prisma.payoutBatch.create({
                data: {
                    month,
                    region: currentRegion,
                    totalLiability: new client_1.Prisma.Decimal(totalEligibleBalance),
                    totalPaid: new client_1.Prisma.Decimal(regionalTotalPaid),
                    exchangeRate: 1600.0,
                    status: 'COMPLETED',
                },
            });
            totalGlobalPaid += regionalTotalPaid;
            const userIds = balances.map((b) => b.userId);
            if (userIds.length > 0) {
                this.notificationsService.sendPushToMany(userIds, 'Payout Sent! 🎉', `Your rewards for ${month} have been disbursed to your bank account. Check your app for details.`, { type: 'PAYOUT_SENT', month }).catch(e => this.logger.warn(`Failed to send batch push for payout: ${e.message}`));
            }
            batchResults.push({
                region: currentRegion,
                batchId: batch.id,
                rewardPool,
                totalEligibleBalance,
                distributionRatio,
                totalPaid: regionalTotalPaid,
                usersPaid: balances.length,
            });
            this.logger.log(`✅ Region ${currentRegion} complete. Paid: ${regionalTotalPaid}. Users: ${balances.length}`);
        }
        return {
            month,
            totalGlobalPaid,
            regionsProcessed: batchResults.length,
            batches: batchResults
        };
    }
    async handleMonthlyPayout() {
        if (process.env.IS_WORKER === 'true')
            return;
        const now = new Date();
        const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        if (!this.payoutsQueue) {
            this.logger.warn('Bull queues disabled; skipping adding payout job to queue.');
            return;
        }
        this.logger.log(`⏰ Cron: Adding payout processing job to queue for ${month}`);
        await this.payoutsQueue.add('process-payout', { month });
    }
    async disburseFunds(userId, amount, region) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.payoutAccount) {
            throw new Error(`User ${userId} has no payout account configured`);
        }
        const payoutInfo = user.payoutAccount;
        let recipientCode = payoutInfo.recipientCode;
        if (!recipientCode) {
            const bankCode = (0, paystack_utils_1.resolveBankCode)(payoutInfo.bankName);
            if (!bankCode) {
                throw new Error(`Could not resolve bank code for: ${payoutInfo.bankName}`);
            }
            const pricing = await this.prisma.countryPricing.findUnique({
                where: { countryCode: region }
            });
            const currency = pricing?.currency || 'NGN';
            const recipientData = await (0, paystack_utils_1.paystackRequest)('/transferrecipient', 'POST', {
                type: 'nuban',
                name: user.name || 'Setorial Student',
                account_number: payoutInfo.accountNumber,
                bank_code: bankCode,
                currency: currency,
            });
            recipientCode = recipientData.data.recipient_code;
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    payoutAccount: {
                        ...payoutInfo,
                        recipientCode,
                    },
                },
            });
        }
        const amountInKobo = Math.round(amount * 100);
        const transferData = await (0, paystack_utils_1.paystackRequest)('/transfer', 'POST', {
            source: 'balance',
            amount: amountInKobo,
            recipient: recipientCode,
            reason: `Setorial Rewards - ${region}`,
        });
        return transferData;
    }
};
exports.PayoutsService = PayoutsService;
__decorate([
    (0, schedule_1.Cron)('0 0 28 * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PayoutsService.prototype, "handleMonthlyPayout", null);
exports.PayoutsService = PayoutsService = PayoutsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Optional)()),
    __param(2, (0, bullmq_1.InjectQueue)('payouts')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        bullmq_2.Queue])
], PayoutsService);
//# sourceMappingURL=payouts.service.js.map