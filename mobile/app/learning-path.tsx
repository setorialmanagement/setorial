import { SoundButton } from '../components/SoundButton';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, BookOpen, CheckCircle2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { authApi } from '../services/api';

export default function LearningPathScreen() {
    const router = useRouter();
    const [progress, setProgress] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProgress();
    }, []);

    const fetchProgress = async () => {
        try {
            const res = await authApi.getProgress();
            setProgress(res.data);
        } catch (error) {
            console.error('Failed to fetch progress:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 bg-white dark:bg-zinc-950 items-center justify-center">
                <ActivityIndicator size="large" color="#F59E0B" />
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-[#0B0D12]">
            <View className="flex-row items-center justify-between px-5 py-6">
                <SoundButton onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
                    <ChevronLeft size={24} color="#AFAFAF" />
                </SoundButton>
                <Text className="text-black dark:text-white font-bold text-xl">Learning Path</Text>
                <View className="w-10" />
            </View>

            <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
                {progress.map((subject) => (
                    <SoundButton
                        key={subject.id}
                        activeOpacity={0.8}
                        onPress={() => router.push(`/course-detail?id=${subject.id}`)}
                        className="mb-6 bg-white dark:bg-[#1E222B] p-6 rounded-[32px] border-2 border-b-4 border-[#E5E5E5] dark:border-[#272B36]">
                        <View className="flex-row items-center justify-between mb-4">
                            <View className="flex-row items-center">
                                <View className="w-12 h-12 bg-[#F5F5F5] dark:bg-[#2A2E39] rounded-2xl items-center justify-center mr-4 border-2 border-[#E5E5E5] dark:border-[#272B36]">
                                    <BookOpen size={22} color="#AFAFAF" />
                                </View>
                                <View>
                                    <Text className="text-[#4B4B4B] dark:text-white font-bold text-lg">{subject.name}</Text>
                                    <Text className="text-[#AFAFAF] dark:text-gray-400 font-bold text-xs uppercase tracking-wider">{subject.totalTopics} topics · {subject.totalLessons} lessons</Text>
                                </View>
                            </View>
                            <Text className="text-[#F59E0B] font-black text-2xl">{subject.progress}%</Text>
                        </View>

                        {/* Progress Bar */}
                        <View className="h-4 bg-[#F5F5F5] dark:bg-[#0B0D12] rounded-full overflow-hidden border-2 border-[#E5E5E5] dark:border-[#272B36]">
                            <View
                                style={{ width: `${subject.progress}%` }}
                                className="h-full bg-[#F59E0B] rounded-full"
                            />
                        </View>

                        <View className="flex-row items-center mt-3">
                            <CheckCircle2 size={14} color="#94A3B8" />
                            <Text className="text-gray-400 text-xs ml-2">
                                {subject.completedLessons}/{subject.totalLessons} lessons completed
                            </Text>
                        </View>
                    </SoundButton>
                ))}

                {progress.length === 0 && (
                    <View className="items-center justify-center p-10">
                        <BookOpen size={48} color="#D1D5DB" />
                        <Text className="text-gray-400 font-medium mt-4 text-center">Start learning to see your progress here.</Text>
                    </View>
                )}

                <View className="h-20" />
            </ScrollView>
        </SafeAreaView>
    );
}
