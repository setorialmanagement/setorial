import { Controller, Get, Param } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Controller('public')
export class PublicController {
    constructor(private prisma: PrismaService) {}

    @Get('configs/:key')
    async getConfig(@Param('key') key: string) {
        const SAFE_KEYS = ['mascot_mood_override', 'public_branding'];
        if (!SAFE_KEYS.includes(key)) {
            return { error: 'not_allowed' };
        }
        const cfg = await this.prisma.globalConfig.findUnique({ where: { key } });
        if (!cfg) return { key, value: null };
        return { key: cfg.key, value: cfg.value };
    }
}
