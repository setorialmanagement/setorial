import { SoundButton } from '../../components/SoundButton';
import { View, Text, TouchableOpacity, ScrollView, Image, RefreshControl, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, LogOut, ChevronRight, BookOpen, Star, HelpCircle, ShieldCheck } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useState, useCallback, useEffect, useRef } from 'react';
import { authApi } from '../../services/api';
import { getTierColors } from '../../utils/theme';
import LottieView from 'lottie-react-native';

export default function ProfileScreen() {
    const router = useRouter();
    const { user, logout, updateUser } = useAuthStore();
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            const res = await authApi.getMe();
            updateUser(res.data);
        } catch (error) {
            console.error('Failed to refresh profile:', error);
        } finally {
            setRefreshing(false);
        }
    }, []);

    const handleLogout = async () => {
        await logout();
        router.replace('/welcome');
    };

    const theme = getTierColors(user?.tier);

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-[#0B0D12]">
            <ScrollView
                className="flex-1 px-5 pt-4"
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >

                <Text className="text-black dark:text-white text-[28px] font-bold tracking-tight mb-8">Manage</Text>

                {/* Profile Header */}
                <SoundButton
                    onPress={() => router.push('/edit-profile')}
                    className="flex-row items-center mb-10"
                >
                    <View className="relative mr-4">
                        <View className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#1E222B] items-center justify-center overflow-hidden border border-gray-200 dark:border-[#272B36]">
                            {user?.avatarUrl ? (
                                <Image source={{ uri: user.avatarUrl }} className="w-full h-full" />
                            ) : (
                                <LottieView
                                    autoPlay
                                    loop
                                    source={require('../../assets/animations/happy.json')}
                                    style={{ width: 80, height: 80 }}
                                    renderMode="SOFTWARE"
                                    resizeMode="contain"
                                    cacheComposition={true}
                                />
                            )}
                        </View>
                        <View className={`absolute bottom-0 right-0 w-4 h-4 border-2 border-white dark:border-[#0B0D12] rounded-full ${user?.isVerified ? 'bg-blue-500' : 'bg-green-500'}`} />
                    </View>
                    <View className="flex-1">
                        <View className="flex-row items-center">
                            <Text className="text-black dark:text-white text-[22px] font-bold tracking-tight mr-2">{user?.name || 'Student'}</Text>
                        </View>
                        <View className="flex-row items-center mt-1">
                            <View
                                className="px-3 py-1 rounded-full border border-b-2"
                                style={{
                                    backgroundColor: `${theme.primary}20`,
                                    borderColor: theme.primary
                                }}
                            >
                                <Text
                                    className="text-[11px] font-black uppercase tracking-widest"
                                    style={{ color: theme.primaryDark }}
                                >
                                    {user?.tier || 'FREE'}
                                </Text>
                            </View>
                            <Text className="text-gray-400 dark:text-gray-500 font-medium ml-3 text-xs">• {user?.email || 'student@setorial.com'}</Text>
                        </View>
                    </View>
                    <ChevronRight size={20} color="#9CA3AF" />
                </SoundButton>

                {/* Badges Section */}
                <View className="mb-8">
                    <Text className="text-black dark:text-white font-bold text-xl tracking-tight mb-4">My Badges</Text>
                    {user?.badges && user.badges.length > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                            {user.badges.map((badge: any) => (
                                <View key={badge.id} className="bg-white dark:bg-[#1E222B] border-2 border-[#E5E5E5] dark:border-[#272B36] border-b-4 rounded-2xl p-4 mr-4 items-center justify-center w-28">
                                    <View className="w-14 h-14 rounded-full items-center justify-center mb-2" style={{ backgroundColor: badge.color + '20' }}>
                                        <Star size={28} color={badge.color} fill={badge.color} />
                                    </View>
                                    <Text className="text-black dark:text-white font-bold text-[13px] text-center">{badge.name}</Text>
                                </View>
                            ))}
                        </ScrollView>
                    ) : (
                        <View className="bg-gray-50 dark:bg-[#1E222B] border-2 border-[#E5E5E5] dark:border-[#272B36] p-6 rounded-2xl border-b-4 items-center">
                            <Star size={32} color="#CECECE" className="mb-2" />
                            <Text className="text-gray-400 font-bold text-center">Complete lessons to earn badges!</Text>
                        </View>
                    )}
                </View>

                {/* Action List */}
                <Text className="text-black dark:text-white font-bold text-xl tracking-tight mb-4">Account</Text>
                <View className="mb-8">
                    <ActionRow
                        icon={<BookOpen size={20} color="#000" />}
                        label="My Learning Path"
                        onPress={() => router.push('/learning-path')}
                    />
                    <ActionRow
                        icon={<Star size={20} color="#000" />}
                        label="Achievements"
                        onPress={() => router.push('/achievements')}
                    />
                    <ActionRow
                        icon={<ShieldCheck size={20} color="#000" />}
                        label="Subscription Tier"
                        onPress={() => router.push('/subscription')}
                    />
                    {['SILVER', 'GOLD'].includes(user?.tier || '') && (
                        <ActionRow
                            icon={<ShieldCheck size={20} color="#1CB0F6" />}
                            label="Monetization & Verification"
                            onPress={() => router.push('/verification')}
                        />
                    )}
                    <ActionRow
                        icon={<Settings size={20} color="#000" />}
                        label="Settings"
                        onPress={() => router.push('/settings')}
                    />
                    <ActionRow
                        icon={<HelpCircle size={20} color="#000" />}
                        label="Help Center"
                        onPress={() => router.push('/help')}
                    />
                </View>

                {/* Log Out Button */}
                <SoundButton
                    activeOpacity={0.8}
                    onPress={handleLogout}
                    className="flex-row items-center justify-center bg-white dark:bg-[#1E222B] border-2 border-[#E5E5E5] dark:border-[#272B36] border-b-4 p-4 rounded-2xl mb-10"
                >
                    <LogOut size={20} color="#FF4B4B" />
                    <Text className="text-[#FF4B4B] font-bold ml-2 text-[17px] uppercase tracking-wider">Log Out</Text>
                </SoundButton>

                <View className="h-32" />

            </ScrollView>
        </SafeAreaView>
    );
}

function ActionRow({ icon, label, onPress }: { icon: any, label: string, onPress?: () => void }) {
    return (
        <SoundButton
            activeOpacity={0.8}
            onPress={onPress}
            disabled={!onPress}
            className="flex-row items-center p-5 mb-3 bg-white dark:bg-[#1E222B] border-2 border-[#E5E5E5] dark:border-[#272B36] border-b-4 rounded-2xl"
        >
            <View className="w-10 h-10 rounded-xl bg-[#F5F5F5] dark:bg-[#2A2E39] border-2 border-[#E5E5E5] dark:border-[#272B36] items-center justify-center mr-4">
                {icon}
            </View>
            <Text className="flex-1 text-[#4B4B4B] dark:text-white font-bold text-[17px]">{label}</Text>
            <ChevronRight size={20} color="#CECECE" />
        </SoundButton>
    );
}
