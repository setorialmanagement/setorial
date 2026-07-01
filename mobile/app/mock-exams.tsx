import { TactileButton } from '../components/TactileButton';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Clock, FileText, Lock } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { mockApi, walletApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { SoundButton } from '../components/SoundButton';

export default function MockExamsScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [mocks, setMocks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [balance, setBalance] = useState(0);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [mocksRes, walletRes] = await Promise.all([
                mockApi.getAvailable(),
                walletApi.getBalance()
            ]);
            setMocks(mocksRes.data);
            setBalance(walletRes.data.balance);
        } catch (error) {
            console.error('Error fetching mocks', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartMock = async (mock: any) => {
        Alert.alert(
            "Start Mock Exam",
            `This exam costs ₦${mock.price}. You have ₦${balance}. Are you sure you want to purchase and start? Time starts immediately.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Start Exam",
                    onPress: async () => {
                        try {
                            setLoading(true);
                            const res = await mockApi.start(mock.id);
                            router.push({ pathname: '/active-mock', params: { attemptId: res.data.attemptId, mockId: mock.id } });
                        } catch (error: any) {
                            Alert.alert('Error', error.response?.data?.message || 'Failed to start mock');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-[#0B0D12]">
            <View className="flex-row items-center px-5 py-4 border-b-2 border-[#E5E5E5] dark:border-[#272B36]">
                <SoundButton onPress={() => router.back()} className="mr-3">
                    <ArrowLeft size={24} color="#AFAFAF" strokeWidth={2.5} />
                </SoundButton>
                <View className="flex-1">
                    <Text className="text-black dark:text-white text-xl font-bold">Mock Exams</Text>
                </View>
                <View className="bg-[#FFF8E1] dark:bg-[#FFC800]/20 px-3 py-1 rounded-full flex-row items-center">
                    <Text className="text-[#E5B400] font-bold text-sm tracking-widest">₦{balance}</Text>
                </View>
            </View>

            <ScrollView className="flex-1 px-5 pt-6">
                {loading ? (
                    <ActivityIndicator size="large" color="#F59E0B" className="mt-10" />
                ) : mocks.length === 0 ? (
                    <View className="items-center justify-center mt-10">
                        <Text className="text-gray-400 font-bold">No mock exams available.</Text>
                    </View>
                ) : (
                    mocks.map((mock: any, index: number) => (
                        <Animated.View
                            key={mock.id}
                            entering={FadeInDown.delay(index * 100).springify()}
                            className="bg-white dark:bg-[#1E222B] border-2 border-b-4 border-[#E5E5E5] dark:border-[#272B36] rounded-2xl p-6 mb-5"
                        >
                            <View className="flex-row items-center mb-4">
                                <View className="w-14 h-14 rounded-2xl bg-[#F3E8FF] dark:bg-[#A552DE]/20 border-2 border-[#CE82FF] dark:border-[#A552DE] items-center justify-center mr-4">
                                    <FileText size={24} color="#A552DE" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-black dark:text-white font-bold text-xl">{mock.title}</Text>
                                    <View className="flex-row items-center mt-1">
                                        <Clock size={14} color="#AFAFAF" />
                                        <Text className="text-gray-500 dark:text-gray-400 ml-1 text-sm font-medium mr-4">{mock.durationMinutes}m</Text>
                                        <FileText size={14} color="#AFAFAF" />
                                        <Text className="text-gray-500 dark:text-gray-400 ml-1 text-sm font-medium">{mock.totalQuestions} Questions</Text>
                                    </View>
                                </View>
                            </View>

                            <TactileButton
                                onPress={() => handleStartMock(mock)}
                                backgroundColor="#F59E0B"
                                shadowColor="#D97706"
                                contentClassName="py-3 flex-row items-center justify-center"
                                className="rounded-xl"
                            >
                                <Lock size={18} color="#FFF" strokeWidth={2.5} />
                                <Text className="text-white font-bold text-[15px] uppercase tracking-wider ml-2">
                                    Unlock for ₦{mock.price}
                                </Text>
                            </TactileButton>
                        </Animated.View>
                    ))
                )}
                <View className="h-20" />
            </ScrollView>
        </SafeAreaView>
    );
}
