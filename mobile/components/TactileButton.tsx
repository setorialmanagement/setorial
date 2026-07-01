import React from 'react';
import { View, Pressable, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { playSound } from '../lib/audio';

export interface TactileButtonProps {
    children: React.ReactNode;
    onPress?: () => void;
    backgroundColor?: string;
    shadowColor?: string;
    disabled?: boolean;
    style?: ViewStyle;
    className?: string;
    contentClassName?: string;
    soundType?: 'tap' | 'pop' | 'boop';
    depth?: number;
    borderRadius?: number;
}

export const TactileButton: React.FC<TactileButtonProps> = ({
    children,
    onPress,
    backgroundColor = '#1CB0F6',
    shadowColor = '#1899D6',
    disabled = false,
    style,
    className,
    contentClassName,
    soundType = 'tap',
    depth = 6,
    borderRadius = 16,
}) => {
    const isPressed = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{
                translateY: withSpring(isPressed.value * depth, {
                    stiffness: 400,
                    damping: 20
                })
            }]
        };
    });

    const handlePressIn = () => {
        if (disabled) return;
        isPressed.value = 1;
    };

    const handlePressOut = () => {
        if (disabled) return;
        isPressed.value = 0;
    };

    const handlePress = () => {
        if (disabled) return;
        playSound(soundType);
        if (onPress) onPress();
    };

    return (
        <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handlePress}
            style={[{ width: '100%', marginBottom: depth }, style]}
            className={className}
        >
            <View style={{
                backgroundColor: disabled ? '#E5E5E5' : shadowColor,
                borderRadius: borderRadius,
                paddingBottom: depth,
                width: '100%'
            }}>
                <Animated.View 
                    style={[
                        {
                            backgroundColor: disabled ? '#CECECE' : backgroundColor,
                            borderRadius: borderRadius,
                            overflow: 'hidden',
                        },
                        animatedStyle
                    ]}
                    className={contentClassName}
                >
                    {children}
                </Animated.View>
            </View>
        </Pressable>
    );
};
