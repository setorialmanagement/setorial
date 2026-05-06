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
    happy: require('../assets/animations/happy.lottie'),
    sad: require('../assets/animations/crying.lottie'),
    thinking: require('../assets/animations/happy.lottie'),
    pointing_down: require('../assets/animations/point_down.lottie'),
    pointing_up: require('../assets/animations/point_up.lottie'),
    pointing_left: require('../assets/animations/point_left.lottie'),
    pointing_right: require('../assets/animations/point_left.lottie'),
};

export const MascotInteraction: React.FC<MascotInteractionProps> = ({ message, state = 'happy', size = 120 }) => {
    const isRight = state === 'pointing_right';
    const animationRef = useRef<LottieView>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Manual play trigger — autoPlay alone can fail on mount with New Architecture
    useEffect(() => {
        if (isLoaded) {
            animationRef.current?.reset();
            animationRef.current?.play();
        }
    }, [state, isLoaded]);

    const source = MASCOT_ANIMATIONS[state] || MASCOT_ANIMATIONS.happy;

    return (
        <View style={styles.container}>
            {/* Mascot Lottie Animation */}
            <View 
                style={[
                    { width: size, height: size, marginBottom: -8 },
                    { transform: [{ scaleX: isRight ? -1 : 1 }] }
                ]}
            >
                <LottieView
                    ref={animationRef}
                    autoPlay
                    loop
                    source={source}
                    style={{ width: '100%', height: '100%' }}
                    onLayout={() => setIsLoaded(true)}
                    resizeMode="contain"
                    speed={1}
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

