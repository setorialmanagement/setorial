import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { TactileButton } from './TactileButton';

interface FillInTheBlankProps {
    sentence: string;
    options: string[];
    onSelect: (index: number | null) => void;
    disabled?: boolean;
    isCorrect?: boolean | null;
}

export function FillInTheBlank({ sentence, options, onSelect, disabled = false, isCorrect = null }: FillInTheBlankProps) {
    // Only supporting single blank for now to match current backend capabilities
    const [selectedWordIndex, setSelectedWordIndex] = useState<number | null>(null);

    // Reset when sentence changes
    useEffect(() => {
        setSelectedWordIndex(null);
    }, [sentence]);

    const handleSelectOption = (index: number) => {
        if (disabled) return;
        setSelectedWordIndex(index);
        onSelect(index);
    };

    const handleRemoveOption = () => {
        if (disabled) return;
        setSelectedWordIndex(null);
        onSelect(null);
    };

    // Split sentence by ___ or __0__ to find the gap
    // This regex splits by ___ or __0__, __1__, etc.
    const parts = sentence.split(/___|__\d+__/g);
    
    // Fallback if no blanks are found, just show sentence and a gap at the end
    const safeParts = parts.length > 1 ? parts : [sentence, ''];

    let gapBorderColor = '#E5E5E5';
    let gapBgColor = '#F9FAFB'; // gray-50
    let gapTextColor = '#1CB0F6';

    if (isCorrect === true) {
        gapBorderColor = '#58CC02';
        gapBgColor = '#D7FFB8';
        gapTextColor = '#58CC02';
    } else if (isCorrect === false) {
        gapBorderColor = '#FF4B4B';
        gapBgColor = '#FFDCDC';
        gapTextColor = '#FF4B4B';
    } else if (selectedWordIndex !== null) {
        gapBorderColor = '#1899D6';
        gapBgColor = '#DDF4FF';
    }

    return (
        <View className="space-y-8 flex-1">
            {/* The Sentence with Gaps */}
            <Animated.View entering={FadeIn} className="flex-row flex-wrap items-center min-h-[80px] border-b-2 border-gray-100 dark:border-gray-800 pb-8 mb-8">
                {safeParts.map((part, i) => (
                    <React.Fragment key={i}>
                        {/* The Text Part */}
                        <Text className="text-xl font-bold text-gray-800 dark:text-white my-2 leading-8">
                            {part.trim()}
                        </Text>
                        
                        {/* The Gap (inserted between parts) */}
                        {i < safeParts.length - 1 && (
                            <TouchableOpacity 
                                disabled={disabled || selectedWordIndex === null}
                                onPress={handleRemoveOption}
                                className="mx-2 my-1"
                            >
                                <View 
                                    className="min-w-[80px] h-[44px] border-b-4 items-center justify-center rounded-xl px-4"
                                    style={{ 
                                        borderColor: gapBorderColor,
                                        backgroundColor: gapBgColor,
                                        borderWidth: 2,
                                    }}
                                >
                                    {selectedWordIndex !== null ? (
                                        <Text className="font-bold text-[18px]" style={{ color: gapTextColor }}>
                                            {options[selectedWordIndex]}
                                        </Text>
                                    ) : (
                                        <Text className="text-gray-300 dark:text-gray-600 font-bold">...</Text>
                                    )}
                                </View>
                            </TouchableOpacity>
                        )}
                    </React.Fragment>
                ))}
            </Animated.View>

            {/* Scattered Option Pill Buttons */}
            <View className="flex-row flex-wrap justify-center gap-4">
                {options.map((opt, i) => {
                    const isUsed = selectedWordIndex === i;
                    
                    return (
                        <Animated.View key={i} entering={SlideInDown.delay(i * 50).springify()}>
                            <TactileButton
                                disabled={isUsed || disabled}
                                onPress={() => handleSelectOption(i)}
                                backgroundColor={isUsed ? '#E5E5E5' : '#FFFFFF'}
                                shadowColor={isUsed ? '#E5E5E5' : '#CECECE'}
                                depth={isUsed ? 0 : 4}
                                contentClassName="px-6 py-3 items-center justify-center"
                                style={{ opacity: isUsed ? 0.4 : 1 }}
                            >
                                <Text className="font-bold text-[18px] text-gray-800">
                                    {opt}
                                </Text>
                            </TactileButton>
                        </Animated.View>
                    );
                })}
            </View>
        </View>
    );
}
