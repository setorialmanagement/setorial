import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, Dimensions, View, Text, Platform } from 'react-native';
import Animated, { 
    FadeInUp, 
    useSharedValue, 
    useAnimatedStyle, 
    withTiming, 
    runOnJS 
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';

const { width, height } = Dimensions.get('window');
const MASCOT_SIZE = Math.round(width * 0.9);

interface AnimatedSplashProps {
    onFinish: () => void;
}

/**
 * Vibrant orange splash screen mirroring Duolingo's aesthetic.
 * Blends the background with the mascot's brand color.
 */
export default function AnimatedSplash({ onFinish }: AnimatedSplashProps) {
    const opacity = useSharedValue(1);
    const textOpacity = useSharedValue(0);
    const animationRef = useRef<LottieView>(null);

    const finishSplash = () => {
        opacity.value = withTiming(0, { duration: 800 }, (finished) => {
            if (finished) {
                runOnJS(onFinish)();
            }
        });
    };

    useEffect(() => {
        // Fade in the text after a small delay
        textOpacity.value = withTiming(1, { duration: 1000 });

        // Manual play trigger — autoPlay alone can fail on mount with New Architecture
        const playTimer = setTimeout(() => {
            animationRef.current?.play();
        }, 150);

        // Fallback timeout in case Lottie onAnimationFinish doesn't fire
        const fallbackTimer = setTimeout(() => {
            finishSplash();
        }, 5000); 

        return () => {
            clearTimeout(playTimer);
            clearTimeout(fallbackTimer);
        };
    }, []);

    const containerStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    const textStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value,
        transform: [{ translateY: withTiming(textOpacity.value === 1 ? 0 : 20) }]
    }));

    return (
        <Animated.View style={[styles.container, containerStyle]}>
            <View style={styles.content}>
                <LottieView
                    ref={animationRef}
                    autoPlay
                    loop={false}
                    source={require('../assets/animations/point_down.lottiejson')}
                    style={{ width: MASCOT_SIZE, height: MASCOT_SIZE, backgroundColor: 'transparent' }}
                    resizeMode="contain"
                    onAnimationFinish={finishSplash}
                />
                <Animated.View style={[styles.textWrapper, textStyle]}>
                    <Text style={styles.brandText}>SETORIAL</Text>
                </Animated.View>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FF9F0A', // Vibrant orange that blends with the lion
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    textWrapper: {
        marginTop: -60,
        zIndex: 10,
    },
    brandText: {
        fontSize: 52,
        fontWeight: '900',
        color: '#FFFFFF', // White text for maximum contrast on orange
        letterSpacing: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 10,
    },
});

