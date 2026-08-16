import React, { useEffect } from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { 
    FadeIn, 
    SlideInDown, 
    ZoomIn,
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    withSpring,
    Easing,
} from 'react-native-reanimated';
import { TactileButton } from '../components/TactileButton';
import { feedback } from '../lib/feedback';
import LottieView from 'lottie-react-native';

export default function StreakCelebrationScreen() {
    const router = useRouter();
    const { streak } = useLocalSearchParams<{ streak: string }>();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
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
        if (count >= 30) return '#FF6B00';
        if (count >= 14) return '#FF8C00';
        if (count >= 7) return '#FF9600';
        if (count >= 3) return '#FFA726';
        return '#FFB74D';
    };

    const accent = getAccentColor(streakCount);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0B0D12' : '#FFFFFF' }]}>  
            <View style={styles.content}>
                {/* Animated Lottie Wrapper */}
                <Animated.View entering={ZoomIn.delay(200).duration(500).easing(Easing.out(Easing.cubic))} style={styles.lionWrapper}>

                    {/* Happy Lottie Animation */}
                    <LottieView
                        source={require('../assets/animations/Happy-mood.json')}
                        autoPlay
                        loop
                        style={styles.lionImage}
                        speed={1}
                    />
                </Animated.View>

                {/* Streak Count */}
                <Animated.View entering={SlideInDown.delay(400).duration(500).easing(Easing.out(Easing.cubic))} style={styles.countContainer}>
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

                {/* Milestone badges */}
                {(streakCount === 7 || streakCount === 14 || streakCount === 30 || streakCount === 100 || streakCount === 365) && (
                    <Animated.View entering={ZoomIn.delay(800).duration(500).easing(Easing.out(Easing.cubic))} style={[styles.milestoneBadge, { borderColor: accent + '40', backgroundColor: accent + '15' }]}>
                        <Text style={[styles.milestoneText, { color: accent }]}>
                            🏅 {streakCount}-Day Milestone Achieved!
                        </Text>
                    </Animated.View>
                )}
            </View>

            {/* Continue Button */}
            <Animated.View entering={SlideInDown.delay(800).duration(500).easing(Easing.out(Easing.cubic))} style={styles.buttonContainer}>
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
    lionWrapper: {
        width: 200,
        height: 200,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    fireContainer: {
        position: 'absolute',
        top: -20,
        right: -10,
        zIndex: 10,
    },
    fireEmoji: {
        fontSize: 48,
    },
    lionImage: {
        width: 160,
        height: 160,
        borderRadius: 28,
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
