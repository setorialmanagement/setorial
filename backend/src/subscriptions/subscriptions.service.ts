import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as crypto from 'crypto';

// Hardcoded prices are being phased out in favor of dynamic countryPricing table.

@Injectable()
export class SubscriptionsService {
    constructor(private prisma: PrismaService) { }

    async initializeTransaction(userId: string, tier: string, billingCycle: 'MONTHLY' | 'ANNUAL' = 'MONTHLY') {
        const secret = process.env.PAYSTACK_SECRET_KEY;
        if (!secret) throw new BadRequestException('Paystack not configured');

        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new BadRequestException('User not found');

        // Fetch dynamic pricing for user's country
        const countryCode = user.billingCountry || 'NG';
        const pricing = await (this.prisma as any).countryPricing.findUnique({
            where: { countryCode: countryCode.toUpperCase() },
        });

        if (!pricing) throw new BadRequestException('Pricing not found for your region');

        const tierKey = tier.toLowerCase(); // 'bronze', 'silver', 'gold'
        const cycleKey = billingCycle.toLowerCase(); // 'monthly', 'annual'

        let amountDecimal: any;
        if (tierKey === 'bronze') amountDecimal = cycleKey === 'annual' ? pricing.bronzeAnnual : pricing.bronzeMonthly;
        else if (tierKey === 'silver') amountDecimal = cycleKey === 'annual' ? pricing.silverAnnual : pricing.silverMonthly;
        else if (tierKey === 'gold') amountDecimal = cycleKey === 'annual' ? pricing.goldAnnual : pricing.goldMonthly;
        else throw new BadRequestException('Invalid tier');

        const amount = Math.round(Number(amountDecimal) * 100); // Convert to kobo

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
        if (!data.status) throw new BadRequestException(data.message || 'Payment initialization failed');

        return {
            authorization_url: data.data.authorization_url,
            access_code: data.data.access_code,
            reference: data.data.reference,
        };
    }

    async verifyTransaction(reference: string) {
        const secret = process.env.PAYSTACK_SECRET_KEY;
        if (!secret) throw new BadRequestException('Paystack not configured');

        const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: { 'Authorization': `Bearer ${secret}` },
        });

        const data = await response.json();
        if (!data.status || data.data.status !== 'success') {
            return { status: 'failed', message: 'Payment not verified' };
        }

        const metadata = data.data.metadata;
        const amount = data.data.amount; // In kobo
        const currency = data.data.currency || 'NGN';

        if (metadata?.userId && metadata?.tier) {
            await this._activateSubscription(
                metadata.userId,
                metadata.tier,
                metadata.billingCycle || 'MONTHLY',
                reference,
                amount,
                currency
            );
        }

        return { status: 'success', tier: metadata?.tier };
    }

    async handlePaystackWebhook(signature: string, payload: any) {
        const secret = process.env.PAYSTACK_SECRET_KEY;
        if (!secret) throw new BadRequestException('Paystack secret not configured');

        const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(payload)).digest('hex');

        if (hash !== signature) {
            throw new UnauthorizedException('Invalid Signature');
        }

        const event = payload.event;
        if (event === 'charge.success') {
            const data = payload.data;
            const metadata = data.metadata;
            
            if (metadata?.type === 'MOCK_EXAM' && metadata?.userId && metadata?.mockExamId) {
                // Handle Mock Exam Purchase (safety net if frontend verify fails)
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
            } else if (metadata?.userId && metadata?.tier) {
                // Handle Subscription
                await this._activateSubscription(
                    metadata.userId,
                    metadata.tier,
                    metadata.billingCycle || 'MONTHLY',
                    data.reference,
                    data.amount,
                    data.currency || 'NGN'
                );
            }
        }

        return { status: 'success' };
    }

    private async _activateSubscription(
        userId: string,
        tier: string,
        billingCycle: string,
        reference: string,
        amountKobo: number,
        currency: string
    ) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) return;

        // Calculate period end
        const now = new Date();
        const periodEnd = new Date(now);
        if (billingCycle === 'ANNUAL') {
            periodEnd.setFullYear(now.getFullYear() + 1);
        } else {
            periodEnd.setMonth(now.getMonth() + 1);
        }

        await this.prisma.$transaction([
            // Update User Tier
            this.prisma.user.update({
                where: { id: userId },
                data: { tier: tier as any },
            }),
            // Upsert Subscription Record
            (this.prisma as any).subscriptionRecord.upsert({
                where: { paystackReference: reference },
                update: {
                    status: 'ACTIVE',
                    currentPeriodStart: now,
                    currentPeriodEnd: periodEnd,
                },
                create: {
                    userId,
                    tier: tier as any,
                    billingCycle,
                    status: 'ACTIVE',
                    amountPaid: amountKobo / 100,
                    currency,
                    paystackReference: reference,
                    currentPeriodStart: now,
                    currentPeriodEnd: periodEnd,
                },
            }),
            // Log Revenue (EARN) - this feeds real data into payout system
            (this.prisma as any).walletLedger.create({
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
}
