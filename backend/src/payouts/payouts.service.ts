import { Injectable, Logger, BadRequestException, Optional } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';
import { paystackRequest, resolveBankCode } from './paystack-utils';
import { NotificationsService } from '../notifications/notifications.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class PayoutsService {
    private readonly logger = new Logger(PayoutsService.name);

    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService,
        @Optional() @InjectQueue('payouts') private payoutsQueue?: Queue
    ) { }

    /**
     * Preview-only simulation — does NOT write any changes.
     * Returns how much each eligible user would receive given a revenue figure, breakdown by region.
     */
    async simulatePayout(month: string, globalEstimatedRevenue?: number) {
        // Parse month (e.g. "2024-10") into range
        const [year, m] = month.split('-').map(Number);
        const startDate = new Date(year, m - 1, 1);
        const endDate = new Date(year, m, 1);

        // Find distinct regions we have ELIGIBLE_MOVE entries for
        const regionsAgg = await (this.prisma as any).walletLedger.groupBy({
            by: ['region'],
            where: { type: 'ELIGIBLE_MOVE', region: { not: null } },
        });

        const simulationResults = [];

        for (const { region } of regionsAgg) {
            const currentRegion = region!;

            // Sum EARN entries for this region in the given month range
            const earnAgg = await (this.prisma as any).walletLedger.aggregate({
                where: {
                    type: 'EARN',
                    region: currentRegion,
                    createdAt: { gte: startDate, lt: endDate }
                },
                _sum: { amount: true },
            });

            // Use manual override if provided, else use real DB revenue
            const regionalRevenue = globalEstimatedRevenue !== undefined && globalEstimatedRevenue > 0
                ? globalEstimatedRevenue
                : Number(earnAgg?._sum?.amount ?? 0);
            const rewardPool = regionalRevenue * 0.20; // 20% cap per PRD

            const credits = await (this.prisma as any).walletLedger.groupBy({
                by: ['userId'],
                where: { type: 'ELIGIBLE_MOVE', region: currentRegion },
                _sum: { amount: true },
            });
            const debits = await (this.prisma as any).walletLedger.groupBy({
                by: ['userId'],
                where: { type: 'PAYOUT', region: currentRegion },
                _sum: { amount: true },
            });

            const debitMap = new Map(debits.map((d: any) => [d.userId, Number(d?._sum?.amount ?? 0)]));

            const balances = credits
                .map((c: any) => ({
                    userId: c.userId,
                    eligibleBalance: Number(c?._sum?.amount ?? 0) - Number(debitMap.get(c.userId) ?? 0),
                }))
                .filter((b: any) => b.eligibleBalance > 0);

            const totalEligibleBalance = balances.reduce((acc: number, b: any) => acc + b.eligibleBalance, 0);
            const distributionRatio = totalEligibleBalance > rewardPool && totalEligibleBalance > 0
                ? rewardPool / totalEligibleBalance
                : 1;

            const simulatedPayouts = balances.map((b: any) => ({
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
            regions: simulationResults, // Regional breakdown
        };
    }

    /**
     * REAL payout — writes PAYOUT ledger entries and records a PayoutBatch PER REGION.
     * Called by the cron on the 28th or manually via admin trigger.
     */
    async processPayout(month: string) {
        this.logger.log(`📤 Processing payout batches for ${month}`);

        // Parse month (e.g. "2024-10") into range
        const [year, m] = month.split('-').map(Number);
        const startDate = new Date(year, m - 1, 1);
        const endDate = new Date(year, m, 1);

        // Get verified (KYC-approved) users only
        const verifiedUsers = await (this.prisma as any).user.findMany({
            where: { kycStatus: 'APPROVED', isVerified: true, tier: { in: ['SILVER', 'GOLD'] } },
            select: { id: true, billingCountry: true, email: true },
        });
        const verifiedIds = verifiedUsers.map((u: any) => u.id);

        if (verifiedIds.length === 0) {
            this.logger.warn('No verified eligible users found for payout.');
            return { message: 'No eligible verified users found', month, totalPaid: 0 };
        }

        // Find distinct regions
        const regionsAgg = await (this.prisma as any).walletLedger.groupBy({
            by: ['region'],
            where: { type: 'ELIGIBLE_MOVE', userId: { in: verifiedIds }, region: { not: null } },
        });

        const batchResults = [];
        let totalGlobalPaid = 0;

        for (const { region } of regionsAgg) {
            const currentRegion = region!;
            this.logger.log(`🌍 Processing Region: ${currentRegion}`);

            // Sum EARN entries for this region in the given month range
            const earnAgg = await (this.prisma as any).walletLedger.aggregate({
                where: {
                    type: 'EARN',
                    region: currentRegion,
                    createdAt: { gte: startDate, lt: endDate }
                },
                _sum: { amount: true },
            });
            const regionalRevenue = Number(earnAgg?._sum?.amount ?? 0);
            const rewardPool = regionalRevenue * 0.20;

            const credits = await (this.prisma as any).walletLedger.groupBy({
                by: ['userId'],
                where: { type: 'ELIGIBLE_MOVE', userId: { in: verifiedIds }, region: currentRegion },
                _sum: { amount: true },
            });
            const debits = await (this.prisma as any).walletLedger.groupBy({
                by: ['userId'],
                where: { type: 'PAYOUT', userId: { in: verifiedIds }, region: currentRegion },
                _sum: { amount: true },
            });

            const debitMap = new Map(debits.map((d: any) => [d.userId, Number(d?._sum?.amount ?? 0)]));

            const balances = credits
                .map((c: any) => ({
                    userId: c.userId,
                    eligibleBalance: Number(c?._sum?.amount ?? 0) - Number(debitMap.get(c.userId) ?? 0),
                }))
                .filter((b: any) => b.eligibleBalance > 0);

            if (balances.length === 0) {
                this.logger.log(`Skipping region ${currentRegion}: No eligible balances`);
                continue;
            }

            const totalEligibleBalance = balances.reduce((acc: number, b: any) => acc + b.eligibleBalance, 0);
            const distributionRatio = totalEligibleBalance > rewardPool && totalEligibleBalance > 0
                ? rewardPool / totalEligibleBalance
                : 1;

            let regionalTotalPaid = 0;
            const batchRef = `BATCH-${currentRegion}-${month}-${Date.now()}`;

            // Write payout ledger entries in a transaction
            await this.prisma.$transaction(async (tx) => {
                for (const { userId, eligibleBalance } of balances) {
                    const payAmount = parseFloat((eligibleBalance * distributionRatio).toFixed(2));
                    if (payAmount <= 0) continue;

                    regionalTotalPaid += payAmount;

                    await (tx as any).walletLedger.create({
                        data: {
                            userId,
                            type: 'PAYOUT',
                            amount: new Prisma.Decimal(-payAmount),  // debit
                            reference: batchRef,
                            region: currentRegion,
                            exchangeRate: 1600.0 // Transparency: rate used for this transfer
                        },
                    });

                    // Trigger physical disbursement
                    try {
                        await this.disburseFunds(userId, payAmount, currentRegion);
                        
                        // Send email confirmation
                        const user = verifiedUsers.find((u: any) => u.id === userId);
                        if (user && user.email) {
                            this.notificationsService.sendPayoutConfirmation(user.email, payAmount, month)
                                .catch(e => this.logger.warn(`Failed to send payout email to ${user.email}: ${e.message}`));
                        }
                    } catch (disbursementError) {
                        this.logger.error(`❌ Disbursement failed for user ${userId}: ${disbursementError.message}`);
                        // We continue with other users even if one fails
                    }
                }
            });

            // Record the batch per region
            const batch = await (this.prisma as any).payoutBatch.create({
                data: {
                    month,
                    region: currentRegion,
                    totalLiability: new Prisma.Decimal(totalEligibleBalance),
                    totalPaid: new Prisma.Decimal(regionalTotalPaid),
                    exchangeRate: 1600.0, // Fixed rate for the month as per PRD locked-rate strategy
                    status: 'COMPLETED',
                },
            });

            totalGlobalPaid += regionalTotalPaid;

            // Send push notifications to all users who received a payout in this batch
            const userIds = balances.map((b: any) => b.userId);
            if (userIds.length > 0) {
                this.notificationsService.sendPushToMany(
                    userIds,
                    'Payout Sent! 🎉',
                    `Your rewards for ${month} have been disbursed to your bank account. Check your app for details.`,
                    { type: 'PAYOUT_SENT', month }
                ).catch(e => this.logger.warn(`Failed to send batch push for payout: ${e.message}`));
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

    /**
     * Cron job — runs at 00:00 on the 28th of every month automatically.
     */
    @Cron('0 0 28 * *')
    async handleMonthlyPayout() {
        // Only run cron on the web main instance to push jobs. 
        // The worker will consume them via PayoutsProcessor.
        if (process.env.IS_WORKER === 'true') return;

        const now = new Date();
        const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        if (!this.payoutsQueue) {
            this.logger.warn('Bull queues disabled; skipping adding payout job to queue.');
            return;
        }

        this.logger.log(`⏰ Cron: Adding payout processing job to queue for ${month}`);
        await this.payoutsQueue.add('process-payout', { month });
    }

    /**
     * Physically sends money via Paystack Transfer API.
     * Maps bank name to code, creates recipient, and triggers transfer.
     */
    async disburseFunds(userId: string, amount: number, region: string) {
        const user = await (this.prisma as any).user.findUnique({ where: { id: userId } });
        if (!user || !user.payoutAccount) {
            throw new Error(`User ${userId} has no payout account configured`);
        }

        const payoutInfo = user.payoutAccount as any;
        let recipientCode = payoutInfo.recipientCode;

        // 1. Create recipient if it doesn't exist
        if (!recipientCode) {
            const bankCode = resolveBankCode(payoutInfo.bankName);
            if (!bankCode) {
                throw new Error(`Could not resolve bank code for: ${payoutInfo.bankName}`);
            }

            // Fetch currency from regional pricing
            const pricing = await (this.prisma as any).countryPricing.findUnique({
                where: { countryCode: region }
            });
            const currency = pricing?.currency || 'NGN';

            const recipientData = await paystackRequest('/transferrecipient', 'POST', {
                type: 'nuban',
                name: user.name || 'Setorial Student',
                account_number: payoutInfo.accountNumber,
                bank_code: bankCode,
                currency: currency,
            });

            recipientCode = recipientData.data.recipient_code;

            // Save for future use
            await (this.prisma as any).user.update({
                where: { id: userId },
                data: {
                    payoutAccount: {
                        ...payoutInfo,
                        recipientCode,
                    },
                },
            });
        }

        // 2. Initiate Transfer
        // Amount must be in kobo (base unit)
        const amountInKobo = Math.round(amount * 100);

        const transferData = await paystackRequest('/transfer', 'POST', {
            source: 'balance',
            amount: amountInKobo,
            recipient: recipientCode,
            reason: `Setorial Rewards - ${region}`,
        });

        return transferData;
    }
}
