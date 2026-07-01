import React, { useRef, useEffect } from 'react';
import { View, Text, SafeAreaView, StyleSheet, useColorScheme } from 'react-native';
import { RiveView, RiveViewRef, Fit, Alignment } from '@rive-app/react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeIn, SlideInDown, ZoomIn } from 'react-native-reanimated';
import { TactileButton } from '../components/TactileButton';
import { feedback } from '../lib/feedback';

export default function StreakCelebrationScreen() {
    const router = useRouter();
    const { streak } = useLocalSearchParams<{ streak: string }>();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const riveRef = useRef<RiveViewRef>(null);
    const streakCount = parseInt(streak || '1', 10);

    useEffect(() => {
        feedback.victory();
    }, []);

    // Milestone messages
    const getMessage = (count: number): string => {
        if (count >= 365) return "A WHOLE YEAR! You're legendary! 👑";
        if (count >= 100) return "TRIPLE DIGITS! Unstoppable! 🏆";
        if (count >= 30) return "A whole month! You're on fire! 🔥";
        if (count >= 14) return "Two weeks strong! Keep it up! 💪";
        if (count >= 7) return "One week streak! Amazing! ⭐";
        if (count >= 5) return "5 days! You're building a habit! 🎯";
        if (count >= 3) return "3 days in a row! Nice! 🎉";
        if (count >= 2) return "You're back! Keep it going! ✨";
        return "Great start! Come back tomorrow! 🌟";
    };

    const getAccentColor = (count: number): string => {
        if (count >= 30) return '#FF6B00'; // Deep orange
        if (count >= 14) return '#FF8C00'; // Dark orange
        if (count >= 7) return '#FF9600';  // Orange  
        if (count >= 3) return '#FFA726';  // Light orange
        return '#FFB74D'; // Pale orange
    };

    const accent = getAccentColor(streakCount);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0B0D12' : '#FFFFFF' }]}>  
            <View style={styles.content}>
                {/* Rive Streak Flame Animation */}
                <Animated.View entering={ZoomIn.delay(200).springify().damping(12)} style={styles.riveWrapper}>
                    <RiveView
                        ref={riveRef}
                        url={require('../assets/animations/streak.riv')}
                        fit={Fit.Contain}
                        alignment={Alignment.Center}
                        autoPlay
                        style={styles.riveView}
                    />
                </Animated.View>

                {/* Streak Count */}
                <Animated.View entering={SlideInDown.delay(400).springify().damping(14)} style={styles.countContainer}>
                    <Text style={[styles.countNumber, { color: accent }]}>
                        {streakCount}
                    </Text>
                    <Text style={[styles.countLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                        {streakCount === 1 ? 'day streak' : 'day streak'}
                    </Text>
                </Animated.View>

                {/* Message */}
                <Animated.View entering={FadeIn.delay(600)}>
                    <Text style={[styles.message, { color: isDark ? '#E2E8F0' : '#1E293B' }]}>
                        {getMessage(streakCount)}
                    </Text>
                </Animated.View>

                {/* Milestone badges for specific streaks */}
                {(streakCount === 7 || streakCount === 14 || streakCount === 30 || streakCount === 100 || streakCount === 365) && (
                    <Animated.View entering={ZoomIn.delay(800).springify()} style={[styles.milestoneBadge, { borderColor: accent + '40', backgroundColor: accent + '15' }]}>
                        <Text style={[styles.milestoneText, { color: accent }]}>
                            🏅 {streakCount}-Day Milestone Achieved!
                        </Text>
                    </Animated.View>
                )}
            </View>

            {/* Continue Button */}
            <Animated.View entering={SlideInDown.delay(800).springify().damping(15)} style={styles.buttonContainer}>
                <TactileButton
                    onPress={() => router.back()}
                    backgroundColor={accent}
                    shadowColor={accent + 'CC'}
                    depth={6}
                    contentClassName="py-5 items-center justify-center"
                >
                    <Text style={styles.buttonText}>CONTINUE</Text>
                </TactileButton>
            </Animated.View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    riveWrapper: {
        width: 220,
        height: 220,
        marginBottom: 16,
    },
    riveView: {
        width: '100%',
        height: '100%',
    },
    countContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    countNumber: {
        fontSize: 72,
        fontWeight: '900',
        letterSpacing: -2,
    },
    countLabel: {
        fontSize: 20,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 4,
        marginTop: -4,
    },
    message: {
        fontSize: 22,
        fontWeight: '800',
        textAlign: 'center',
        lineHeight: 32,
        marginBottom: 16,
    },
    milestoneBadge: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 100,
        borderWidth: 2,
        marginTop: 8,
    },
    milestoneText: {
        fontSize: 16,
        fontWeight: '800',
    },
    buttonContainer: {
        paddingHorizontal: 20,
        paddingBottom: 32,
    },
    buttonText: {
        color: '#FFFFFF',
        fontWeight: '900',
        fontSize: 17,
        letterSpacing: 3,
    },
});
