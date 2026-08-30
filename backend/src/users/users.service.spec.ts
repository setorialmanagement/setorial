import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn().mockResolvedValue({
                id: 'user-1',
                email: 'student@example.com',
                name: 'Ada',
                tier: 'GOLD',
                createdAt: new Date('2024-01-01T00:00:00.000Z'),
                lastActiveAt: new Date('2024-01-10T00:00:00.000Z'),
                currentStreak: 7,
                longestStreak: 14,
                totalActiveDays: 20,
                isVerified: true,
                assessmentPassed: true,
                kycStatus: 'APPROVED',
                monetizationEligibleAt: new Date('2023-12-01T00:00:00.000Z'),
              }),
            },
            pointsLedger: {
              aggregate: jest.fn().mockResolvedValue({ _sum: { points: 2500 } }),
              groupBy: jest.fn().mockResolvedValue([{ userId: 'user-1', _sum: { points: 2500 } }]),
            },
            walletLedger: {
              aggregate: jest.fn()
                .mockResolvedValueOnce({ _sum: { amount: 130 } })
                .mockResolvedValueOnce({ _sum: { amount: 40 } })
                .mockResolvedValueOnce({ _sum: { amount: 66 } }),
            },
            userProgress: {
              count: jest.fn()
                .mockResolvedValueOnce(12)
                .mockResolvedValueOnce(4)
                .mockResolvedValueOnce(1),
              findFirst: jest.fn().mockResolvedValue({
                completedAt: new Date('2024-01-10T11:30:00.000Z'),
                lesson: { name: 'Algebra Basics' },
              }),
            },
            userPowerUp: {
              findMany: jest.fn().mockResolvedValue([
                { isActive: false },
                { isActive: true },
                { isActive: true },
              ]),
            },
            mockAttempt: {
              findMany: jest.fn().mockResolvedValue([
                { score: 80, completedAt: new Date('2024-01-08T00:00:00.000Z'), mockExam: { title: 'Math Trial' } },
                { score: 90, completedAt: new Date('2024-01-09T00:00:00.000Z'), mockExam: { title: 'Math Trial' } },
              ]),
            },
            userBadge: {
              findMany: jest.fn().mockResolvedValue([
                { awardedAt: new Date('2024-01-01T00:00:00.000Z'), badge: { name: '7-Day Streak', icon: 'Zap' } },
              ]),
            },
            userActivityLog: {
              aggregate: jest.fn().mockResolvedValue({ _sum: { timeSpent: 5400 } }),
              count: jest.fn().mockResolvedValue(12),
            },
            lesson: {
              count: jest.fn().mockResolvedValue(30),
            },
          },
        },
        {
          provide: HttpService,
          useValue: { get: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('computes per-user stats for the profile view', async () => {
    const stats = await service.getUserStats('user-1');

    expect(stats.tier).toBe('GOLD');
    expect(stats.currentStreak).toBe(7);
    expect(stats.longestStreak).toBe(14);
    expect(stats.lessonsCompleted.allTime).toBe(12);
    expect(stats.lessonsCompleted.thisWeek).toBe(4);
    expect(stats.lessonsCompleted.today).toBe(1);
    expect(stats.streakFreezes.used).toBe(1);
    expect(stats.streakFreezes.remaining).toBe(2);
    expect(stats.learnAndEarn.amountPayable).toBe(40);
    expect(stats.monetization.eligible).toBe(true);
    expect(stats.mockExamHistory.length).toBe(2);
    expect(stats.badges.length).toBe(1);
  });
});
