import { SoundButton } from '../components/SoundButton';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function PrivacyScreen() {
    const router = useRouter();

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950">
            <View className="flex-row items-center justify-between px-5 py-6">
                <SoundButton onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
                    <ChevronLeft size={24} color="#000" />
                </SoundButton>
                <Text className="text-black dark:text-white font-bold text-xl">Privacy Policy</Text>
                <View className="w-10" />
            </View>

            <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
                <Text className="text-[#AFAFAF] font-bold leading-7 text-[15px] mb-10">
                    Last updated: March 2026{'\n\n'}
                    At Setorial, we take your privacy seriously. This policy explains how we collect and use your data.{'\n\n'}
                    1. Data Collection: We collect your email, name, and profile information to provide a personalized learning experience.{'\n\n'}
                    2. Usage Data: We track your learning progress, quiz scores, and streak data to manage gamification rewards.{'\n\n'}
                    3. Third-Party Services: We use Paystack for payment processing and do not store your credit card details.{'\n\n'}
                    4. Security: We implement industry-standard security measures to protect your account.
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}
