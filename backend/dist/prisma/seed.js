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
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const bcrypt = __importStar(require("bcrypt"));
const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    await prisma.subject.upsert({
        where: { name: 'Mathematics' },
        update: {},
        create: {
            name: 'Mathematics',
            topics: { create: [{ name: 'Algebra' }, { name: 'Calculus' }, { name: 'Geometry' }] },
        },
    });
    await prisma.subject.upsert({
        where: { name: 'English Language' },
        update: {},
        create: {
            name: 'English Language',
            topics: { create: [{ name: 'Grammar' }, { name: 'Literature' }, { name: 'Composition' }] },
        },
    });
    await prisma.subject.upsert({
        where: { name: 'Physics' },
        update: {},
        create: {
            name: 'Physics',
            topics: { create: [{ name: 'Mechanics' }, { name: 'Thermodynamics' }, { name: 'Optics' }] },
        },
    });
    console.log('Subjects seeded successfully');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@setorial.com' },
        update: {},
        create: {
            email: 'admin@setorial.com',
            password: hashedPassword,
            name: 'Setorial Admin',
            role: 'ADMIN',
            isVerified: true,
            isEmailVerified: true,
            tier: 'GOLD',
            kycStatus: 'APPROVED',
        },
    });
    console.log('Admin user seeded:', admin.email);
    const pricingData = [
        { countryCode: 'NG', countryName: 'Nigeria', economicTier: 'TIER_C', multiplier: 0.50, currency: 'NGN', bronzeMonthly: 3500, silverMonthly: 7500, goldMonthly: 15000, bronzeAnnual: 35000, silverAnnual: 75000, goldAnnual: 150000 },
        { countryCode: 'US', countryName: 'United States', economicTier: 'TIER_A', multiplier: 1.0, currency: 'USD', bronzeMonthly: 12, silverMonthly: 25, goldMonthly: 45, bronzeAnnual: 120, silverAnnual: 250, goldAnnual: 450 },
        { countryCode: 'GB', countryName: 'United Kingdom', economicTier: 'TIER_A', multiplier: 1.0, currency: 'GBP', bronzeMonthly: 10, silverMonthly: 20, goldMonthly: 38, bronzeAnnual: 100, silverAnnual: 200, goldAnnual: 380 },
        { countryCode: 'IN', countryName: 'India', economicTier: 'TIER_C', multiplier: 0.50, currency: 'INR', bronzeMonthly: 500, silverMonthly: 1100, goldMonthly: 2000, bronzeAnnual: 5000, silverAnnual: 11000, goldAnnual: 20000 },
        { countryCode: 'GH', countryName: 'Ghana', economicTier: 'TIER_D', multiplier: 0.35, currency: 'GHS', bronzeMonthly: 50, silverMonthly: 110, goldMonthly: 200, bronzeAnnual: 500, silverAnnual: 1100, goldAnnual: 2000 },
    ];
    for (const p of pricingData) {
        await prisma.countryPricing.upsert({
            where: { countryCode: p.countryCode },
            update: {},
            create: p,
        });
    }
    console.log('Country pricing seeded:', pricingData.length, 'countries');
    const powerUps = [
        { type: 'STREAK_FREEZE', name: 'Streak Freeze', description: 'Protect your streak for 1 day if you miss a lesson', icon: 'Shield', price: 200, durationDays: 1 },
        { type: 'DOUBLE_POINTS', name: '2x XP Boost', description: 'Double all points earned for 24 hours', icon: 'Zap', price: 500, durationDays: 1 },
    ];
    for (const p of powerUps) {
        await prisma.powerUp.upsert({ where: { type: p.type }, update: { ...p }, create: { ...p } });
    }
    console.log('Power-ups seeded:', powerUps.length);
    const badges = [
        { name: 'First Steps', description: 'Complete your first lesson', icon: 'Zap', color: '#3B82F6' },
        { name: 'Explorer', description: 'Complete 5 lessons', icon: 'BookOpen', color: '#8B5CF6' },
        { name: 'Century', description: 'Earn 100 XP', icon: 'Trophy', color: '#EAB308' },
        { name: 'On Fire', description: 'Maintain a 7-day streak', icon: 'Flame', color: '#EF4444' },
        { name: 'Unstoppable', description: 'Maintain a 30-day streak', icon: 'Target', color: '#F97316' },
        { name: 'Gold Standard', description: 'Reach Gold tier', icon: 'Crown', color: '#EAB308' },
        { name: 'Half Grand', description: 'Earn 500 XP', icon: 'Star', color: '#14B8A6' },
        { name: 'Perfect Score', description: 'Get 100% on a lesson', icon: 'Award', color: '#10B981' },
    ];
    for (const b of badges) {
        await prisma.badge.upsert({ where: { name: b.name }, update: { ...b }, create: { ...b } });
    }
    console.log('Badges seeded:', badges.length);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
});
//# sourceMappingURL=seed.js.map