/**
 * Lion Mood System
 * 
 * Determines which lion mascot icon to display based on the user's
 * app engagement, time of day, and performance metrics.
 * 
 * Mood Priority (highest to lowest):
 * 1. sleeping   — After 10 PM local time
 * 2. angry      — 2+ dismissed notifications
 * 3. crying     — Failed 3+ quizzes recently, or random inactive prompt
 * 4. freezing   — 2+ days since last app open
 * 5. sad        — 4+ days inactive OR recent low scores
 * 6. formal     — Exam season (July & August)
 * 7. happy      — Default / everything's fine
 */

export type LionMood = 
    | 'happy'
    | 'angry'
    | 'freezing'
    | 'crying'
    | 'sad'
    | 'sleeping'
    | 'formal';

export interface MoodContext {
    /** Number of notifications dismissed without action */
    dismissedNotifications?: number;
    /** Date the user last opened the app */
    lastAppOpen?: Date | string | null;
    /** Number of quizzes failed in the current session or recently */
    recentFailedQuizzes?: number;
    /** Last quiz score as a percentage (0-100) */
    lastQuizScore?: number | null;
    /** Override mood for specific screens (e.g., tutor always uses formal) */
    override?: LionMood;
}

/**
 * Checks if the current month is exam season (July or August)
 */
function isExamSeason(): boolean {
    const month = new Date().getMonth(); // 0-indexed
    return month === 6 || month === 7; // July = 6, August = 7
}

/**
 * Calculate days since a given date
 */
function daysSince(date: Date | string | null | undefined): number {
    if (!date) return 999; // Treat never-opened as very long time
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Get the current hour in local time (0-23)
 */
function currentHour(): number {
    return new Date().getHours();
}

/**
 * Determine the lion's current mood based on context
 */
export function getLionMood(context: MoodContext = {}): LionMood {
    // Allow explicit override
    if (context.override) return context.override;

    // 1. Sleeping — after 10 PM (22:00) or before 5 AM
    const hour = currentHour();
    if (hour >= 22 || hour < 5) {
        return 'sleeping';
    }

    // 2. Angry — 2+ dismissed notifications
    if ((context.dismissedNotifications ?? 0) >= 2) {
        return 'angry';
    }

    // 3. Crying — failed 3+ quizzes, or random inactive nudge
    if ((context.recentFailedQuizzes ?? 0) >= 3) {
        return 'crying';
    }

    // 4. Freezing — 2+ days since last app open
    const inactiveDays = daysSince(context.lastAppOpen);
    if (inactiveDays >= 2) {
        return 'freezing';
    }

    // 5. Sad — 4+ days inactive OR last quiz score below 40%
    if (inactiveDays >= 4) {
        return 'sad';
    }
    if (context.lastQuizScore !== null && context.lastQuizScore !== undefined && context.lastQuizScore < 40) {
        return 'sad';
    }

    // 6. Formal — Exam season (July & August)
    if (isExamSeason()) {
        return 'formal';
    }

    // 7. Default — Happy!
    return 'happy';
}

/**
 * Map lion moods to their image assets
 */
export const LION_IMAGES: Record<LionMood, any> = {
    happy: require('../assets/images/lions/happy.png'),
    angry: require('../assets/images/lions/angry.png'),
    freezing: require('../assets/images/lions/freezing.png'),
    crying: require('../assets/images/lions/crying.png'),
    sad: require('../assets/images/lions/sad.png'),
    sleeping: require('../assets/images/lions/sleeping.png'),
    formal: require('../assets/images/lions/formal.png'),
};

/**
 * Map mascot interaction states to lion moods
 * (used by the MascotInteraction component for backward compatibility)
 */
export function stateToMood(state: string): LionMood {
    const mapping: Record<string, LionMood> = {
        happy: 'happy',
        sad: 'sad',
        thinking: 'formal',
        pointing_down: 'happy',
        pointing_up: 'happy',
        pointing_left: 'happy',
        pointing_right: 'happy',
        angry: 'angry',
        crying: 'crying',
        freezing: 'freezing',
        sleeping: 'sleeping',
        formal: 'formal',
    };
    return mapping[state] || 'happy';
}
