import { SoundButton } from '../components/SoundButton';
import { View, Text, ScrollView, SafeAreaView, Dimensions } from 'react-native';
import { Trophy, CheckCircle2, XCircle, ArrowLeft, Home } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { MathText } from '../components/MathText';
import { MascotInteraction } from '../components/MascotInteraction';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';

import { playSound } from '../lib/audio';

export default function MockResultScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [result, setResult] = useState<any>(() => {
        if (params.data) {
            try {
                return JSON.parse(params.data as string);
            } catch (e) {
                console.error('Failed to parse result data:', e);
                return null;
            }
        }
        return null;
    });

    useEffect(() => {
        if (result) {
            // Celebration logic
            const passed = result.score >= (result.maxScore * 0.6);
            if (passed) {
                playSound('victory');
            }
        }
    }, []); // Run once on mount

    if (!result) return null;

    const passed = result.score >= (result.maxScore * 0.6);

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-[#0B0D12]">
            <View className="flex-row items-center px-5 py-4 border-b-2 border-gray-100 dark:border-gray-800">
                <SoundButton onPress={() => router.replace('/(tabs)')}>
                    <ArrowLeft size={24} color="#000" className="dark:text-white" />
                </SoundButton>
                <Text className="text-black dark:text-white font-bold text-lg ml-4">Exam Results</Text>
            </View>

            <ScrollView className="flex-1 px-5 pt-8 pb-20" showsVerticalScrollIndicator={false}>
                <Animated.View entering={FadeIn} className="items-center mb-10">
                    <View className="mb-6">
                        <MascotInteraction 
                            state={passed ? 'happy' : 'sad'}
                            message={passed ? 
                                `ROAR! You've conquered this exam like a true King! ${result.pointsEarned} XP added to your pride.` : 
                                "Don't let your mane drop. Review your mistakes and you'll rule the next one!"
                            }
                        />
                    </View>
                    <Text className="text-3xl font-black text-black dark:text-white mb-2 text-center">
                        {passed ? 'Congratulations!' : 'Keep Practicing'}
                    </Text>
                    <Text className="text-gray-500 dark:text-gray-400 text-lg mb-8 font-medium">
                        You scored {result.score} out of {result.maxScore}
                    </Text>

                    <View className="bg-gray-50 dark:bg-[#1E222B] w-full p-6 rounded-[24px] border-2 border-gray-100 dark:border-gray-800">
                        <View className="flex-row justify-between mb-4 items-center">
                            <Text className="text-gray-500 dark:text-gray-400 font-bold text-[15px] uppercase">Points Earned</Text>
                            <Text className="text-[#FFC800] dark:text-[#FFD900] font-black text-xl">+{result.pointsEarned} XP</Text>
                        </View>
                        <View className="h-[2px] bg-gray-200 dark:bg-[#272B36] mb-4" />
                        <View className="flex-row justify-between items-center">
                            <Text className="text-gray-500 dark:text-gray-400 font-bold text-[15px] uppercase">Performance</Text>
                            <Text className={`${passed ? 'text-[#58CC02]' : 'text-[#FF4B4B]'} font-black text-lg`}>
                                {Math.round((result.score / result.maxScore) * 100)}%
                            </Text>
                        </View>
                    </View>
                </Animated.View>

                <Text className="text-xl font-black text-black dark:text-white mb-6">Review Corrections</Text>

                {result.corrections.map((corr: any, index: number) => {
                    const isCorrect = corr.userOption === corr.correctOption;
                    return (
                        <View key={index} className="mb-8 p-5 rounded-3xl border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1E222B]">
                            <View className="flex-row items-center mb-4">
                                <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
                                    <Text className="text-white font-bold">{index + 1}</Text>
                                </View>
                                <Text className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                    {isCorrect ? 'Correct' : 'Incorrect'}
                                </Text>
                            </View>

                            <MathText content={corr.text} fontSize={18} containerStyle={{ marginBottom: 16 }} />

                            <View className="space-y-3">
                                {corr.options.map((opt: string, optIdx: number) => {
                                    const isUserPick = corr.userOption === optIdx;
                                    const isRightPick = corr.correctOption === optIdx;

                                    return (
                                        <View 
                                            key={optIdx} 
                                            className={`p-4 rounded-xl border-2 mb-2 flex-row items-center
                                                ${isRightPick ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 
                                                  isUserPick ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' : 
                                                  'bg-gray-50 border-transparent dark:bg-gray-800/50'}`}
                                        >
                                            <View className="flex-1">
                                                <MathText content={opt} fontSize={15} />
                                            </View>
                                            {isRightPick && <CheckCircle2 size={20} color="#58CC02" />}
                                            {isUserPick && !isRightPick && <XCircle size={20} color="#FF4B4B" />}
                                        </View>
                                    );
                                })}
                            </View>

                            {corr.explanation && (
                                <View className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-l-4 border-blue-500">
                                    <Text className="text-blue-700 dark:text-blue-300 font-bold mb-1">Explanation:</Text>
                                    <MathText content={corr.explanation} fontSize={14} />
                                </View>
                            )}
                        </View>
                    );
                })}

                <SoundButton
                    activeOpacity={0.8}
                    onPress={() => router.replace('/(tabs)')}
                    className="bg-[#1CB0F6] border-b-4 border-[#1899D6] p-4 rounded-2xl items-center mb-10"
                >
                    <Text className="text-white font-bold text-[17px] uppercase tracking-wider">Done</Text>
                </SoundButton>
            </ScrollView>
        </SafeAreaView>
    );
}
