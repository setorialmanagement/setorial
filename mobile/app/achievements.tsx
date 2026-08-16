import { SoundButton } from '../components/SoundButton';
import { TactileButton } from '../components/TactileButton';
import Animated, { SlideInRight, SlideInDown, Easing } from 'react-native-reanimated';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Flame, BookOpen, Trophy, Star, Crown, Target, Zap, Award, Lock } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { useState, useEffect } from 'react';
import { authApi } from '../services/api';

// Fallback icon map for badges from backend
const ICON_MAP: Record<string, any> = {
    Award, Zap, Star, Crown, Flame, Trophy, BookOpen, Target,
};

export default function AchievementsScreen() {
    const router = useRouter();
    const { user, updateUser } = useAuthStore();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        refreshUser();
    }, []);

    const refreshUser = async () => {
        try {
            const res = await authApi.getMe();
            updateUser(res.data);
        } catch (err) {
            console.error('Failed to refresh user:', err);
        } finally {
            setLoading(false);
        }
    };

    const badges = user?.badges || [];

    if (loading) {
        return (
            <View className="flex-1 bg-white dark:bg-[#0B0D12] items-center justify-center">
                <ActivityIndicator size="large" color="#F59E0B" />
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-[#0B0D12]">
            <View className="flex-row items-center justify-between px-5 py-6">
                <SoundButton onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
                    <ChevronLeft size={24} color="#AFAFAF" />
                </SoundButton>
                <Text className="text-black dark:text-white font-bold text-xl">Achievements</Text>
                <View className="w-10" />
            </View>

            <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
                {/* Summary */}
                <Animated.View entering={SlideInDown.duration(500).easing(Easing.out(Easing.cubic))} className="bg-black dark:bg-[#1E222B] p-8 rounded-[40px] mb-10 items-center border-2 border-b-4 border-gray-800 dark:border-[#272B36]">
                    <Text className="text-gray-400 font-bold text-sm uppercase tracking-widest mb-2">Badges Earned</Text>
                    <Text className="text-white font-black text-[56px] tracking-tighter">{badges.length}</Text>
                    <View className="flex-row items-center mt-2">
                        <Star size={16} color="#FFC800" fill="#FFC800" />
                        <Text className="text-[#FFC800] font-bold ml-2">{user?.points || 0} XP</Text>
                        <Text className="text-gray-600 dark:text-gray-400 mx-2">•</Text>
                        <Flame size={16} color="#FF9600" fill="#FF9600" />
                        <Text className="text-[#FF9600] font-bold ml-2">{user?.streak || 0} day streak</Text>
                    </View>
                </Animated.View>

                {/* Earned Badges */}
                {badges.length > 0 ? (
                    <>
                        <Text className="text-black dark:text-white font-bold text-lg mb-4">Unlocked</Text>
                        <View className="flex-row flex-wrap gap-4 mb-10">
                            {badges.map((badge: any, index: number) => {
                                const Icon = ICON_MAP[badge.icon] || Award;
                                const isDark = false; // We can't access hook here easily, but we can assume light theme default or let NativeWind handle text colors
                                return (
                                    <Animated.View key={badge.id} entering={SlideInRight.delay(index * 100).duration(500).easing(Easing.out(Easing.cubic))} style={{ width: '47%' }}>
                                        <TactileButton
                                            backgroundColor="#FFFFFF"
                                            shadowColor="#E5E5E5"
                                            depth={4}
                                            borderRadius={28}
                                            style={{ width: '100%', marginBottom: 0 }}
                                            contentClassName="p-5 justify-between"
                                        >
                                            <View
                                                style={{ backgroundColor: (badge.color || '#3B82F6') + '20' }}
                                                className="w-14 h-14 rounded-2xl items-center justify-center mb-3"
                                            >
                                                <Icon size={28} color={badge.color || '#3B82F6'} />
                                            </View>
                                            <Text className="text-[#4B4B4B] font-bold text-[15px] mb-1">{badge.name}</Text>
                                            <Text className="text-[#AFAFAF] font-bold text-[11px] leading-4">{badge.description}</Text>
                                        </TactileButton>
                                    </Animated.View>
                                );
                            })}
                        </View>
                    </>
                ) : (
                    <Animated.View entering={SlideInDown.delay(200).duration(500).easing(Easing.out(Easing.cubic))} className="items-center justify-center py-16">
                        <View className="w-20 h-20 bg-gray-100 dark:bg-[#1E222B] rounded-full items-center justify-center mb-4 border-2 border-b-4 border-[#E5E5E5] dark:border-[#272B36]">
                            <Lock size={36} color="#CECECE" />
                        </View>
                        <Text className="text-black dark:text-white font-bold text-xl mb-2">No badges yet!</Text>
                        <Text className="text-gray-400 dark:text-gray-500 font-medium text-center px-10">Complete lessons, maintain streaks, and earn points to unlock badges.</Text>
                    </Animated.View>
                )}

                <View className="h-20" />
            </ScrollView>
        </SafeAreaView>
    );
}
