import { PrismaService } from '../prisma.service';
import { Queue } from 'bullmq';
export declare class AiContentService {
    private prisma;
    private aiQueue;
    private readonly logger;
    private readonly deepseekKey;
    constructor(prisma: PrismaService, aiQueue: Queue);
    queueFullSyllabusGeneration(subjectId: string, numTopics: number, userRole?: string): Promise<{
        message: string;
    }>;
    generateLevelsForTopic(subjectId: string, topicName: string, numLevels?: number, userRole?: string): Promise<{
        topic: {
            id: string;
            name: string;
            isApproved: boolean;
            createdAt: Date;
            updatedAt: Date;
            subjectId: string;
        };
        levels: ({
            questions: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                mockExamId: string | null;
                lessonId: string | null;
                options: import("@prisma/client/runtime/client").JsonValue;
                text: string;
                correctOption: number;
                explanation: string | null;
            }[];
        } & {
            id: string;
            name: string;
            isApproved: boolean;
            createdAt: Date;
            updatedAt: Date;
            content: string | null;
            videoUrl: string | null;
            order: number;
            rewardPoints: number;
            topicId: string;
        })[];
    }>;
    private generateLessonContent;
    regenerateLesson(lessonId: string, userRole?: string): Promise<{
        questions: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            mockExamId: string | null;
            lessonId: string | null;
            options: import("@prisma/client/runtime/client").JsonValue;
            text: string;
            correctOption: number;
            explanation: string | null;
        }[];
    } & {
        id: string;
        name: string;
        isApproved: boolean;
        createdAt: Date;
        updatedAt: Date;
        content: string | null;
        videoUrl: string | null;
        order: number;
        rewardPoints: number;
        topicId: string;
    }>;
    generateMockExam(subjectId: string, title: string, numQuestions?: number, userRole?: string): Promise<any>;
    generateFullSyllabus(subjectId: string, numTopics?: number, userRole?: string): Promise<{
        subject: {
            id: string;
            name: string;
            isApproved: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
        topics: {
            topic: {
                id: string;
                name: string;
                isApproved: boolean;
                createdAt: Date;
                updatedAt: Date;
                subjectId: string;
            };
            levels: ({
                questions: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    mockExamId: string | null;
                    lessonId: string | null;
                    options: import("@prisma/client/runtime/client").JsonValue;
                    text: string;
                    correctOption: number;
                    explanation: string | null;
                }[];
            } & {
                id: string;
                name: string;
                isApproved: boolean;
                createdAt: Date;
                updatedAt: Date;
                content: string | null;
                videoUrl: string | null;
                order: number;
                rewardPoints: number;
                topicId: string;
            })[];
        }[];
    }>;
    private executeGeneration;
}
