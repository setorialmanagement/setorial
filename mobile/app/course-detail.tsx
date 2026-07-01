import { TactileButton } from '../components/TactileButton';
import { MascotInteraction } from '../components/MascotInteraction';
import { View, Text, ScrollView, SafeAreaView, ActivityIndicator } from "react-native";
import { ChevronLeft, Star, Lock, CheckCircle2 } from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import { learningApi } from "../services/api";

export default function CourseDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [subject, setSubject] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) fetchSubject();
    }, [id]);

    const fetchSubject = async () => {
        try {
            const res = await learningApi.getSubject(id as string);
            setSubject(res.data);
        } catch (error) {
            console.error('Failed to fetch subject details:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 bg-white dark:bg-[#0B0D12] items-center justify-center">
                <ActivityIndicator size="large" color="#F59E0B" />
            </View>
        );
    }

    if (!subject) {
        return (
            <View className="flex-1 bg-white dark:bg-zinc-950 items-center justify-center p-5">
                <Text className="text-gray-500 dark:text-gray-400 mb-4">Subject not found</Text>
                <TactileButton onPress={() => router.back()} backgroundColor="#1CB0F6" shadowColor="#1899D6" contentClassName="px-6 py-3 items-center justify-center">
                    <Text className="text-white font-bold">Go Back</Text>
                </TactileButton>
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-[#F5F5F5] dark:bg-[#0B0D12]">
            {/* Header */}
            <View className="flex-row items-center px-6 py-5 bg-white dark:bg-[#1E222B] shadow-sm z-10 border-b-2 border-gray-100 dark:border-gray-800">
                <TactileButton onPress={() => router.back()} style={{ width: 40 }} contentClassName="items-center justify-center">
                    <ChevronLeft size={28} color="#AFAFAF" />
                </TactileButton>
                <Text className="text-2xl font-black text-gray-900 dark:text-white flex-1 ml-4">{subject.name}</Text>
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100, paddingTop: 20 }}>
                {subject.topics?.map((topic: any, topicIndex: number) => (
                    <View key={topic.id} className="mb-10 mt-4 px-6">
                        {/* Topic Header */}
                        <TactileButton
                            onPress={() => {
                                const firstLesson = topic.lessons?.find((l: any) => l.status !== 'LOCKED') || topic.lessons?.[0];
                                if (firstLesson) {
                                    router.push(`/level?id=${firstLesson.id}`);
                                } else {
                                    alert("No lessons available in this unit yet.");
                                }
                            }}
                            backgroundColor="#F59E0B"
                            shadowColor="#D97706"
                            depth={8}
                            className="mb-8"
                            contentClassName="p-6 items-start"
                        >
                            <Text className="text-white/80 font-black text-base uppercase tracking-wider">Unit {topicIndex + 1}</Text>
                            <Text className="text-white font-black text-2xl mt-1">{topic.name}</Text>
                        </TactileButton>

                        {/* Pathway Nodes */}
                        <View className="items-center relative">
                            {topic.lessons?.map((lesson: any, index: number) => {
                                // Zigzag calculation: 0, 40, 0, -40
                                const offset = index % 4 === 0 ? 0 : index % 4 === 1 ? 50 : index % 4 === 2 ? 0 : -50;

                                const isCompleted = lesson.status === 'COMPLETED';
                                const isCurrent = lesson.status === 'CURRENT';
                                const isLocked = lesson.status === 'LOCKED';

                                let bgColor = "#E5E5E5";
                                let shadowColor = "#C9C9C9";
                                let icon = <Lock size={28} color="#AFAFAF" />;

                                if (isCompleted) {
                                    bgColor = "#FFC800";
                                    shadowColor = "#E5B400";
                                    icon = <CheckCircle2 size={32} color="#FFF" />;
                                } else if (isCurrent) {
                                    bgColor = "#58CC02";
                                    shadowColor = "#46A302";
                                    icon = <Star size={36} color="#FFF" fill="#FFF" />;
                                }

                                return (
                                    <View key={lesson.id} className="mb-10 items-center justify-center relative z-10" style={{ transform: [{ translateX: offset }] }}>
                                        {isCurrent && (
                                            <View className="absolute -top-12 w-28 bg-white dark:bg-zinc-800 rounded-2xl py-2 items-center justify-center border-2 border-b-[6px] border-gray-200 dark:border-zinc-700 z-50">
                                                <Text className="text-[#58CC02] font-black uppercase text-[13px] tracking-widest">START</Text>
                                            </View>
                                        )}
                                        <View style={{ width: 80, height: 80 }}>
                                            <TactileButton 
                                                disabled={isLocked}
                                                onPress={() => router.push(`/rive-quiz?id=${lesson.id}`)}
                                                backgroundColor={bgColor}
                                                shadowColor={shadowColor}
                                                depth={isCurrent ? 8 : (isLocked ? 4 : 6)}
                                                borderRadius={999}
                                                style={{ width: 80, height: 80 }}
                                                contentClassName="w-20 h-20 items-center justify-center"
                                            >
                                                {icon}
                                            </TactileButton>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                ))}

                {(!subject.topics || subject.topics.length === 0) && (
                    <View className="items-center justify-center mt-10 px-6">
                        <MascotInteraction 
                            state="thinking" 
                            message="No units available yet! Check back later." 
                        />
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
