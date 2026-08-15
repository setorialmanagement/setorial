import { SoundButton } from '../components/SoundButton';
import { View, Text, TouchableOpacity, ScrollView, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Info, HelpCircle, ShieldCheck } from "lucide-react-native";

export default function AboutScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-[#0B0D12]">
            <View className="flex-row items-center justify-between px-5 py-6">
                <SoundButton onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
                    <ChevronLeft size={24} color="#AFAFAF" />
                </SoundButton>
                <Text className="text-black dark:text-white font-bold text-xl">About Setorial</Text>
                <View className="w-10" />
            </View>

            <ScrollView className="flex-1 px-8 pt-10">
                <View className="items-center mb-12">
                    <View className="w-20 h-20 bg-[#1CB0F6]/10 dark:bg-[#1E222B] rounded-3xl items-center justify-center mb-6">
                        <Info size={40} color="#1CB0F6" />
                    </View>
                    <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Version 1.0.0</Text>
                    <Text className="text-gray-500 dark:text-gray-400 text-center font-bold">Built for students who want to excel in their sectors through focused learning and gamified competition.</Text>
                </View>

                <AboutLink icon={<HelpCircle size={20} color="#64748B" />} label="Help & Support" />
                <AboutLink icon={<ShieldCheck size={20} color="#64748B" />} label="Privacy Policy" />
                <AboutLink icon={<Info size={20} color="#64748B" />} label="Terms of Service" />

                <View className="mt-20 items-center">
                    <Text className="text-gray-400 text-xs">© 2026 Setorial Inc. All rights reserved.</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function AboutLink({ icon, label }: { icon: any, label: string }) {
    return (
        <SoundButton activeOpacity={0.8} className="flex-row items-center bg-white dark:bg-[#1E222B] p-5 rounded-2xl mb-4 border-2 border-[#E5E5E5] dark:border-[#272B36] border-b-4">
            <View className="w-10 h-10 rounded-xl bg-[#F5F5F5] dark:bg-[#2A2E39] border-2 border-[#E5E5E5] dark:border-[#272B36] items-center justify-center mr-4">
                {icon}
            </View>
            <Text className="flex-1 text-[#4B4B4B] dark:text-white font-bold text-[17px]">{label}</Text>
            <ChevronLeft size={20} color="#CECECE" style={{ transform: [{ rotate: '180deg' }] }} />
        </SoundButton>
    );
}
