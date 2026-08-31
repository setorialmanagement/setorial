import { SoundButton } from '../components/SoundButton';
import { View, Text, TouchableOpacity, ScrollView, Switch, Linking } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, User, Bell, Shield, CircleHelp, Volume2, Vibrate, Globe } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

export default function SettingsScreen() {
    const router = useRouter();
    const { hapticsEnabled, soundEnabled, setHapticsEnabled, setSoundEnabled } = useAuthStore();
    const [notifications, setNotifications] = useState(true);

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-[#0B0D12]">
            {/* Header */}
            <View className="flex-row items-center justify-between px-5 py-6">
                <SoundButton onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
                    <ChevronLeft size={24} color="#AFAFAF" />
                </SoundButton>
                <Text className="text-black dark:text-white font-bold text-xl">Settings</Text>
                <View className="w-10" />
            </View>

            <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
                {/* Account Section */}
                <Animated.Text entering={FadeInUp.delay(60).springify()} className="text-gray-400 font-bold mb-4 uppercase text-xs tracking-widest">Account</Animated.Text>
                <SettingRow
                    index={0}
                    icon={<Globe size={20} color="#000" />}
                    label="Language"
                    onPress={() => useAuthStore.getState().setLangModalOpen(true)}
                />
                <SettingRow
                    index={1}
                    icon={<User size={20} color="#000" />}
                    label="Edit Profile"
                    onPress={() => router.push('/edit-profile')}
                />
                <SettingRow index={2} icon={<Bell size={20} color="#000" />} label="Notifications">
                    <Switch
                        value={notifications}
                        onValueChange={setNotifications}
                        trackColor={{ false: '#E2E8F0', true: '#000' }}
                    />
                </SettingRow>
                <SettingRow index={2} icon={<Vibrate size={20} color="#000" />} label="Haptic Feedback">
                    <Switch
                        value={hapticsEnabled}
                        onValueChange={setHapticsEnabled}
                        trackColor={{ false: '#E2E8F0', true: '#F59E0B' }}
                    />
                </SettingRow>
                <SettingRow index={3} icon={<Volume2 size={20} color="#000" />} label="Sound Effects">
                    <Switch
                        value={soundEnabled}
                        onValueChange={setSoundEnabled}
                        trackColor={{ false: '#E2E8F0', true: '#F59E0B' }}
                    />
                </SettingRow>
                <SettingRow
                    index={4}
                    icon={<Shield size={20} color="#000" />}
                    label="Security & Privacy"
                    onPress={() => router.push('/security')}
                />

                <View className="h-10" />

                {/* Support Section */}
                <Animated.Text entering={FadeInUp.delay(460).springify()} className="text-gray-400 font-bold mb-4 uppercase text-xs tracking-widest">Support</Animated.Text>
                <SettingRow
                    index={5}
                    icon={<CircleHelp size={20} color="#000" />}
                    label="Help Center"
                    onPress={() => router.push('/help')}
                />

                <View className="h-10" />

                {/* Legal Section */}
                <Animated.Text entering={FadeInUp.delay(580).springify()} className="text-gray-400 font-bold mb-4 uppercase text-xs tracking-widest">Legal</Animated.Text>
                <SettingRow index={6} label="Terms of Service" onPress={() => Linking.openURL('https://scholarsedgetutorial.com/terms')} />
                <SettingRow index={7} label="Privacy Policy" onPress={() => Linking.openURL('https://scholarsedgetutorial.com/privacy')} />

                <View className="h-32" />
            </ScrollView>
        </SafeAreaView>
    );
}

function SettingRow({ icon, label, children, onPress, index = 0 }: { icon?: any, label: string, children?: any, onPress?: () => void, index?: number }) {
    return (
        <Animated.View entering={FadeInUp.delay(100 + index * 80).springify()}>
            <SoundButton
                activeOpacity={0.8}
                onPress={onPress}
                disabled={!onPress && !children}
                className="flex-row items-center p-5 mb-3 bg-white dark:bg-[#1E222B] border-2 border-[#E5E5E5] dark:border-[#272B36] border-b-4 rounded-2xl"
            >
                {icon && (
                    <View className="w-10 h-10 rounded-xl bg-[#F5F5F5] dark:bg-[#2A2E39] border-2 border-[#E5E5E5] dark:border-[#272B36] items-center justify-center mr-4">
                        {icon}
                    </View>
                )}
                <Text className="flex-1 text-[#4B4B4B] dark:text-white font-bold text-[17px]">{label}</Text>
                {children || (onPress && <ChevronLeft size={20} color="#CECECE" style={{ transform: [{ rotate: '180deg' }] }} />)}
            </SoundButton>
        </Animated.View>
    );
}

