import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, MessageCircle, Mail, Phone, ExternalLink, ShieldQuestion, LifeBuoy, BookOpen, Send } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { SoundButton } from '../components/SoundButton';
import { supportApi } from '../services/api';
import Animated, { FadeInUp } from 'react-native-reanimated';

export default function SupportScreen() {
    const router = useRouter();
    const [form, setForm] = useState({ subject: '', message: '' });
    const [loading, setLoading] = useState(false);

    const handleContact = (type: 'whatsapp' | 'email' | 'call') => {
        let url = '';
        if (type === 'whatsapp') url = 'whatsapp://send?phone=+2349000000000';
        if (type === 'email') url = 'mailto:support@setorial.com';
        if (type === 'call') url = 'tel:+2349000000000';
        
        Linking.openURL(url).catch(() => {
            alert('Could not open the app. Please check if you have it installed.');
        });
    };

    const handleSendMessage = async () => {
        if (!form.subject.trim() || !form.message.trim()) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }

        setLoading(true);
        try {
            await supportApi.sendMessage(form);
            Alert.alert('Message Sent', 'Your message has been routed to our admin panel. We will get back to you shortly.');
            setForm({ subject: '', message: '' });
            router.back();
        } catch (error) {
            Alert.alert('Error', 'Failed to send message. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const HELP_CATEGORIES = [
        { title: 'Getting Started', icon: BookOpen, color: '#10B981' },
        { title: 'Payments & Tiers', icon: ShieldQuestion, color: '#F59E0B' },
        { title: 'Mascot & Points', icon: LifeBuoy, color: '#3B82F6' },
    ];

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-[#0B0D12]">
            {/* Header */}
            <View className="flex-row items-center px-5 py-4 border-b-2 border-gray-100 dark:border-gray-800">
                <SoundButton onPress={() => router.back()}>
                    <ChevronLeft size={24} color="#AFAFAF" />
                </SoundButton>
                <Text className="text-black dark:text-white font-bold text-xl ml-4">Support Center</Text>
            </View>

            <ScrollView className="flex-1 px-5 pt-6 pb-20" showsVerticalScrollIndicator={false}>
                {/* Hero Section */}
                <View className="bg-blue-600 p-8 rounded-[32px] mb-8 relative overflow-hidden">
                    <View className="z-10">
                        <Text className="text-white font-black text-2xl mb-2">How can we help you today?</Text>
                        <Text className="text-blue-100 font-medium">Our team is active 24/7 to ensure your learning pride stays strong.</Text>
                    </View>
                    <View className="absolute right-[-20] bottom-[-20] opacity-20">
                        <MessageCircle size={150} color="#FFF" />
                    </View>
                </View>

                {/* Support Form */}
                <Animated.View entering={FadeInUp} className="mb-10 bg-gray-50 dark:bg-[#1E222B] p-6 rounded-[32px] border-2 border-gray-100 dark:border-[#272B36]">
                    <Text className="text-black dark:text-white font-black text-lg mb-4">Send a Message</Text>
                    
                    <View className="mb-4">
                        <Text className="text-gray-500 dark:text-gray-400 font-bold text-xs uppercase mb-2 ml-1">Subject</Text>
                        <TextInput 
                            value={form.subject}
                            onChangeText={(t) => setForm({...form, subject: t})}
                            placeholder="e.g. Subscription issue"
                            placeholderTextColor="#AFAFAF"
                            className="bg-white dark:bg-[#13161C] p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-800 text-black dark:text-white font-medium"
                        />
                    </View>

                    <View className="mb-6">
                        <Text className="text-gray-500 dark:text-gray-400 font-bold text-xs uppercase mb-2 ml-1">Message</Text>
                        <TextInput 
                            value={form.message}
                            onChangeText={(t) => setForm({...form, message: t})}
                            placeholder="Describe your issue in detail..."
                            placeholderTextColor="#AFAFAF"
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            className="bg-white dark:bg-[#13161C] p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-800 text-black dark:text-white font-medium min-h-[120px]"
                        />
                    </View>

                    <TouchableOpacity 
                        onPress={handleSendMessage}
                        disabled={loading}
                        className="bg-[#1CB0F6] border-b-4 border-[#1899D6] p-4 rounded-2xl flex-row items-center justify-center"
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <>
                                <Send size={20} color="#FFF" className="mr-2" />
                                <Text className="text-white font-black text-base uppercase tracking-wider">Send Message</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </Animated.View>

                {/* Contact Options */}
                <Text className="text-black dark:text-white font-black text-lg mb-4">Direct Channels</Text>
                <View className="flex-row justify-between mb-8">
                    <TouchableOpacity 
                        onPress={() => handleContact('whatsapp')}
                        className="bg-green-50 dark:bg-green-950/30 p-5 rounded-3xl items-center flex-1 mr-3 border-2 border-green-100 dark:border-green-900"
                    >
                        <MessageCircle size={28} color="#22C55E" />
                        <Text className="text-green-700 dark:text-green-300 font-bold mt-2 text-xs">WhatsApp</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        onPress={() => handleContact('email')}
                        className="bg-blue-50 dark:bg-blue-950/30 p-5 rounded-3xl items-center flex-1 mr-3 border-2 border-blue-100 dark:border-blue-900"
                    >
                        <Mail size={28} color="#3B82F6" />
                        <Text className="text-blue-700 dark:text-blue-300 font-bold mt-2 text-xs">Email</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        onPress={() => handleContact('call')}
                        className="bg-orange-50 dark:bg-orange-950/30 p-5 rounded-3xl items-center flex-1 border-2 border-orange-100 dark:border-orange-900"
                    >
                        <Phone size={28} color="#F59E0B" />
                        <Text className="text-orange-700 dark:text-orange-300 font-bold mt-2 text-xs">Call Us</Text>
                    </TouchableOpacity>
                </View>

                {/* Help Categories */}
                <Text className="text-black dark:text-white font-black text-lg mb-4">Help Categories</Text>
                {HELP_CATEGORIES.map((cat, idx) => (
                    <TouchableOpacity 
                        key={idx}
                        className="flex-row items-center justify-between p-5 mb-4 bg-gray-50 dark:bg-[#1E222B] rounded-2xl border-2 border-gray-100 dark:border-[#272B36]"
                    >
                        <View className="flex-row items-center">
                            <View 
                                style={{ backgroundColor: cat.color + '20' }}
                                className="w-10 h-10 rounded-xl items-center justify-center mr-4"
                            >
                                <cat.icon size={20} color={cat.color} />
                            </View>
                            <Text className="text-black dark:text-white font-bold text-base">{cat.title}</Text>
                        </View>
                        <ExternalLink size={18} color="#AFAFAF" />
                    </TouchableOpacity>
                ))}

                <View className="py-10 items-center">
                    <Text className="text-gray-400 dark:text-gray-600 font-bold text-[10px] uppercase tracking-widest">Version 1.0.5 - Setorial Global</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
