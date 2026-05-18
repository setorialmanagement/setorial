import { Controller, Get, Post, Body, Param, UseGuards, Request, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { MockExamsService } from './mock-exams.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('mocks')
@UseGuards(JwtAuthGuard)
export class MockExamsController {
    constructor(private readonly mockService: MockExamsService) { }

    @Get()
    getAvailableMocks(@Request() req: any) {
        return this.mockService.getAvailableMocks(req.user.userId, req.user.role);
    }

    @Get(':id')
    getMockDetails(@Param('id') id: string) {
        return this.mockService.getMockDetails(id);
    }

    @Post(':id/start')
    startMock(@Request() req: any, @Param('id') id: string) {
        return this.mockService.startMock(req.user.userId, id);
    }

    @Post(':id/submit')
    submitMock(
        @Request() req: any,
        @Param('id') id: string,
        @Body() body: { answers: number[], tabSwitches: number }
    ) {
        return this.mockService.submitMock(req.user.userId, id, body.answers, body.tabSwitches);
    }
}
