import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AiContentService } from './ai-content.service';
export declare class AiContentProcessor extends WorkerHost {
    private readonly aiService;
    private readonly logger;
    constructor(aiService: AiContentService);
    process(job: Job<any, any, string>): Promise<any>;
}
