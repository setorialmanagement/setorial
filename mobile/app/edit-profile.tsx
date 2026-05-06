import { SoundButton } from '../components/SoundButton';
import { View, Text, TouchableOpacity, SafeAreaView, TextInput, ActivityIndicator, Alert, Image, Platform } from 'react-native';
import { ChevronLeft, Camera } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../services/api';
import { useState } from 'react';

import * as ImagePicker from 'expo-image-picker';
import LottieView from 'lottie-react-native';

export default function EditProfileScreen() {
    const router = useRouter();
    const { user, updateUser } = useAuthStore();
    const [name, setName] = useState(user?.name || '');
    const [saving, setSaving] = useState(false);
    const [image, setImage] = useState<string | null>(null);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) return;
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('name', name.trim());

            if (image) {
                const uriParts = image.split('.');
                const fileType = uriParts[uriParts.length - 1];

                formData.append('avatar', {
                    uri: image,
                    name: `avatar.${fileType}`,
                    type: `image/${fileType}`,
                } as any);
            }

            const res = await authApi.updateProfile(formData);
            
            updateUser({ 
                name: res.data.name,
                avatarUrl: res.data.avatarUrl
            });
            
            Alert.alert('Success', 'Profile updated successfully');
            router.back();
        } catch (error: any) {
            console.error('Update failed:', error.response?.data || error.message);
            Alert.alert('Error', 'Failed to update profile');
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
                <Text className="text-black dark:text-white font-bold text-xl">Edit Profile</Text>
                <SoundButton activeOpacity={0.8} onPress={handleSave} disabled={saving} className="bg-[#1CB0F6] px-5 py-2 rounded-xl border-b-4 border-[#1899D6]">
                    {saving ? (
                        <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                        <Text className="text-white font-bold text-sm tracking-widest uppercase">Save</Text>
                    )}
                </SoundButton>
            </View>

            <View className="px-5">
                {/* Avatar */}
                <View className="items-center mb-10">
                    <View className="relative">
                        <View className="w-28 h-28 rounded-full bg-gray-100 dark:bg-[#1E222B] items-center justify-center border-4 border-white dark:border-[#0B0D12] shadow-md overflow-hidden">
                            {image || user?.avatarUrl ? (
                                <Image source={{ uri: image || user?.avatarUrl || '' }} className="w-full h-full" />
                            ) : (
                                <LottieView
                                    autoPlay
                                    loop
                                    source={require('../assets/animations/happy.json')}
                                    style={{ width: 130, height: 130 }}
                                    renderMode="SOFTWARE"
                                    resizeMode="contain"
                                    cacheComposition={true}
                                />
                            )}
                        </View>
                        <SoundButton
                            onPress={pickImage}
                            activeOpacity={0.8}
                            className="absolute bottom-0 right-0 bg-black w-10 h-10 rounded-full items-center justify-center border-4 border-white dark:border-[#0B0D12]"
                        >
                            <Camera size={16} color="#FFF" />
                        </SoundButton>
                    </View>
                </View>

                {/* Name */}
                <Text className="text-[#AFAFAF] dark:text-gray-400 font-bold text-xs uppercase tracking-widest mb-2">Full Name</Text>
                <TextInput
                    value={name}
                    onChangeText={setName}
                    className="bg-white dark:bg-[#1E222B] p-5 rounded-2xl text-[#4B4B4B] dark:text-white font-bold text-[17px] border-2 border-b-4 border-[#E5E5E5] dark:border-[#272B36] mb-6"
                    placeholder="Your name"
                    placeholderTextColor="#94A3B8"
                />

                {/* Email (read-only) */}
                <Text className="text-[#AFAFAF] dark:text-gray-400 font-bold text-xs uppercase tracking-widest mb-2">Email</Text>
                <View className="bg-[#F5F5F5] dark:bg-[#2A2E39] p-5 rounded-2xl border-2 border-[#E5E5E5] dark:border-[#272B36] mb-6">
                    <Text className="text-[#AFAFAF] dark:text-gray-400 font-bold text-[17px]">{user?.email || ''}</Text>
                </View>

                {/* Tier */}
                <Text className="text-[#AFAFAF] dark:text-gray-400 font-bold text-xs uppercase tracking-widest mb-2">Current Tier</Text>
                <View className="bg-[#F5F5F5] dark:bg-[#2A2E39] p-5 rounded-2xl border-2 border-[#E5E5E5] dark:border-[#272B36]">
                    <Text className="text-[#AFAFAF] dark:text-gray-400 font-bold text-[17px]">{user?.tier || 'FREE'}</Text>
                </View>
            </View>
        </SafeAreaView>
    );
}
