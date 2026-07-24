import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Animated, { 
    FadeInRight, 
    SlideInUp,
    FadeIn,
    BounceIn,
} from 'react-native-reanimated';
import { stateToMood, LION_IMAGES, type LionMood } from '../lib/lionMood';

interface MascotInteractionProps {
    message?: string;
    /** Legacy state names for backward compat, OR direct lion mood names */
    state?: 'happy' | 'sad' | 'thinking' | 'pointing_down' | 'pointing_up' | 'pointing_left' | 'pointing_right' | 'angry' | 'crying' | 'freezing' | 'sleeping' | 'formal';
    size?: number;
    /** Direct mood override (takes priority over state) */
    mood?: LionMood;
}

export const MascotInteraction: React.FC<MascotInteractionProps> = ({ 
    message, 
    state = 'happy', 
    size = 120,
    mood,
}) => {
    // Determine which lion to show
    const lionMood = mood || stateToMood(state);
    const lionImage = LION_IMAGES[lionMood];

    return (
        <View style={styles.container}>
            {/* Lion Image — slides up from its own boundary */}
            <View style={[styles.lionContainer, { width: size, height: size }]}>
                <Animated.View
                    entering={SlideInUp.delay(100).springify().damping(14).stiffness(100)}
                    style={styles.lionInner}
                >
                    <Image
                        source={lionImage}
                        style={[styles.lionImage, { width: size, height: size }]}
                        resizeMode="contain"
                    />
                </Animated.View>
            </View>

            {/* Speech Bubble */}
            {message && (
                <Animated.View 
                    entering={FadeInRight.delay(400).springify().damping(14)}
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
    lionContainer: {
        overflow: 'hidden',
        borderRadius: 20,
        marginBottom: -8,
    },
    lionInner: {
        width: '100%',
        height: '100%',
    },
    lionImage: {
        borderRadius: 20,
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
