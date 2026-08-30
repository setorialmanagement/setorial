"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayoutsModule = void 0;
const common_1 = require("@nestjs/common");
const payouts_service_1 = require("./payouts.service");
const prisma_module_1 = require("../prisma.module");
const bullmq_1 = require("@nestjs/bullmq");
const payouts_processor_1 = require("./payouts.processor");
let PayoutsModule = class PayoutsModule {
};
exports.PayoutsModule = PayoutsModule;
exports.PayoutsModule = PayoutsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            ...(process.env.DISABLE_BULL === 'true' ? [] : [
                bullmq_1.BullModule.registerQueue({ name: 'payouts' })
            ])
        ],
        providers: [payouts_service_1.PayoutsService, payouts_processor_1.PayoutsProcessor],
        exports: [payouts_service_1.PayoutsService],
    })
], PayoutsModule);
//# sourceMappingURL=payouts.module.js.map