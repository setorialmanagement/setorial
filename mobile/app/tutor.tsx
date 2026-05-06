import { SoundButton } from '../components/SoundButton';
import { MascotInteraction } from '../components/MascotInteraction';
import { View, Text, SafeAreaView, TextInput, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { ChevronLeft, Send, Sparkles } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import LottieView from 'lottie-react-native';

export default function TutorScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [message, setMessage] = useState('');
    const [chat, setChat] = useState<{ role: 'user' | 'tutor', text: string }[]>([
        { role: 'tutor', text: `Hello ${user?.name || 'Scholar'}! I'm your Personal Tutor. How can I help you today?` }
    ]);
    const [loading, setLoading] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    const isGold = user?.tier === 'GOLD';

    const handleSend = async () => {
        if (!message.trim() || loading || !isGold) return;

        const userMsg = message.trim();
        setMessage('');
        setChat(prev => [...prev, { role: 'user', text: userMsg }]);
        setLoading(true);

        // Mock AI response for now - in production this would call an AI endpoint
        setTimeout(() => {
            setChat(prev => [...prev, { role: 'tutor', text: `That's a great question about "${userMsg}". As your personal tutor, I'm here to guide you through it! (AI Integration pending)` }]);
            setLoading(false);
        }, 1500);
    };

    useEffect(() => {
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }, [chat]);

    if (!isGold) {
        return (
            <SafeAreaView className="flex-1 bg-white dark:bg-[#0B0D12] items-center justify-center p-8">
                <MascotInteraction 
                    state="sad" 
                    message="Oops! The Personal Tutor is exclusive to our Gold Pride members. Upgrade to get 1-on-1 help!" 
                />
                <SoundButton 
                    onPress={() => router.push('/subscription')}
                    className="mt-8 bg-[#EAB308] px-8 py-4 rounded-2xl border-b-4 border-[#CA8A04]"
                >
                    <Text className="text-white font-black uppercase tracking-widest">Upgrade to Gold</Text>
                </SoundButton>
                <SoundButton onPress={() => router.back()} className="mt-4">
                    <Text className="text-gray-400 font-bold">Go Back</Text>
                </SoundButton>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-[#0B0D12]">
            {/* Header */}
            <View className="flex-row items-center justify-between px-5 py-6 border-b-2 border-gray-100 dark:border-gray-800">
                <SoundButton onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
                    <ChevronLeft size={24} color="#AFAFAF" />
                </SoundButton>
                <View className="flex-row items-center">
                    <Sparkles size={20} color="#EAB308" className="mr-2" />
                    <Text className="text-black dark:text-white font-bold text-xl">Personal Tutor</Text>
                </View>
                <View className="w-10" />
            </View>

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView 
                    ref={scrollViewRef}
                    className="flex-1 px-5 pt-4"
                    contentContainerStyle={{ paddingBottom: 20 }}
                >
                    {chat.map((msg, i) => (
                        <Animated.View 
                            key={i} 
                            entering={msg.role === 'user' ? SlideInRight : FadeIn}
                            className={`mb-6 flex-row ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            {msg.role === 'tutor' && (
                                <View className="mr-3 mt-1">
                                    <View className="w-10 h-10 rounded-full bg-yellow-100 items-center justify-center overflow-hidden">
                                        <LottieView
                                            autoPlay
                                            loop
                                            source={require('../assets/animations/happy.lottie')}
                                            style={{ width: 44, height: 44 }}
                                            resizeMode="contain"
                                            speed={1}
                                        />
                                    </View>
                                </View>
                            )}
                            <View 
                                className={`max-w-[80%] p-4 rounded-2xl border-2 border-b-4 ${
                                    msg.role === 'user' 
                                    ? 'bg-[#1CB0F6] border-[#1899D6] rounded-tr-none' 
                                    : 'bg-white dark:bg-[#1E222B] border-gray-100 dark:border-[#272B36] rounded-tl-none'
                                }`}
                            >
                                <Text className={`font-bold text-[16px] ${msg.role === 'user' ? 'text-white' : 'text-black dark:text-white'}`}>
                                    {msg.text}
                                </Text>
                            </View>
                        </Animated.View>
                    ))}
                    {loading && (
                        <View className="flex-row justify-start mb-6">
                            <View className="mr-3">
                                <View className="w-10 h-10 rounded-full bg-yellow-100 items-center justify-center">
                                    <ActivityIndicator size="small" color="#EAB308" />
                                </View>
                            </View>
                        </View>
                    )}
                </ScrollView>

                {/* Input Area */}
                <View className="p-5 border-t-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-[#0B0D12]">
                    <View className="flex-row items-center bg-gray-50 dark:bg-[#1E222B] rounded-2xl border-2 border-b-4 border-gray-100 dark:border-[#272B36] px-4 py-2">
                        <TextInput
                            className="flex-1 text-black dark:text-white font-bold text-[16px] py-2"
                            placeholder="Ask me anything..."
                            placeholderTextColor="#94A3B8"
                            value={message}
                            onChangeText={setMessage}
                            multiline
                        />
                        <SoundButton 
                            onPress={handleSend}
                            disabled={!message.trim() || loading}
                            className={`ml-2 w-10 h-10 rounded-full items-center justify-center ${message.trim() ? 'bg-[#1CB0F6]' : 'bg-gray-200'}`}
                        >
                            <Send size={18} color="#FFF" />
                        </SoundButton>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
