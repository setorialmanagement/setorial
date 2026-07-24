import React, { useEffect } from 'react';
import { StyleSheet, Dimensions, View, Image, Text } from 'react-native';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withTiming, 
    runOnJS,
    withSequence,
    withSpring,
    withDelay,
    Easing,
    FadeIn,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const ICON_SIZE = Math.round(width * 0.45);

interface AnimatedSplashProps {
    onFinish: () => void;
}

export default function AnimatedSplash({ onFinish }: AnimatedSplashProps) {
    const opacity = useSharedValue(1);
    const scale = useSharedValue(0);
    const textOpacity = useSharedValue(0);

    const finishSplash = () => {
        opacity.value = withTiming(0, { duration: 600 }, (finished) => {
            if (finished) {
                runOnJS(onFinish)();
            }
        });
    };

    useEffect(() => {
        // Bounce-in animation: 0 → 1.15 → 0.95 → 1.05 → 1
        scale.value = withSequence(
            withSpring(1.15, { damping: 8, stiffness: 180, mass: 0.8 }),
            withSpring(1, { damping: 12, stiffness: 120 })
        );

        // Fade in the text after lion appears
        textOpacity.value = withDelay(600, withTiming(1, { duration: 500 }));

        // Keep splash visible for 2.5s, then fade out
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

    const textStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value,
    }));

    return (
        <Animated.View style={[styles.container, containerStyle]}>
            <View style={styles.content}>
                <Animated.Image
                    source={require('../assets/images/lions/happy.png')}
                    style={[styles.icon, iconStyle]}
                    resizeMode="contain"
                />
                <Animated.Text style={[styles.appName, textStyle]}>
                    Setorial
                </Animated.Text>
                <Animated.Text style={[styles.tagline, textStyle]}>
                    Learn. Compete. Earn.
                </Animated.Text>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FF9F0A',
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    icon: {
        width: ICON_SIZE,
        height: ICON_SIZE,
        borderRadius: 32,
    },
    appName: {
        fontSize: 36,
        fontWeight: '900',
        color: '#FFFFFF',
        marginTop: 20,
        letterSpacing: -1,
    },
    tagline: {
        fontSize: 16,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.8)',
        marginTop: 6,
        letterSpacing: 1,
    },
});
