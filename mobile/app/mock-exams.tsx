import { TactileButton } from '../components/TactileButton';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { View, Text, ScrollView, ActivityIndicator, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Clock, FileText, Lock, Wand2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { mockApi, walletApi, learningApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { SoundButton } from '../components/SoundButton';
import * as WebBrowser from 'expo-web-browser';

export default function MockExamsScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [mocks, setMocks] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [numQuestions, setNumQuestions] = useState('180');
    const [duration, setDuration] = useState('120');
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [balance, setBalance] = useState(0);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [mocksRes, walletRes, subjectsRes] = await Promise.all([
                mockApi.getAvailable(),
                walletApi.getBalance(),
                learningApi.getSubjects()
            ]);
            setMocks(mocksRes.data);
            setBalance(walletRes.data.balance);
            setSubjects(subjectsRes.data);
        } catch (error) {
            console.error('Error fetching mocks/subjects', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartMock = async (mock: any) => {
        if (mock.price === 0 || mock.price === '0') {
            try {
                setLoading(true);
                const res = await mockApi.start(mock.id);
                router.push({ pathname: '/active-mock', params: { attemptId: res.data.attemptId, mockId: mock.id } });
            } catch (error: any) {
                Alert.alert('Error', error.response?.data?.message || 'Failed to start mock');
            } finally {
                setLoading(false);
            }
            return;
        }

        Alert.alert(
            "Start Mock Exam",
            `This exam costs ₦${mock.price}. How would you like to pay? (Wallet: ₦${balance})`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Pay with Wallet",
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
                },
                {
                    text: "Pay with Card",
                    onPress: () => handlePaystackPayment(mock.id)
                }
            ]
        );
    };

    const handlePaystackPayment = async (mockId: string) => {
        try {
            setLoading(true);
            const initRes = await mockApi.initializePayment(mockId);
            const { authorization_url, reference } = initRes.data;

            const result = await WebBrowser.openAuthSessionAsync(authorization_url, 'setorial://mock-payment-callback');
            
            // Re-fetch to verify regardless of result type, as users sometimes close the browser manually after paying
            const verifyRes = await mockApi.verifyPayment(reference);
            if (verifyRes.data.status === 'success') {
                router.push({ pathname: '/active-mock', params: { attemptId: verifyRes.data.attemptId, mockId: verifyRes.data.mockId } });
            }
        } catch (error: any) {
             Alert.alert('Payment Error', error.response?.data?.message || 'An error occurred during payment verification. If you were charged, please contact support.');
        } finally {
            setLoading(false);
        }
    };

    const toggleSubject = (id: string) => {
        if (selectedSubjects.includes(id)) {
            setSelectedSubjects(selectedSubjects.filter(s => s !== id));
        } else {
            if (selectedSubjects.length >= 4) {
                Alert.alert('Limit Reached', 'You can select up to 4 subjects for a mock exam.');
                return;
            }
            setSelectedSubjects([...selectedSubjects, id]);
        }
    };

    const handleGenerateCustomMock = async () => {
        if (selectedSubjects.length === 0) {
            Alert.alert('Select Subjects', 'Please select at least one subject.');
            return;
        }
        const questions = parseInt(numQuestions);
        const mins = parseInt(duration);
        if (isNaN(questions) || questions < 10 || questions > 400) {
            Alert.alert('Invalid Input', 'Questions must be between 10 and 400.');
            return;
        }
        if (isNaN(mins) || mins < 10 || mins > 300) {
            Alert.alert('Invalid Input', 'Duration must be between 10 and 300 minutes.');
            return;
        }

        try {
            setGenerating(true);
            const res = await mockApi.generateCustom({
                subjectIds: selectedSubjects,
                numQuestions: questions,
                durationMinutes: mins
            });

            // Start the mock right away
            const startRes = await mockApi.start(res.data.mockId);
            router.push({ pathname: '/active-mock', params: { attemptId: startRes.data.attemptId, mockId: res.data.mockId } });

        } catch (error: any) {
            Alert.alert('Generation Failed', error.response?.data?.message || 'Could not generate custom mock exam.');
        } finally {
            setGenerating(false);
        }
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
                {/* Custom Mock Generator Section */}
                <Animated.View entering={FadeInDown.springify()} className="bg-[#F8F9FA] dark:bg-[#1E222B] border-2 border-b-4 border-[#E5E5E5] dark:border-[#272B36] rounded-2xl p-5 mb-8">
                    <View className="flex-row items-center mb-4">
                        <View className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 items-center justify-center mr-3">
                            <Wand2 size={20} color="#9333EA" />
                        </View>
                        <View>
                            <Text className="text-black dark:text-white font-bold text-lg">Custom AI Mock</Text>
                            <Text className="text-gray-500 dark:text-gray-400 text-xs">Generate a mock for your exact subjects</Text>
                        </View>
                    </View>

                    {/* Subject Selection */}
                    <Text className="text-black dark:text-white font-bold text-sm mb-2">Select Subjects (Max 4):</Text>
                    <View className="flex-row flex-wrap mb-4">
                        {subjects.map(sub => (
                            <SoundButton 
                                key={sub.id} 
                                onPress={() => toggleSubject(sub.id)}
                                className={`px-3 py-1.5 rounded-lg border-2 mb-2 mr-2 ${selectedSubjects.includes(sub.id) ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-500' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}
                            >
                                <Text className={`font-bold text-xs ${selectedSubjects.includes(sub.id) ? 'text-purple-700 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                    {sub.name}
                                </Text>
                            </SoundButton>
                        ))}
                    </View>

                    <View className="flex-row space-x-3 mb-4">
                        <View className="flex-1">
                            <Text className="text-black dark:text-white font-bold text-sm mb-1.5">Questions:</Text>
                            <TextInput 
                                className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-black dark:text-white font-bold"
                                keyboardType="numeric"
                                value={numQuestions}
                                onChangeText={setNumQuestions}
                                placeholder="180"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>
                        <View className="flex-1">
                            <Text className="text-black dark:text-white font-bold text-sm mb-1.5">Duration (mins):</Text>
                            <TextInput 
                                className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-black dark:text-white font-bold"
                                keyboardType="numeric"
                                value={duration}
                                onChangeText={setDuration}
                                placeholder="120"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>
                    </View>

                    <TactileButton
                        onPress={handleGenerateCustomMock}
                        disabled={generating || selectedSubjects.length === 0}
                        backgroundColor={selectedSubjects.length === 0 ? "#9CA3AF" : "#9333EA"}
                        shadowColor={selectedSubjects.length === 0 ? "#6B7280" : "#7E22CE"}
                        contentClassName="py-3.5 flex-row items-center justify-center"
                        className="rounded-xl"
                    >
                        {generating ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <>
                                <Wand2 size={18} color="#FFF" strokeWidth={2.5} />
                                <Text className="text-white font-bold text-[15px] uppercase tracking-wider ml-2">
                                    Generate & Start
                                </Text>
                            </>
                        )}
                    </TactileButton>
                </Animated.View>
                
                <Text className="text-black dark:text-white font-bold text-lg mb-4">Standard Mock Exams</Text>

                {loading ? (
                    <ActivityIndicator size="large" color="#F59E0B" className="mt-10" />
                ) : mocks.length === 0 ? (
                    <View className="items-center justify-center mt-5">
                        <Text className="text-gray-400 font-bold">No standard mock exams available.</Text>
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
