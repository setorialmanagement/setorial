import { GamificationService } from './gamification.service';
export declare class GamificationController {
    private readonly gamificationService;
    constructor(gamificationService: GamificationService);
    getLeaderboard(limit: string, subjectId?: string): Promise<{
        id: string;
        points: any;
        name: string;
        avatarUrl: string | null;
    }[]>;
}
