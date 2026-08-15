import { SoundButton } from '../components/SoundButton';
import { View, Text, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Eye, EyeOff } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { authApi } from '../services/api';
import { useState } from 'react';

export default function SecurityScreen() {
    const router = useRouter();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [saving, setSaving] = useState(false);

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'New passwords do not match');
            return;
        }
        if (newPassword.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        setSaving(true);
        try {
            await authApi.changePassword({ currentPassword, newPassword });
            Alert.alert('Success', 'Password changed successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Failed to change password';
            Alert.alert('Error', msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-[#0B0D12]">
            <View className="flex-row items-center justify-between px-5 py-6">
                <SoundButton onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
                    <ChevronLeft size={24} color="#AFAFAF" />
                </SoundButton>
                <Text className="text-black dark:text-white font-bold text-xl">Security</Text>
                <View className="w-10" />
            </View>

            <View className="px-5">
                <Text className="text-black dark:text-white font-bold text-lg mb-6">Change Password</Text>

                {/* Current Password */}
                <Text className="text-gray-400 dark:text-gray-500 font-bold text-xs uppercase tracking-widest mb-2">Current Password</Text>
                <View className="flex-row items-center bg-gray-50 dark:bg-[#1E222B] rounded-2xl border border-gray-100 dark:border-[#272B36] mb-6">
                    <TextInput
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        secureTextEntry={!showCurrent}
                        className="flex-1 p-5 text-black dark:text-white font-bold text-lg"
                        placeholder="••••••••"
                        placeholderTextColor="#94A3B8"
                    />
                    <SoundButton onPress={() => setShowCurrent(!showCurrent)} className="pr-5">
                        {showCurrent ? <EyeOff size={20} color="#94A3B8" /> : <Eye size={20} color="#94A3B8" />}
                    </SoundButton>
                </View>

                {/* New Password */}
                <Text className="text-gray-400 dark:text-gray-500 font-bold text-xs uppercase tracking-widest mb-2">New Password</Text>
                <View className="flex-row items-center bg-gray-50 dark:bg-[#1E222B] rounded-2xl border border-gray-100 dark:border-[#272B36] mb-6">
                    <TextInput
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry={!showNew}
                        className="flex-1 p-5 text-black dark:text-white font-bold text-lg"
                        placeholder="••••••••"
                        placeholderTextColor="#94A3B8"
                    />
                    <SoundButton onPress={() => setShowNew(!showNew)} className="pr-5">
                        {showNew ? <EyeOff size={20} color="#94A3B8" /> : <Eye size={20} color="#94A3B8" />}
                    </SoundButton>
                </View>

                {/* Confirm Password */}
                <Text className="text-gray-400 dark:text-gray-500 font-bold text-xs uppercase tracking-widest mb-2">Confirm New Password</Text>
                <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    className="bg-gray-50 dark:bg-[#1E222B] p-5 rounded-2xl text-black dark:text-white font-bold text-lg border border-gray-100 dark:border-[#272B36] mb-10"
                    placeholder="••••••••"
                    placeholderTextColor="#94A3B8"
                />

                {/* Submit */}
                <SoundButton
                    activeOpacity={0.8}
                    onPress={handleChangePassword}
                    disabled={saving}
                    className={`py-4 rounded-2xl items-center border-b-4 ${saving
                        ? 'bg-[#E5E5E5] border-[#CECECE]'
                        : 'bg-[#F59E0B] border-[#D97706] border-t-[#F59E0B] border-x-[#F59E0B]'}`}
                >
                    {saving ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text className={`font-bold text-[17px] uppercase tracking-wider ${saving ? 'text-[#AFAFAF]' : 'text-white'}`}>Update Password</Text>
                    )}
                </SoundButton>
            </View>
        </SafeAreaView>
    );
}
