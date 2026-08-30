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
var AutomatedPayoutService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutomatedPayoutService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
let AutomatedPayoutService = AutomatedPayoutService_1 = class AutomatedPayoutService {
    payoutsQueue;
    logger = new common_1.Logger(AutomatedPayoutService_1.name);
    constructor(payoutsQueue) {
        this.payoutsQueue = payoutsQueue;
    }
    async triggerMonthlyPayout() {
        this.logger.log('Triggering automated monthly payout...');
        if (!this.payoutsQueue) {
            this.logger.warn('Bull queues disabled; skipping automated payout job.');
            return;
        }
        const month = new Date().toISOString().slice(0, 7);
        const estimatedRevenue = 1000000;
        await this.payoutsQueue.add('process-payouts', { month, estimatedRevenue }, {
            removeOnComplete: true,
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
        });
    }
};
exports.AutomatedPayoutService = AutomatedPayoutService;
__decorate([
    (0, schedule_1.Cron)('0 0 28 * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AutomatedPayoutService.prototype, "triggerMonthlyPayout", null);
exports.AutomatedPayoutService = AutomatedPayoutService = AutomatedPayoutService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __param(0, (0, bullmq_1.InjectQueue)('payouts')),
    __metadata("design:paramtypes", [bullmq_2.Queue])
], AutomatedPayoutService);
//# sourceMappingURL=automated-payout.service.js.map