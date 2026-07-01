import { TactileButton } from '../../components/TactileButton';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Snowflake, Zap, ShoppingBag, CheckCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { storeApi } from '../../services/api';
import * as Linking from 'expo-linking';
import { feedback } from '../../lib/feedback';

export default function StoreScreen() {
    const router = useRouter();
    const [items, setItems] = useState<any[]>([]);
    const [myPowerUps, setMyPowerUps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [buying, setBuying] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [storeRes, powerUpsRes] = await Promise.all([
                storeApi.getStore(),
                storeApi.getMyPowerUps(),
            ]);
            setItems(storeRes.data);
            setMyPowerUps(powerUpsRes.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleBuy = (item: any) => {
        Alert.alert(
            `Buy ${item.name}?`,
            `This costs ₦${item.price} via Paystack checkout.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Buy Now",
                    onPress: async () => {
                        setBuying(item.type);
                        try {
                            // Initialize Paystack transaction
                            const res = await storeApi.buy(item.type);
                            const { authorization_url, reference } = res.data;

                            // Open Paystack checkout in browser
                            await Linking.openURL(authorization_url);

                            // After returning, verify the transaction
                            setTimeout(async () => {
                                try {
                                    const verifyRes = await storeApi.verify(reference);
                                    if (verifyRes.data.status === 'success') {
                                        feedback.victory();
                                        Alert.alert('Success!', `${item.name} activated!`);
                                        fetchData();
                                    } else {
                                        Alert.alert('Pending', 'Payment is being processed. Check back shortly.');
                                    }
                                } catch (err) {
                                    console.log('Verification pending - webhook will handle activation');
                                    Alert.alert('Processing', 'Your payment is being verified. The power-up will appear shortly.');
                                }
                            }, 3000);
                        } catch (error: any) {
                            Alert.alert('Error', error.response?.data?.message || 'Purchase failed');
                        } finally {
                            setBuying('');
                        }
                    }
                }
            ]
        );
    };

    const getIcon = (type: string, color: string) => {
        switch (type) {
            case 'STREAK_FREEZE': return <Snowflake size={32} color={color} />;
            case 'DOUBLE_POINTS': return <Zap size={32} color={color} fill={color} />;
            default: return <ShoppingBag size={32} color={color} />;
        }
    };

    const getGradientColors = (type: string) => {
        switch (type) {
            case 'STREAK_FREEZE': return { bg: '#E8F4FD', border: '#1CB0F6', text: '#1899D6' };
            case 'DOUBLE_POINTS': return { bg: '#FFF8E1', border: '#FFC800', text: '#E5B400' };
            default: return { bg: '#F3E8FF', border: '#CE82FF', text: '#A552DE' };
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-[#0B0D12]">
            <View className="flex-row items-center px-5 py-4 border-b-2 border-[#E5E5E5] dark:border-[#272B36]">
                <View className="flex-1">
                    <Text className="text-black dark:text-white text-xl font-bold">Power-Up Store</Text>
                </View>
            </View>

            <ScrollView className="flex-1 px-5 pt-6">
                {/* Active Power-Ups */}
                {myPowerUps.length > 0 && (
                    <View className="mb-8">
                        <Text className="text-black dark:text-white font-bold text-lg mb-3">Active Power-Ups</Text>
                        {myPowerUps.map((up: any) => (
                            <View key={up.id} className="bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700 rounded-2xl p-4 mb-3 flex-row items-center">
                                <CheckCircle size={20} color="#F59E0B" />
                                <Text className="text-green-700 dark:text-green-300 font-bold ml-3 flex-1">{up.powerUp.name}</Text>
                                {up.expiresAt && (
                                    <Text className="text-green-500 text-xs font-bold">
                                        Expires {new Date(up.expiresAt).toLocaleDateString()}
                                    </Text>
                                )}
                            </View>
                        ))}
                    </View>
                )}

                {/* Store Items */}
                <Text className="text-black dark:text-white font-bold text-lg mb-4">Available</Text>

                {loading ? (
                    <ActivityIndicator size="large" color="#F59E0B" className="mt-10" />
                ) : (
                    items.map((item: any, index: number) => {
                        const colors = getGradientColors(item.type);
                        return (
                            <Animated.View
                                key={item.id}
                                entering={FadeInDown.delay(index * 100).springify()}
                                className="bg-white dark:bg-[#1E222B] border-2 border-b-4 rounded-2xl p-6 mb-5"
                                style={{ borderColor: colors.border }}
                            >
                                <View className="flex-row items-center mb-4">
                                    <View
                                        className="w-16 h-16 rounded-2xl items-center justify-center mr-4"
                                        style={{ backgroundColor: colors.bg }}
                                    >
                                        {getIcon(item.type, colors.text)}
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-black dark:text-white font-bold text-xl">{item.name}</Text>
                                        <Text className="text-gray-500 dark:text-gray-400 mt-1">{item.description}</Text>
                                    </View>
                                </View>

                                <TactileButton
                                    onPress={() => handleBuy(item)}
                                    disabled={buying === item.type}
                                    backgroundColor={colors.border}
                                    shadowColor={colors.text}
                                    contentClassName="py-3 items-center justify-center"
                                    className="rounded-xl"
                                >
                                    <Text className="text-white font-bold text-[15px] uppercase tracking-wider">
                                        {buying === item.type ? 'Processing...' : `Buy for ₦${item.price}`}
                                    </Text>
                                </TactileButton>
                            </Animated.View>
                        );
                    })
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
