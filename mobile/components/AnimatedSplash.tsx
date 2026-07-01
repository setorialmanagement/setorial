import React, { useEffect } from 'react';
import { StyleSheet, Dimensions, View, Image } from 'react-native';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withTiming, 
    runOnJS,
    withRepeat,
    withSequence,
    withSpring,
    Easing
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const ICON_SIZE = Math.round(width * 0.4);

interface AnimatedSplashProps {
    onFinish: () => void;
}

export default function AnimatedSplash({ onFinish }: AnimatedSplashProps) {
    const opacity = useSharedValue(1);
    const scale = useSharedValue(0.8);

    const finishSplash = () => {
        opacity.value = withTiming(0, { duration: 800 }, (finished) => {
            if (finished) {
                runOnJS(onFinish)();
            }
        });
    };

    useEffect(() => {
        // Heartbeat / Zoom animation for the icon
        scale.value = withRepeat(
            withSequence(
                withTiming(1.1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
                withTiming(0.9, { duration: 800, easing: Easing.inOut(Easing.ease) })
            ),
            -1, // infinite
            true // reverse
        );

        // Keep the splash screen visible for a set time (e.g., 2.5 seconds), then fade out
        const timer = setTimeout(() => {
            finishSplash();
        }, 2500); 

        return () => clearTimeout(timer);
    }, []);

    const containerStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    const iconStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }]
    }));

    return (
        <Animated.View style={[styles.container, containerStyle]}>
            <View style={styles.content}>
                <Animated.Image
                    source={require('../assets/images/icon.png')}
                    style={[styles.icon, iconStyle]}
                    resizeMode="contain"
                />
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FF9F0A', // Vibrant orange
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    icon: {
        width: ICON_SIZE,
        height: ICON_SIZE,
    }
});
