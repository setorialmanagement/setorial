import { SoundButton } from '../components/SoundButton';
import { View, Text, ScrollView } from 'react-native';
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
                <Text className="text-[#AFAFAF] font-medium leading-7 text-[15px] mb-6">Last updated: March 2026</Text>

                <Text className="text-black dark:text-white font-semibold text-base mb-3">1. Agreement to Terms</Text>
                <Text className="text-[#AFAFAF] leading-7 text-[15px] mb-4">These Terms of Service ("Terms") govern your access to and use of the Setorial mobile application and related services ("Service"). By creating an account, downloading, or using the Service you agree to these Terms.</Text>

                <Text className="text-black dark:text-white font-semibold text-base mb-3">2. Eligibility</Text>
                <Text className="text-[#AFAFAF] leading-7 text-[15px] mb-4">You must be at least 13 years old to use the Service. If you are under 18, you must have the permission of a parent or guardian to use the Service and accept these Terms.</Text>

                <Text className="text-black dark:text-white font-semibold text-base mb-3">3. Accounts and Security</Text>
                <Text className="text-[#AFAFAF] leading-7 text-[15px] mb-4">You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. Notify us immediately if you suspect unauthorized access.</Text>

                <Text className="text-black dark:text-white font-semibold text-base mb-3">4. Content and Use</Text>
                <Text className="text-[#AFAFAF] leading-7 text-[15px] mb-4">Setorial provides educational content, quizzes, and features for learning. All content is provided for informational purposes only. You agree not to use the Service for illegal activities, to circumvent security, or to attempt to manipulate gamification systems or rewards.</Text>

                <Text className="text-black dark:text-white font-semibold text-base mb-3">5. Gamification, Points & Payouts</Text>
                <Text className="text-[#AFAFAF] leading-7 text-[15px] mb-4">Points, streaks, and other gamification metrics are virtual and their monetary conversion is subject to eligibility checks, verification, and available reward pool. Payouts are processed subject to identity verification (KYC) and anti-fraud checks. We reserve the right to withhold, reverse, or refuse payouts where fraudulent activity or policy violations are suspected.</Text>

                <Text className="text-black dark:text-white font-semibold text-base mb-3">6. Payments and Fees</Text>
                <Text className="text-[#AFAFAF] leading-7 text-[15px] mb-4">If the Service charges fees for premium tiers or content, purchases are final unless otherwise stated. Payment processing is handled by third parties (e.g., Paystack). You agree to the third-party provider's terms for payment processing.</Text>

                <Text className="text-black dark:text-white font-semibold text-base mb-3">7. Intellectual Property</Text>
                <Text className="text-[#AFAFAF] leading-7 text-[15px] mb-4">All Service content, trademarks, logos, and materials are owned by Setorial or its licensors. You are granted a limited, non-exclusive, non-transferable license to use the Service for personal learning purposes.</Text>

                <Text className="text-black dark:text-white font-semibold text-base mb-3">8. Termination</Text>
                <Text className="text-[#AFAFAF] leading-7 text-[15px] mb-4">We may suspend or terminate accounts that violate these Terms or where we reasonably suspect fraud, abuse, or security threats. Upon termination, your access to the Service will cease and you may lose accrued points or benefits subject to our policies.</Text>

                <Text className="text-black dark:text-white font-semibold text-base mb-3">9. Disclaimers</Text>
                <Text className="text-[#AFAFAF] leading-7 text-[15px] mb-4">The Service is provided "as is" and "as available". To the fullest extent permitted by law, Setorial disclaims all warranties, express or implied, including merchantability, fitness for a particular purpose, and non-infringement.</Text>

                <Text className="text-black dark:text-white font-semibold text-base mb-3">10. Limitation of Liability</Text>
                <Text className="text-[#AFAFAF] leading-7 text-[15px] mb-4">Setorial and its affiliates shall not be liable for indirect, incidental, special, or consequential damages arising from your use of the Service. Our aggregate liability for direct damages is limited to the amount paid by you in the prior 12 months, or ₦1,000, whichever is greater.</Text>

                <Text className="text-black dark:text-white font-semibold text-base mb-3">11. Changes to Terms</Text>
                <Text className="text-[#AFAFAF] leading-7 text-[15px] mb-4">We may update these Terms from time to time. We will notify users of material changes via the app or email. Continued use after updates indicates acceptance of the new Terms.</Text>

                <Text className="text-black dark:text-white font-semibold text-base mb-3">12. Governing Law</Text>
                <Text className="text-[#AFAFAF] leading-7 text-[15px] mb-4">These Terms are governed by the laws of the jurisdiction in which Setorial is incorporated. Any disputes will be subject to the exclusive jurisdiction of the courts in that jurisdiction.</Text>

                <Text className="text-black dark:text-white font-semibold text-base mb-3">13. Contact</Text>
                <Text className="text-[#AFAFAF] leading-7 text-[15px] mb-10">If you have questions about these Terms, contact us at support@setorial.app.</Text>
            </ScrollView>
        </SafeAreaView>
    );
}
