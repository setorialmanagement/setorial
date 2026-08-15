import { SoundButton } from '../components/SoundButton';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function TermsScreen() {
    const router = useRouter();

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950">
            <View className="flex-row items-center justify-between px-5 py-6">
                <SoundButton onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
                    <ChevronLeft size={24} color="#000" />
                </SoundButton>
                <Text className="text-black dark:text-white font-bold text-xl">Terms of Service</Text>
                <View className="w-10" />
            </View>

            <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
                <Text className="text-[#AFAFAF] font-bold leading-7 text-[15px] mb-10">
                    Last updated: March 2026{'\n\n'}
                    Welcome to Setorial. By using our application, you agree to the following terms and conditions. Please read them carefully.{'\n\n'}
                    1. Use of Service: You must be at least 13 years old to use this service. You are responsible for maintaining the confidentiality of your account.{'\n\n'}
                    2. Gamification and Rewards: Points earned on the platform are not guaranteed to have monetary value until eligibility criteria are met. Payouts are subject to verification.{'\n\n'}
                    3. Content: All educational content provided is for informational purposes only. Setorial is not liable for any inaccuracies.{'\n\n'}
                    4. Termination: We reserve the right to terminate accounts that violate our anti-fraud policies.
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}
