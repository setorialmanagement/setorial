import { LearningService } from './learning.service';
import { AiContentService } from './ai-content.service';
import { CreateSubjectDto, CreateTopicDto, CreateLessonDto, SubmitLessonDto, GenerateAiLevelsDto } from './dto/learning.dto';
export declare class LearningController {
    private readonly learningService;
    private readonly aiContentService;
    constructor(learningService: LearningService, aiContentService: AiContentService);
    generateAiLevels(dto: GenerateAiLevelsDto, req: any): Promise<{
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
    generateFullSubject(dto: {
        subjectId: string;
        numTopics: number;
    }, req: any): Promise<{
        message: string;
    }>;
    generateAiMock(dto: {
        subjectId: string;
        title: string;
        numQuestions?: number;
    }, req: any): Promise<any>;
    regenerateLesson(id: string, req: any): Promise<{
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
    createSubject(dto: CreateSubjectDto, req: any): Promise<{
        id: string;
        name: string;
        isApproved: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deleteSubject(id: string): Promise<{
        id: string;
        name: string;
        isApproved: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    createTopic(dto: CreateTopicDto, req: any): Promise<{
        id: string;
        name: string;
        isApproved: boolean;
        createdAt: Date;
        updatedAt: Date;
        subjectId: string;
    }>;
    updateTopic(id: string, dto: any): Promise<{
        id: string;
        name: string;
        isApproved: boolean;
        createdAt: Date;
        updatedAt: Date;
        subjectId: string;
    }>;
    deleteTopic(id: string): Promise<{
        id: string;
        name: string;
        isApproved: boolean;
        createdAt: Date;
        updatedAt: Date;
        subjectId: string;
    }>;
    search(query: string): Promise<({
        topics: {
            name: string;
            lessons: {
                name: string;
            }[];
        }[];
    } & {
        id: string;
        name: string;
        isApproved: boolean;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    getSubjects(req: any): Promise<({
        topics: ({
            lessons: {
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
            }[];
        } & {
            id: string;
            name: string;
            isApproved: boolean;
            createdAt: Date;
            updatedAt: Date;
            subjectId: string;
        })[];
    } & {
        id: string;
        name: string;
        isApproved: boolean;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    getSubject(id: string, req: any): Promise<{
        topics: {
            lessons: {
                status: string;
                score: number | null;
                _count: {
                    questions: number;
                };
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
            }[];
            id: string;
            name: string;
            isApproved: boolean;
            createdAt: Date;
            updatedAt: Date;
            subjectId: string;
        }[];
        id: string;
        name: string;
        isApproved: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getLesson(id: string, req: any): Promise<any>;
    createLesson(dto: CreateLessonDto, req: any): Promise<{
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
    submitLesson(req: any, dto: SubmitLessonDto): Promise<{
        score: number;
        total: number;
        breakdown: any[];
        pointsEarned: number;
        passed: boolean;
        isFirstCompletion: boolean;
    }>;
    updateLesson(id: string, dto: any, req: any, video?: Express.Multer.File): Promise<{
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
    approveSubject(id: string): Promise<{
        id: string;
        name: string;
        isApproved: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    approveTopic(id: string): Promise<{
        id: string;
        name: string;
        isApproved: boolean;
        createdAt: Date;
        updatedAt: Date;
        subjectId: string;
    }>;
    approveLesson(id: string): Promise<{
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
}
