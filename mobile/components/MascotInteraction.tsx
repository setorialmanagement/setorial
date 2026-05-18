import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import LottieView from 'lottie-react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';

interface MascotInteractionProps {
    message?: string;
    state?: 'happy' | 'sad' | 'thinking' | 'pointing_down' | 'pointing_up' | 'pointing_left' | 'pointing_right';
    size?: number;
}

const MASCOT_ANIMATIONS: Record<string, any> = {
    happy: require('../assets/animations/happy.lottiejson'),
    sad: require('../assets/animations/crying.lottiejson'),
    thinking: require('../assets/animations/happy.lottiejson'),
    pointing_down: require('../assets/animations/point_down.lottiejson'),
    pointing_up: require('../assets/animations/point_up.lottiejson'),
    pointing_left: require('../assets/animations/point_left.lottiejson'),
    pointing_right: require('../assets/animations/point_left.lottiejson'),
};

export const MascotInteraction: React.FC<MascotInteractionProps> = ({ message, state = 'happy', size = 120 }) => {
    const isRight = state === 'pointing_right';
    const animationRef = useRef<LottieView>(null);

    // This delay ensures the native view is ready before we start playback
    useEffect(() => {
        const timer = setTimeout(() => {
            animationRef.current?.play();
        }, 150);
        return () => clearTimeout(timer);
    }, [state]);

    const source = MASCOT_ANIMATIONS[state] || MASCOT_ANIMATIONS.happy;

    return (
        <View style={styles.container}>
            {/* Mascot Lottie Animation */}
            <View 
                style={[
                    { width: size, height: size, marginBottom: -8, backgroundColor: 'transparent' },
                    { transform: [{ scaleX: isRight ? -1 : 1 }] }
                ]}
            >
                <LottieView
                    ref={animationRef}
                    source={source}
                    autoPlay={false}
                    loop
                    style={{ 
                        width: size, 
                        height: size, 
                        backgroundColor: 'transparent' 
                    }}
                    resizeMode="contain"
                />
            </View>

            {/* Speech Bubble */}
            {message && (
                <Animated.View 
                    entering={FadeInRight.delay(300)}
                    style={styles.bubble}
                    className="bg-white dark:bg-[#1E222B] border-2 border-b-4 border-gray-100 dark:border-[#272B36]"
                >
                    <Text className="text-black dark:text-white font-bold text-[15px] leading-5">
                        {message}
                    </Text>
                    
                    {/* Tail of the bubble */}
                    <View 
                        style={styles.bubbleTail}
                        className="absolute -left-[10px] bottom-[-2px] w-0 h-0 border-l-[10px] border-l-transparent border-t-[10px] border-t-white dark:border-t-[#1E222B]"
                    />
                </Animated.View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 8,
        width: '100%',
    },
    bubble: {
        flex: 1,
        padding: 16,
        borderRadius: 20,
        borderBottomLeftRadius: 0,
        marginLeft: 8,
        marginBottom: 32,
    },
    bubbleTail: {
        borderRightWidth: 10,
        borderRightColor: 'transparent',
    }
});

