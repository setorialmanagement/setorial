import { SoundButton } from '../components/SoundButton';
import { View, Text, ScrollView } from 'react-native';
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
                <Text className="text-[#AFAFAF] font-medium leading-7 text-[15px] mb-6">Last updated: March 2026</Text>

                <Text className="text-black dark:text-white font-semibold text-base mb-3">1. Overview</Text>
                <Text className="text-[#AFAFAF] leading-7 text-[15px] mb-4">Setorial is committed to protecting your privacy. This Privacy Policy explains what information we collect, how we use it, and your rights.</Text>

                <Text className="text-black dark:text-white font-semibold text-base mb-3">2. Information We Collect</Text>
                <Text className="text-[#AFAFAF] leading-7 text-[15px] mb-4">We collect information you provide directly (name, email, profile data), information about your activity in the app (progress, quiz scores, streaks), and device/usage information (device model, OS version, app usage metrics).</Text>

                <Text className="text-black dark:text-white font-semibold text-base mb-3">3. How We Use Information</Text>
                <Text className="text-[#AFAFAF] leading-7 text-[15px] mb-4">We use collected data to provide, maintain, and improve the Service, personalise learning experiences, process rewards and payouts, detect and prevent fraud, and communicate with you about your account.</Text>

                <Text className="text-black dark:text-white font-semibold text-base mb-3">4. Third Parties</Text>
                <Text className="text-[#AFAFAF] leading-7 text-[15px] mb-4">We share data with trusted third-party service providers for payments (Paystack), analytics, and cloud hosting. We require these providers to protect your data and only use it for specified purposes.</Text>

                <Text className="text-black dark:text-white font-semibold text-base mb-3">5. Data Security</Text>
                <Text className="text-[#AFAFAF] leading-7 text-[15px] mb-4">We implement industry-standard security measures to protect user data. However, no system is completely secure — if you suspect a breach, contact us immediately.</Text>

                <Text className="text-black dark:text-white font-semibold text-base mb-3">6. Data Retention</Text>
                <Text className="text-[#AFAFAF] leading-7 text-[15px] mb-4">We retain personal data as necessary to provide the Service, comply with legal obligations, resolve disputes, and enforce our agreements. You can request deletion subject to legal and operational constraints.</Text>

                <Text className="text-black dark:text-white font-semibold text-base mb-3">7. Your Rights</Text>
                <Text className="text-[#AFAFAF] leading-7 text-[15px] mb-4">Depending on your jurisdiction, you may have rights to access, correct, or delete your personal data, and to restrict or object to certain processing. To exercise these rights, contact support@setorial.app.</Text>

                <Text className="text-black dark:text-white font-semibold text-base mb-3">8. Children's Privacy</Text>
                <Text className="text-[#AFAFAF] leading-7 text-[15px] mb-4">Our Service is intended for users aged 13 and above. We do not knowingly collect personal information from children under 13 without parental consent.</Text>

                <Text className="text-black dark:text-white font-semibold text-base mb-3">9. Changes to this Policy</Text>
                <Text className="text-[#AFAFAF] leading-7 text-[15px] mb-4">We may update this Privacy Policy. We will notify users of material changes when required. Your continued use after changes indicates acceptance.</Text>

                <Text className="text-black dark:text-white font-semibold text-base mb-3">10. Contact</Text>
                <Text className="text-[#AFAFAF] leading-7 text-[15px] mb-10">If you have questions about privacy, contact us at privacy@setorial.app or support@setorial.app.</Text>
            </ScrollView>
        </SafeAreaView>
    );
}
