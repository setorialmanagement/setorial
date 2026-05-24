import { IsString, IsNotEmpty, IsArray, IsNumber, IsOptional } from 'class-validator';

export class CreateSubjectDto {
    @IsString()
    @IsNotEmpty()
    name: string;
}

export class CreateTopicDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsNumber()
    order?: number;

    @IsString()
    @IsNotEmpty()
    subjectId: string;
}

export class CreateQuestionDto {
    @IsString()
    @IsNotEmpty()
    text: string;

    @IsArray()
    options: string[];

    @IsNumber()
    correctOption: number;
}

export class CreateLessonDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    topicId: string;

    @IsOptional()
    @IsString()
    content?: string;

    @IsOptional()
    @IsString()
    videoUrl?: string;

    @IsOptional()
    @IsNumber()
    order?: number;

    @IsOptional()
    @IsNumber()
    rewardPoints?: number;

    @IsArray()
    questions: CreateQuestionDto[];
}

export class SubmitLessonDto {
    @IsString()
    @IsNotEmpty()
    lessonId: string;

    @IsArray()
    answers: number[];
}

export class GenerateAiLevelsDto {
    @IsString()
    @IsNotEmpty()
    subjectId: string;

    @IsString()
    @IsNotEmpty()
    topicName: string;

    @IsNumber()
    numLevels: number;
}
