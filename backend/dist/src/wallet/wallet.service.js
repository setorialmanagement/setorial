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
exports.WalletService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let WalletService = class WalletService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getBalanceData(userId) {
        const result = await this.prisma.walletLedger.aggregate({
            where: {
                userId,
                type: { not: 'EARN' }
            },
            _sum: { amount: true },
        });
        const balance = result._sum.amount ? Number(result._sum.amount) : 0;
        const lockedRateConfig = await this.prisma.globalConfig.findUnique({
            where: { key: 'LOCKED_EXCHANGE_RATE' }
        });
        const latestBatch = await this.prisma.payoutBatch.findFirst({
            where: { status: 'COMPLETED', exchangeRate: { not: null } },
            orderBy: { createdAt: 'desc' },
            select: { exchangeRate: true }
        });
        const exchangeRate = lockedRateConfig?.value
            ? parseFloat(lockedRateConfig.value)
            : (latestBatch?.exchangeRate || 1600.0);
        return {
            balance,
            exchangeRate
        };
    }
    async addTransaction(userId, type, amount, reference) {
        if (type === 'PAYOUT' && amount > 0) {
            amount = -amount;
        }
        return this.prisma.$transaction(async (tx) => {
            const entry = await tx.walletLedger.create({
                data: {
                    userId,
                    type,
                    amount,
                    reference,
                },
            });
            if (type === 'PAYOUT') {
                const result = await tx.walletLedger.aggregate({
                    where: {
                        userId,
                        type: { not: 'EARN' }
                    },
                    _sum: { amount: true },
                });
                const currentBalance = result._sum.amount ? Number(result._sum.amount) : 0;
                if (currentBalance < 0) {
                    throw new common_1.BadRequestException('Insufficient monetizable balance');
                }
            }
            return entry;
        });
    }
    async getTransactions(userId) {
        return this.prisma.walletLedger.findMany({
            where: {
                userId,
                type: { not: 'EARN' }
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
    }
    async deductBalance(userId, amount, reference) {
        return this.prisma.$transaction(async (tx) => {
            const result = await tx.walletLedger.aggregate({
                where: {
                    userId,
                    type: { not: 'EARN' }
                },
                _sum: { amount: true },
            });
            const currentBalance = result._sum.amount ? Number(result._sum.amount) : 0;
            if (currentBalance < amount) {
                return false;
            }
            await tx.walletLedger.create({
                data: {
                    userId,
                    type: 'ADJUSTMENT',
                    amount: -amount,
                    reference,
                },
            });
            return true;
        });
    }
};
exports.WalletService = WalletService;
exports.WalletService = WalletService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WalletService);
//# sourceMappingURL=wallet.service.js.map