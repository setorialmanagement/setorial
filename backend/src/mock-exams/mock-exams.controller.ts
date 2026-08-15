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

    @Post('custom')
    createCustomMock(
        @Request() req: any,
        @Body() body: { subjectIds: string[], numQuestions: number, durationMinutes: number }
    ) {
        return this.mockService.generateCustomMock(
            req.user.userId,
            body.subjectIds,
            body.numQuestions,
            body.durationMinutes
        );
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

    @Post(':id/pay')
    initializePayment(@Request() req: any, @Param('id') id: string) {
        return this.mockService.initializePayment(req.user.userId, id);
    }

    @Post('verify-payment')
    verifyPayment(@Request() req: any, @Body() body: { reference: string }) {
        return this.mockService.verifyPayment(req.user.userId, body.reference);
    }
}
