import { SoundButton } from '../components/SoundButton';
import { View, Text, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function WelcomeScreen() {
    const router = useRouter();

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950 justify-between">
            <StatusBar style="auto" />

            {/* Top Spacer */}
            <View className="flex-1" />

            {/* Center Logo Area */}
            <View className="items-center justify-center flex-[2]">
                <Image 
                    source={{ uri: 'https://pub-2adf18353cc14bf899bf2827efdfec49.r2.dev/public/logo.png' }} 
                    style={{ width: 140, height: 140, marginBottom: 20, borderRadius: 32 }}
                    resizeMode="contain"
                />
                <Text className="text-[#F59E0B] text-[40px] font-black tracking-tight mb-2">
                    Setorial
                </Text>
                <Text className="text-gray-500 dark:text-gray-400 text-[18px] font-medium tracking-wide">
                    Learn, Earn and Grow
                </Text>
            </View>

            {/* Bottom Actions Area */}
            <View className="px-5 pb-8 flex-1 justify-end">
                <SoundButton
                    soundType="pop"
                    activeOpacity={0.8}
                    onPress={() => router.push('/onboarding')}
                    className="w-full bg-[#F59E0B] border-b-4 border-[#D97706] border-t-[#F59E0B] border-x-[#F59E0B] py-4 rounded-2xl items-center mb-4"
                >
                    <Text className="text-white font-bold text-[17px] uppercase tracking-wider">Get Started</Text>
                </SoundButton>

                <SoundButton
                    soundType="tap"
                    activeOpacity={0.8}
                    onPress={() => router.push('/login')}
                    className="w-full bg-white dark:bg-zinc-900 border-2 border-gray-200 dark:border-zinc-800 border-b-4 py-4 rounded-2xl items-center"
                >
                    <Text className="text-[#F59E0B] font-bold text-[17px] uppercase tracking-wider">I Already Have An Account</Text>
                </SoundButton>
            </View>
        </SafeAreaView>
    );
}
