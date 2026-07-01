import { SoundButton } from '../components/SoundButton';
import { TactileButton } from '../components/TactileButton';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from "react-native";
import { ArrowLeft, Eye, EyeOff } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { authApi } from "../services/api";
import Animated, { FadeIn, FadeInDown, SlideInDown } from 'react-native-reanimated';

export default function ForgotPasswordScreen() {
    const router = useRouter();

    // Step state: 1 = Email Input, 2 = OTP & New Password
    const [step, setStep] = useState<1 | 2>(1);

    // Form fields
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // States
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSendOtp = async () => {
        if (!email) {
            setError("Please enter your email address");
            return;
        }

        try {
            setLoading(true);
            setError("");
            
            await authApi.forgotPassword({ email });
            // Even if the email doesn't exist, we move to step 2 to prevent email enumeration
            setStep(2);
            setSuccess("If an account exists, a reset code was sent to your email.");
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to request password reset");
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!otp || !newPassword) {
            setError("Please fill all fields");
            return;
        }
        if (otp.length !== 6) {
            setError("Recovery code must be 6 digits");
            return;
        }
        if (newPassword.length < 6) {
            setError("New password must be at least 6 characters");
            return;
        }

        try {
            setLoading(true);
            setError("");
            setSuccess("");

            await authApi.resetPassword({ email, otp, newPassword });
            
            // Password reset successful! Route back to login.
            alert("Password updated successfully! You can now log in.");
            router.replace("/login");
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to reset password. Please check your code.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-[#0B0D12]">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                <ScrollView className="flex-1 px-5 pt-4">

                    {/* Header */}
                    <View className="flex-row items-center justify-between mb-8">
                        <SoundButton onPress={() => step === 2 ? setStep(1) : router.back()} className="p-2 -ml-2">
                            <ArrowLeft size={24} color="#000" strokeWidth={2.5} />
                        </SoundButton>
                    </View>

                    {/* Title Area */}
                    <Animated.View entering={FadeIn.delay(100)} className="mb-8">
                        <Text className="text-[26px] font-bold text-black dark:text-white mb-1.5 tracking-tight">
                            {step === 1 ? "Reset Password" : "Check Your Email"}
                        </Text>
                        <Text className="text-gray-500 dark:text-gray-400 text-base">
                            {step === 1 
                                ? "Enter your email address and we'll send you a 6-digit recovery code." 
                                : `We've sent a 6-digit code to ${email}.`}
                        </Text>
                    </Animated.View>

                    {/* Error & Success Messages */}
                    {error ? <Text className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-lg">{error}</Text> : null}
                    {success ? <Text className="text-green-600 text-sm mb-4 bg-green-50 p-3 rounded-lg">{success}</Text> : null}

                    {/* Form Section */}
                    <Animated.View entering={FadeInDown.delay(200).springify()} className="mb-5">
                        
                        {step === 1 && (
                            /* Email Input */
                            <View className="border-2 border-b-4 border-[#E5E5E5] dark:border-[#272B36] rounded-2xl px-4 pt-3 pb-2 mb-4">
                                <Text className="text-gray-400 text-[12px] font-medium mb-0.5 tracking-wide">Email</Text>
                                <TextInput
                                    placeholder="name@example.com"
                                    placeholderTextColor="#9CA3AF"
                                    value={email}
                                    onChangeText={setEmail}
                                    className="text-black dark:text-white text-[16px] font-semibold p-0 m-0 h-6"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                        )}

                        {step === 2 && (
                            <>
                                {/* OTP Input */}
                                <View className="border-2 border-b-4 border-[#E5E5E5] dark:border-[#272B36] rounded-2xl px-4 pt-3 pb-2 mb-4">
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

                                {/* New Password Input */}
                                <View className="border-2 border-b-4 border-[#E5E5E5] dark:border-[#272B36] rounded-2xl px-4 pt-3 pb-2 mb-4 flex-row items-center justify-between">
                                    <View className="flex-1">
                                        <Text className="text-gray-400 text-[12px] font-medium mb-0.5 tracking-wide">New Password</Text>
                                        <TextInput
                                            placeholder="••••••••••"
                                            placeholderTextColor="#9CA3AF"
                                            value={newPassword}
                                            onChangeText={setNewPassword}
                                            secureTextEntry={!showPassword}
                                            className="text-black dark:text-white text-[16px] font-semibold p-0 m-0 h-6"
                                        />
                                    </View>
                                    <SoundButton onPress={() => setShowPassword(!showPassword)} className="p-2 -mr-2">
                                        {showPassword ? (
                                            <EyeOff size={20} color="#9CA3AF" />
                                        ) : (
                                            <Eye size={20} color="#9CA3AF" />
                                        )}
                                    </SoundButton>
                                </View>
                            </>
                        )}
                    </Animated.View>

                </ScrollView>

                {/* Bottom Action Area */}
                <Animated.View entering={SlideInDown.delay(300).springify()} className="px-5 pb-8 pt-4 border-t border-transparent">
                    <TactileButton
                        onPress={step === 1 ? handleSendOtp : handleResetPassword}
                        disabled={loading}
                        backgroundColor="#F59E0B"
                        shadowColor="#D97706"
                        contentClassName="py-4 items-center justify-center"
                        className="rounded-2xl"
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text className={`font-bold text-[17px] uppercase tracking-wider ${loading ? 'text-[#AFAFAF]' : 'text-white'}`}>
                                {step === 1 ? "Send Code" : "Reset Password"}
                            </Text>
                        )}
                    </TactileButton>
                </Animated.View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
