import React, { useRef, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withTiming, 
    withDelay,
    runOnJS,
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';

interface AnimatedSplashProps {
    onFinish: () => void;
}

const SPLASH_DURATION_MS = 5000;

export default function AnimatedSplash({ onFinish }: AnimatedSplashProps) {
    const opacity = useSharedValue(1);
    const textOpacity = useSharedValue(0);
    const lottieRef = useRef<LottieView>(null);

    const finishSplash = () => {
        opacity.value = withTiming(0, { duration: 600 }, (finished) => {
            if (finished) {
                runOnJS(onFinish)();
            }
        });
    };

    useEffect(() => {
        // Fade in the text after a short delay
        textOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));

        // Keep splash visible for the full duration, then fade out
        const timer = setTimeout(() => {
            finishSplash();
        }, SPLASH_DURATION_MS);

        return () => clearTimeout(timer);
    }, []);

    const containerStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    const textStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value,
    }));

    return (
        <Animated.View style={[styles.container, containerStyle]}>
            <View style={styles.content}>
                <LottieView
                    ref={lottieRef}
                    source={require('../assets/animations/Neutral-loader.json')}
                    autoPlay
                    loop
                    style={styles.lottie}
                    speed={1}
                />
                <Animated.Text style={[styles.appName, textStyle]}>SETORIAL</Animated.Text>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    lottie: {
        width: 250,
        height: 250,
    },
    appName: {
        fontSize: 36,
        fontWeight: '900',
        color: '#FF9F0A',
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
