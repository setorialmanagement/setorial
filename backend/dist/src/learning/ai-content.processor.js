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
var AiContentProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiContentProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const ai_content_service_1 = require("./ai-content.service");
let AiContentProcessor = AiContentProcessor_1 = class AiContentProcessor extends bullmq_1.WorkerHost {
    aiService;
    logger = new common_1.Logger(AiContentProcessor_1.name);
    constructor(aiService) {
        super();
        this.aiService = aiService;
    }
    async process(job) {
        this.logger.log(`👷 Processing job ${job.id} of type ${job.name}...`);
        switch (job.name) {
            case 'generate-full-subject':
                const { subjectId, numTopics, userRole } = job.data;
                this.logger.log(`Wormhole Active: Building syllabus for subject ${subjectId} (${numTopics} topics)`);
                try {
                    const result = await this.aiService.generateFullSyllabus(subjectId, numTopics, userRole);
                    this.logger.log(`Wormhole Complete: Syllabus created for subject ${subjectId}`);
                    return result;
                }
                catch (err) {
                    this.logger.error(`Wormhole Failed: ${err.message}`);
                    throw err;
                }
            default:
                this.logger.warn(`Unknown job name: ${job.name}`);
        }
    }
};
exports.AiContentProcessor = AiContentProcessor;
exports.AiContentProcessor = AiContentProcessor = AiContentProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('ai-content'),
    __metadata("design:paramtypes", [ai_content_service_1.AiContentService])
], AiContentProcessor);
//# sourceMappingURL=ai-content.processor.js.map