import { haptics, NotificationFeedbackType, ImpactFeedbackStyle } from './haptics';
import { playSound } from './audio';

/**
 * Unified feedback orchestrator — combines haptics + audio for game-like events.
 * Inspired by Duolingo's feedback patterns.
 *
 * Usage:
 *   feedback.correctAnswer()   — on correct MCQ selection
 *   feedback.wrongAnswer()     — on incorrect MCQ selection
 *   feedback.victory()         — quiz/mock passed
 *   feedback.tryAgain()        — quiz/mock failed
 *   feedback.optionSelect()    — tapping an option (haptic + soft pop)
 *   feedback.streakCelebration() — streak milestone reached
 *   feedback.levelUp()         — level/lesson completed
 *   feedback.starEarned()      — badge/achievement unlocked
 *   feedback.warning()         — anti-cheat warning
 */
export const feedback = {
    /** Correct answer — cheerful ding + success haptic */
    correctAnswer: () => {
        haptics.notificationAsync(NotificationFeedbackType.Success);
        playSound('correct');
    },

    /** Wrong answer — gentle womp + error haptic */
    wrongAnswer: () => {
        haptics.notificationAsync(NotificationFeedbackType.Error);
        playSound('incorrect');
    },

    /** Quiz/Mock passed — sparkly triumph + success haptic */
    victory: () => {
        haptics.notificationAsync(NotificationFeedbackType.Success);
        playSound('victory');
    },

    /** Quiz/Mock failed — soft swoosh + medium impact */
    tryAgain: () => {
        haptics.impactAsync(ImpactFeedbackStyle.Medium);
        playSound('complete');
    },

    /** Tapping an option — light pop + selection haptic */
    optionSelect: () => {
        haptics.selectionAsync();
        playSound('pop');
    },

    /** Anti-cheat warning — warning haptic only */
    warning: () => {
        haptics.notificationAsync(NotificationFeedbackType.Warning);
    },

    /** Streak milestone reached — heavy impact + victory sound */
    streakCelebration: () => {
        haptics.impactAsync(ImpactFeedbackStyle.Heavy);
        playSound('victory');
    },

    /** Level/lesson completed — success haptic + complete sound */
    levelUp: () => {
        haptics.notificationAsync(NotificationFeedbackType.Success);
        playSound('complete');
    },

    /** Badge/achievement unlocked — success haptic + correct chime */
    starEarned: () => {
        haptics.notificationAsync(NotificationFeedbackType.Success);
        playSound('correct');
    },
};
