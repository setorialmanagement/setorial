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
var EngagementCronService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngagementCronService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma.service");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
let EngagementCronService = EngagementCronService_1 = class EngagementCronService {
    prisma;
    engagementQueue;
    logger = new common_1.Logger(EngagementCronService_1.name);
    constructor(prisma, engagementQueue) {
        this.prisma = prisma;
        this.engagementQueue = engagementQueue;
    }
    async scheduleEngagementPushes() {
        this.logger.log('Starting daily engagement push scheduling...');
        const users = await this.prisma.user.findMany({
            where: { expoPushToken: { not: null } },
            select: { id: true }
        });
        if (users.length === 0) {
            this.logger.log('No users with push tokens found.');
            return;
        }
        const maxDelayMs = 3 * 60 * 60 * 1000;
        let queuedCount = 0;
        for (const user of users) {
            const randomDelay = Math.floor(Math.random() * maxDelayMs);
            await this.engagementQueue.add('send-engagement', { userId: user.id }, { delay: randomDelay });
            queuedCount++;
        }
        this.logger.log(`Scheduled ${queuedCount} engagement pushes between 5 PM and 8 PM.`);
    }
};
exports.EngagementCronService = EngagementCronService;
__decorate([
    (0, schedule_1.Cron)('0 17 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EngagementCronService.prototype, "scheduleEngagementPushes", null);
exports.EngagementCronService = EngagementCronService = EngagementCronService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, bullmq_1.InjectQueue)('engagement-push')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        bullmq_2.Queue])
], EngagementCronService);
//# sourceMappingURL=engagement.cron.js.map