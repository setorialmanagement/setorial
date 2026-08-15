import { SoundButton } from '../components/SoundButton';
import { View, Text, TextInput, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { authApi } from "../services/api";
import { useAuthStore } from "../store/authStore";

export default function VerifyEmailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const email = params.email as string;

    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const setAuth = useAuthStore((state) => state.setAuth);

    const handleVerify = async () => {
        if (!otp || otp.length !== 6) {
            setError("Please enter the 6-digit code");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const response = await authApi.verifyOtp({ email, otp });
            
            if (response.data.token) {
                await setAuth(response.data.user, response.data.token);
                // AuthStore will automatically redirect to (tabs) once token is set
            } else {
                // Fallback if backend doesn't return token immediately
                alert("Email verified successfully! Please log in.");
                router.replace("/login");
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Verification failed. Please check your code.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                <ScrollView className="flex-1 px-5 pt-4">

                    {/* Header */}
                    <View className="flex-row items-center justify-between mb-8">
                        <SoundButton onPress={() => router.back()} className="p-2 -ml-2">
                            <ArrowLeft size={24} color="#000" strokeWidth={2.5} />
                        </SoundButton>
                    </View>

                    {/* Title Area */}
                    <View className="mb-8">
                        <Text className="text-[26px] font-bold text-black dark:text-white mb-1.5 tracking-tight">Check your email</Text>
                        <Text className="text-gray-500 dark:text-gray-400 text-base">We've sent a 6-digit verification code to {email}.</Text>
                    </View>

                    {/* Form Section */}
                    <View className="mb-5">
                        {/* OTP Input */}
                        <View className="border border-gray-200 dark:border-zinc-800 rounded-xl px-4 pt-3 pb-2 mb-4">
                            <Text className="text-gray-400 text-[12px] font-medium mb-0.5 tracking-wide">6-Digit Code</Text>
                            <TextInput
                                placeholder="123456"
                                placeholderTextColor="#9CA3AF"
                                value={otp}
                                onChangeText={setOtp}
                                className="text-black dark:text-white text-[16px] font-semibold p-0 m-0 h-6 tracking-widest"
                                keyboardType="number-pad"
                                maxLength={6}
                            />
                        </View>
                    </View>

                    {error ? <Text className="text-red-500 text-sm mb-4">{error}</Text> : null}

                </ScrollView>

                {/* Bottom Action Area */}
                <View className="px-5 pb-8 pt-4 border-t border-transparent">
                    <SoundButton
                        activeOpacity={0.8}
                        onPress={handleVerify}
                        disabled={loading}
                        className={`py-4 rounded-2xl items-center border-b-4 ${loading
                            ? 'bg-[#E5E5E5] border-[#CECECE]'
                            : 'bg-[#F59E0B] border-[#D97706] border-t-[#F59E0B] border-x-[#F59E0B]'
                            }`}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text className={`font-bold text-[17px] uppercase tracking-wider ${loading ? 'text-[#AFAFAF]' : 'text-white'}`}>Verify Account</Text>
                        )}
                    </SoundButton>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
