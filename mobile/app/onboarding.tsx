import { SoundButton } from '../components/SoundButton';
import { TactileButton } from '../components/TactileButton';
import { View, Text, Image, TouchableOpacity, ScrollView, Animated as RNAnimated, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState, useRef, useEffect } from "react";
import { ArrowLeft } from "lucide-react-native";
import Animated, { FadeIn, FadeInDown, SlideInDown, FadeInUp } from 'react-native-reanimated';
import { MascotInteraction } from '../components/MascotInteraction';

// Types
type StepConfig = {
    id: number;
    question: string;
    type: 'options' | 'notification';
    multiSelect?: boolean;
    maxSelections?: number;
    options?: { id: string; title: string; subtitle?: string; recommended?: boolean }[];
};

const STEPS: StepConfig[] = [
    {
        id: 1,
        question: "What would you like to learn?",
        type: 'options',
        multiSelect: true,
        maxSelections: 3,
        options: [
            { id: 'math', title: 'Mathematics' },
            { id: 'science', title: 'Sciences' },
            { id: 'languages', title: 'Languages' },
            { id: 'tech', title: 'Technology' },
            { id: 'business', title: 'Business' },
        ]
    },
    {
        id: 2,
        question: "What's your education level?",
        type: 'options',
        options: [
            { id: 'highschool', title: 'High School' },
            { id: 'university', title: 'University' },
            { id: 'professional', title: 'Professional' },
            { id: 'lifelong', title: 'Lifelong Learner' },
        ]
    },
    {
        id: 3,
        question: "What's your daily learning goal?",
        type: 'options',
        options: [
            { id: 'casual', title: 'Casual', subtitle: '5 mins / day' },
            { id: 'regular', title: 'Regular', subtitle: '10 mins / day' },
            { id: 'serious', title: 'Serious', subtitle: '15 mins / day' },
            { id: 'intense', title: 'Intense', subtitle: '30 mins / day' },
        ]
    },
    {
        id: 4,
        question: "How do you want to get started?",
        type: 'options',
        options: [
            { id: 'gold', title: 'Setorial Gold', subtitle: 'Faster progress, no ads, monetization', recommended: true },
            { id: 'free', title: 'Learn for free', subtitle: 'Core learning features, with ads' },
        ]
    },
    {
        id: 5,
        question: "I'll remind you to practice so it becomes a habit!",
        type: 'notification'
    }
];

export default function OnboardingScreen() {
    const router = useRouter();
    
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [selections, setSelections] = useState<Record<number, string[]>>({});
    
    // Progress Bar Animation
    const progressAnim = useRef(new RNAnimated.Value(1)).current;
    
    const currentStep = STEPS[currentStepIndex];
    const totalSteps = STEPS.length;
    
    useEffect(() => {
        RNAnimated.spring(progressAnim, {
            toValue: currentStepIndex + 1,
            useNativeDriver: false,
            bounciness: 0,
            speed: 12
        }).start();
    }, [currentStepIndex]);

    const handleNext = () => {
        if (currentStepIndex < totalSteps - 1) {
            setCurrentStepIndex(prev => prev + 1);
        } else {
            // End of onboarding! Route to register
            router.push('/register');
        }
    };

    const handleBack = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(prev => prev - 1);
        } else {
            router.back();
        }
    };

    const handleSelectOption = (optionId: string) => {
        setSelections(prev => {
            const currentSelected = prev[currentStep.id] || [];
            
            if (currentStep.multiSelect) {
                const isAlreadySelected = currentSelected.includes(optionId);
                
                if (isAlreadySelected) {
                    // Remove it
                    return { ...prev, [currentStep.id]: currentSelected.filter(id => id !== optionId) };
                } else {
                    // Add it if under max limit
                    const max = currentStep.maxSelections || 1;
                    if (currentSelected.length < max) {
                        return { ...prev, [currentStep.id]: [...currentSelected, optionId] };
                    }
                    return prev; // Ignore if max reached
                }
            } else {
                // Single select
                return { ...prev, [currentStep.id]: [optionId] };
            }
        });
    };

    const isNextDisabled = currentStep.type === 'options' && (!selections[currentStep.id] || selections[currentStep.id].length === 0);
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-[#0B0D12]">
            {/* Header / Progress Bar */}
            <View className="flex-row items-center px-5 pt-2 pb-4">
                <SoundButton onPress={handleBack} className="p-2 -ml-2 mr-3" soundType="boop">
                    <ArrowLeft size={24} color="#AFAFAF" strokeWidth={2.5} />
                </SoundButton>
                
                {/* Progress Bar Track */}
                <View className="flex-1 h-4 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden flex-row">
                    <RNAnimated.View 
                        className="h-full bg-[#F59E0B] rounded-full"
                        style={{
                            flex: progressAnim.interpolate({
                                inputRange: [0, totalSteps],
                                outputRange: [0, 1]
                            })
                        }}
                    >
                        {/* Highlight strip for 3D effect */}
                        <View className="h-1.5 bg-white/30 rounded-full mx-2 mt-0.5" />
                    </RNAnimated.View>
                    <RNAnimated.View 
                        style={{
                            flex: progressAnim.interpolate({
                                inputRange: [0, totalSteps],
                                outputRange: [1, 0]
                            })
                        }}
                    />
                </View>
            </View>

            <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
                
                {/* Mascot & Chat Bubble */}
                <Animated.View entering={FadeIn.delay(100)} className="mb-8">
                    <MascotInteraction
                        state="happy"
                        message={currentStep.question}
                    />
                </Animated.View>

                {/* Content Area */}
                {currentStep.type === 'options' && (
                    <View className="pb-10">
                        {currentStep.options?.map((option, index) => {
                            const isSelected = (selections[currentStep.id] || []).includes(option.id);
                            return (
                                <Animated.View key={option.id} entering={FadeInDown.delay(index * 80).springify()} className="relative mb-4">
                                    {option.recommended && (
                                        <View className="absolute -top-3 right-4 bg-[#1CB0F6] px-3 py-1 rounded-md z-10">
                                            <Text className="text-white font-bold text-[10px] uppercase tracking-widest">Recommended</Text>
                                        </View>
                                    )}
                                    <TactileButton
                                        onPress={() => handleSelectOption(option.id)}
                                        backgroundColor={isSelected ? (isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)') : (isDark ? '#1C1F26' : '#FFFFFF')}
                                        shadowColor={isSelected ? '#D97706' : (isDark ? '#0A0C10' : '#E5E5E5')}
                                        contentClassName="p-5"
                                        depth={4}
                                        borderRadius={16}
                                        style={{ marginBottom: 0 }}
                                    >
                                        <Text className={`font-bold text-[17px] ${isSelected ? 'text-[#D97706] dark:text-[#F59E0B]' : 'text-gray-700 dark:text-gray-300'}`}>
                                            {option.title}
                                        </Text>
                                        {option.subtitle && (
                                            <Text className={`mt-1 font-semibold ${isSelected ? 'text-[#F59E0B]' : 'text-gray-500 dark:text-gray-400'}`}>
                                                {option.subtitle}
                                            </Text>
                                        )}
                                    </TactileButton>
                                </Animated.View>
                            );
                        })}
                    </View>
                )}

                {currentStep.type === 'notification' && (
                    <Animated.View entering={FadeInUp.delay(150).springify()} className="items-center justify-center py-6">
                        {/* Mock iOS Notification Prompt */}
                        <View className="bg-white dark:bg-[#1C1C1E] w-[270px] rounded-2xl overflow-hidden" style={{
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 10 },
                            shadowOpacity: 0.15,
                            shadowRadius: 20,
                            elevation: 10,
                        }}>
                            <View className="p-5 items-center">
                                <Text className="text-black dark:text-white font-semibold text-[17px] text-center mb-1 leading-tight">
                                    "Setorial" Would Like to Send You Notifications
                                </Text>
                                <Text className="text-gray-500 dark:text-gray-400 text-[13px] text-center leading-tight">
                                    Notifications may include alerts, sounds, and icon badges. These can be configured in Settings.
                                </Text>
                            </View>
                            <View className="flex-row border-t border-gray-200 dark:border-zinc-800">
                                <View className="flex-1 py-3 border-r border-gray-200 dark:border-zinc-800 items-center justify-center">
                                    <Text className="text-[#AFAFAF] dark:text-gray-500 text-[17px]">Don't Allow</Text>
                                </View>
                                <View className="flex-1 py-3 items-center justify-center">
                                    <Text className="text-[#007AFF] font-semibold text-[17px]">Allow</Text>
                                </View>
                            </View>
                        </View>
                        
                        {/* Blue Arrow Pointing Up */}
                        <Text className="text-[#1CB0F6] text-[40px] mt-6">↑</Text>
                    </Animated.View>
                )}
            </ScrollView>

            {/* Bottom Action Area */}
            <Animated.View entering={SlideInDown.delay(300).springify()} className="px-5 pb-8 pt-4 border-t border-transparent">
                <TactileButton
                    soundType="pop"
                    onPress={handleNext}
                    disabled={isNextDisabled}
                    backgroundColor="#F59E0B"
                    shadowColor="#D97706"
                    contentClassName="py-4 items-center justify-center"
                    className="rounded-2xl"
                >
                    <Text className={`font-bold text-[17px] uppercase tracking-wider ${isNextDisabled ? 'text-[#AFAFAF] dark:text-zinc-500' : 'text-white'}`}>
                        {currentStep.type === 'notification' ? 'Remind Me To Practice' : 'Continue'}
                    </Text>
                </TactileButton>
            </Animated.View>
        </SafeAreaView>
    );
}
