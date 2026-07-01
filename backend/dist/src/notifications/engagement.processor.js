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
var EngagementProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngagementProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const prisma_service_1 = require("../prisma.service");
const notifications_service_1 = require("./notifications.service");
const common_1 = require("@nestjs/common");
let EngagementProcessor = EngagementProcessor_1 = class EngagementProcessor extends bullmq_1.WorkerHost {
    prisma;
    notificationsService;
    logger = new common_1.Logger(EngagementProcessor_1.name);
    constructor(prisma, notificationsService) {
        super();
        this.prisma = prisma;
        this.notificationsService = notificationsService;
    }
    async process(job) {
        const { userId } = job.data;
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const progressToday = await this.prisma.userProgress.findFirst({
            where: {
                userId,
                completedAt: { gte: startOfDay }
            }
        });
        const mockToday = await this.prisma.mockAttempt.findFirst({
            where: {
                userId,
                startedAt: { gte: startOfDay }
            }
        });
        const hasStudied = !!progressToday || !!mockToday;
        let title = '';
        let body = '';
        if (hasStudied) {
            const positiveMessages = [
                { t: "Bravo! 🎉", b: "I'm proud of you for studying today! Keep the streak alive!" },
                { t: "Great job today! ⭐", b: "You're one step closer to your goals. See you tomorrow!" },
                { t: "Awesome work! 🔥", b: "You smashed it today. Consistency is key!" }
            ];
            const msg = positiveMessages[Math.floor(Math.random() * positiveMessages.length)];
            title = msg.t;
            body = msg.b;
        }
        else {
            const negativeMessages = [
                { t: "Are you seriously going to leave me today? 😢", b: "There is still time to study! Come on!" },
                { t: "Don't break your streak! ⏳", b: "Just 5 minutes of study is better than zero. Let's go!" },
                { t: "We miss you! 🥺", b: "You haven't practiced today. Your exams are waiting!" },
                { t: "Time is ticking! ⏰", b: "Don't let today slip by without a quick study session." }
            ];
            const msg = negativeMessages[Math.floor(Math.random() * negativeMessages.length)];
            title = msg.t;
            body = msg.b;
        }
        await this.notificationsService.sendPush(userId, title, body, { type: 'engagement' });
        this.logger.debug(`Sent engagement push to user ${userId} - studied: ${hasStudied}`);
    }
};
exports.EngagementProcessor = EngagementProcessor;
exports.EngagementProcessor = EngagementProcessor = EngagementProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('engagement-push'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], EngagementProcessor);
//# sourceMappingURL=engagement.processor.js.map