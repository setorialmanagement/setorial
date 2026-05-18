import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { AiContentService } from './ai-content.service';

@Processor('ai-content')
export class AiContentProcessor extends WorkerHost {
    private readonly logger = new Logger(AiContentProcessor.name);

    constructor(private readonly aiService: AiContentService) {
        super();
    }

    async process(job: Job<any, any, string>): Promise<any> {
        this.logger.log(`👷 Processing job ${job.id} of type ${job.name}...`);

        switch (job.name) {
            case 'generate-full-subject':
                const { subjectId, numTopics, userRole } = job.data;
                this.logger.log(`Wormhole Active: Building syllabus for subject ${subjectId} (${numTopics} topics)`);
                try {
                    const result = await this.aiService.generateFullSyllabus(subjectId, numTopics, userRole);
                    this.logger.log(`Wormhole Complete: Syllabus created for subject ${subjectId}`);
                    return result;
                } catch (err) {
                    this.logger.error(`Wormhole Failed: ${err.message}`);
                    throw err;
                }
                
            default:
                this.logger.warn(`Unknown job name: ${job.name}`);
        }
    }
}
