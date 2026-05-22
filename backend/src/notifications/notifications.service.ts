import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma.service';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);
    private readonly QUEUE_TIMEOUT_MS = 5000; // 5 second timeout for queue operations
    
    constructor(
        private prisma: PrismaService,
        @InjectQueue('notifications') private readonly notificationsQueue: Queue
    ) {}

    /**
     * Helper to add jobs to queue with timeout and error handling
     */
    private async queueJobWithTimeout(jobName: string, jobData: any): Promise<void> {
        try {
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error(`Queue timeout after ${this.QUEUE_TIMEOUT_MS}ms`)), this.QUEUE_TIMEOUT_MS)
            );
            await Promise.race([
                this.notificationsQueue.add(jobName, jobData),
                timeoutPromise
            ]);
        } catch (err: any) {
            this.logger.error(`Failed to queue ${jobName}: ${err.message}`);
            // Don't throw - we want this to fail gracefully without blocking the request
        }
    }

    /**
     * Sends a push notification to a specific user.
     */
    async sendPush(userId: string, title: string, body: string, data: Record<string, any> = {}) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { expoPushToken: true },
        });

        if (!user?.expoPushToken) {
            this.logger.debug(`User ${userId} has no push token, skipping.`);
            return;
        }

        await this.notificationsQueue.add('push', {
            tokens: [user.expoPushToken],
            title,
            body,
            payload: data,
        });
    }

    /**
     * Sends a push notification to multiple users.
     */
    async sendPushToMany(userIds: string[], title: string, body: string, data: Record<string, any> = {}) {
        const users = await this.prisma.user.findMany({
            where: { id: { in: userIds }, expoPushToken: { not: null } },
            select: { expoPushToken: true },
        });

        const tokens = users.map(u => u.expoPushToken!).filter(t => !!t);
        if (tokens.length === 0) return;

        await this.notificationsQueue.add('push', {
            tokens,
            title,
            body,
            payload: data,
        });
    }

    /**
     * @deprecated Use queue instead. Internal helper to call Expo Push API.
     */
    private async sendToTokens(tokens: string[], title: string, body: string, data: Record<string, any> = {}) {
        // ... replaced by processor
    }

    // ─── EMAIL INTEGRATION (RESEND) ──────────────────────────────────────────

    /**
     * Standardized HTML Wrapper for Setorial emails.
     */
    private generateSetorialHtml(title: string, messageHtml: string) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title}</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <style>
                body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; -webkit-font-smoothing: antialiased; }
            </style>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; text-align: center;">
            <div style="background-color: #f9fafb; padding: 48px 20px;">
                <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04); text-align: left; border: 1px solid #f3f4f6;">
                    
                    <!-- Header -->
                    <div style="padding: 32px 40px 24px 40px;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                                <td style="vertical-align: middle;">
                                    <img src="https://pub-2adf18353cc14bf899bf2827efdfec49.r2.dev/public/logo.png" alt="Setorial Logo" width="28" height="28" style="display: inline-block; vertical-align: middle; margin-right: 10px; border-radius: 6px;" />
                                    <span style="font-size: 20px; font-weight: 800; color: #111827; letter-spacing: -0.5px; vertical-align: middle;">setorial</span>
                                </td>
                            </tr>
                        </table>
                    </div>

                    <!-- Divider -->
                    <div style="margin: 0 40px; border-top: 1px solid #f3f4f6;"></div>

                    <!-- Content -->
                    <div style="padding: 32px 40px 40px 40px;">
                        <div style="color: #374151; font-size: 15px; line-height: 1.6;">
                            ${messageHtml}
                        </div>
                    </div>
                </div>

                <!-- Footer Outside Card -->
                <div style="max-width: 560px; margin: 24px auto 0 auto; text-align: left; color: #6b7280; font-size: 12px; line-height: 1.5;">
                    <p style="margin: 0 0 8px 0;">If you believe you are getting this email in error or want to close your Setorial account, please visit our <a href="#" style="color: #10b981; text-decoration: none;">support site</a>.</p>
                    <p style="margin: 0;">© ${new Date().getFullYear()} Setorial Platform. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    async sendOtpEmail(email: string, otpCode: string, name: string = 'Student') {
        const title = 'Your Setorial verification code';
        const formattedCode = otpCode.length === 6 ? `${otpCode.slice(0, 3)} ${otpCode.slice(3)}` : otpCode;
        
        const content = `
            <p style="margin-top: 0; color: #374151;">Your Setorial verification code is:</p>
            <div style="background-color: #ebfef0; border-radius: 6px; padding: 16px; text-align: center; margin: 24px 0;">
                <span style="font-size: 32px; font-weight: 600; color: #065f46; letter-spacing: 4px;">${formattedCode}</span>
            </div>
            <p style="color: #374151;">This code will expire in 15 minutes and can only be used once. Never share this code with anyone.</p>
        `;

        await this.queueJobWithTimeout('email', {
            to: email,
            subject: title,
            html: this.generateSetorialHtml(title, content)
        });
    }

    async sendPasswordResetEmail(email: string, otpCode: string, name: string = 'Student') {
        const title = 'Reset Your Password';
        const formattedCode = otpCode.length === 6 ? `${otpCode.slice(0, 3)} ${otpCode.slice(3)}` : otpCode;
        
        const content = `
            <p style="margin-top: 0; color: #374151;">Your Setorial password reset code is:</p>
            <div style="background-color: #ebfef0; border-radius: 6px; padding: 16px; text-align: center; margin: 24px 0;">
                <span style="font-size: 32px; font-weight: 600; color: #065f46; letter-spacing: 4px;">${formattedCode}</span>
            </div>
            <p style="color: #374151;">If you didn't request this, you can safely ignore this email.</p>
            <p style="color: #374151;">This code will expire in 15 minutes and can only be used once.</p>
        `;

        await this.queueJobWithTimeout('email', {
            to: email,
            subject: title,
            html: this.generateSetorialHtml(title, content)
        });
    }

    async sendWelcomeEmail(email: string, name: string) {
        const title = 'Welcome to Setorial! 🎉';
        const content = `
            <h2 style="color: #111827; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 24px;">Welcome to Setorial! 🎉</h2>
            <p>Hey ${name},</p>
            <p>We are thrilled to have you onboard! Setorial is designed to make your learning journey profitable and engaging.</p>
            <p><b>What's next?</b></p>
            <ul style="padding-left: 20px; color: #374151;">
                <li style="margin-bottom: 8px;">Navigate to your Learning Path to start earning Points.</li>
                <li style="margin-bottom: 8px;">Subscribe to Silver or Gold to unlock Monetization.</li>
                <li style="margin-bottom: 8px;">Verify your KYC to accept payouts globally.</li>
            </ul>
            <p>Happy studying!</p>
        `;

        await this.queueJobWithTimeout('email', {
            to: email,
            subject: title,
            html: this.generateSetorialHtml(title, content)
        });
    }

    async sendPayoutConfirmation(email: string, amount: number, month: string) {
        const title = 'Your Payout is on the way! 💸';
        const content = `
            <h2 style="color: #111827; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 24px;">Your Payout is on the way! 💸</h2>
            <p>Awesome news!</p>
            <p>Your learning rewards for <b>${month}</b> have been processed. We've initiated a transfer of <b>₦${amount.toLocaleString()}</b> to your configured bank account.</p>
            <p>Keep studying and acing those mock exams to increase your rank next month!</p>
        `;

        await this.queueJobWithTimeout('email', {
            to: email,
            subject: 'Setorial Reward Payout Processing',
            html: this.generateSetorialHtml(title, content)
        });
    }

    async sendBroadcastEmail(emails: string[], subject: string, htmlMessage: string) {
        const title = subject;
        const html = this.generateSetorialHtml(title, htmlMessage);

        const chunks = [];
        for (let i = 0; i < emails.length; i += 50) {
            chunks.push(emails.slice(i, i + 50));
        }

        for (const chunk of chunks) {
            const batchPayload = chunk.map(email => ({
                from: process.env.EMAIL_FROM_ADDRESS || 'Setorial <onboarding@resend.dev>',
                to: email,
                subject,
                html
            }));
            await this.queueJobWithTimeout('email-batch', { batch: batchPayload });
        }
    }

    async sendSupportEmail(userEmail: string, message: string) {
        const title = 'New Support Request from App';
        const content = `
            <p><b>From:</b> ${userEmail}</p>
            <hr />
            <p>${message.replace(/\n/g, '<br/>')}</p>
        `;

        await this.queueJobWithTimeout('email', {
            to: 'setorialapp@gmail.com',
            replyTo: userEmail,
            subject: `Support Request [${userEmail}]`,
            html: this.generateSetorialHtml(title, content)
        });
    }
}
