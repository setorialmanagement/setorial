import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    Easing,
    withSpring
} from 'react-native-reanimated';

interface ShiningProgressBarProps {
    progress: number; // 0 to 1
    color?: string;
    backgroundColor?: string;
    height?: number;
}

export const ShiningProgressBar: React.FC<ShiningProgressBarProps> = ({
    progress,
    color = '#58CC02',
    backgroundColor = '#E5E5E5',
    height = 16
}) => {
    const shinePosition = useSharedValue(-100);
    const animatedProgress = useSharedValue(0);

    useEffect(() => {
        // Shine animation loop
        shinePosition.value = withRepeat(
            withSequence(
                withTiming(Dimensions.get('window').width, {
                    duration: 1500,
                    easing: Easing.linear,
                }),
                withTiming(-100, { duration: 0 }) // Reset
            ),
            -1, // Infinite
            false
        );
    }, []);

    useEffect(() => {
        // Animate progress changes
        animatedProgress.value = withSpring(progress, {
            damping: 15,
            stiffness: 100
        });
    }, [progress]);

    const progressStyle = useAnimatedStyle(() => {
        return {
            width: `${animatedProgress.value * 100}%`,
        };
    });

    const shineStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: shinePosition.value }],
        };
    });

    return (
        <View style={[styles.container, { backgroundColor, height }]}>
            <Animated.View style={[styles.bar, { backgroundColor: color }, progressStyle]}>
                <View style={styles.highlight} />
                <Animated.View style={[styles.shineContainer, shineStyle]}>
                    <View style={styles.shine} />
                </Animated.View>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        borderRadius: 999,
        overflow: 'hidden',
    },
    bar: {
        height: '100%',
        borderRadius: 999,
        position: 'relative',
        overflow: 'hidden',
    },
    highlight: {
        position: 'absolute',
        top: 2,
        left: 4,
        right: 4,
        height: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 4,
    },
    shineContainer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 60,
        opacity: 0.5,
    },
    shine: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        transform: [{ skewX: '-20deg' }],
    }
});
