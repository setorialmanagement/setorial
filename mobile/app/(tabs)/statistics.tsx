import Animated, { FadeInDown } from 'react-native-reanimated';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrendingUp, Layers, Wallet, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react-native';
import { useState, useEffect, useCallback } from 'react';
import { walletApi } from '../../services/api';

export default function StatisticsScreen() {
    const [balance, setBalance] = useState({ ngn: 0, usd: 0 });
    const [transactions, setTransactions] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        try {
            const [balanceRes, txRes] = await Promise.all([
                walletApi.getBalance(),
                walletApi.getTransactions()
            ]);
            setBalance({
                ngn: balanceRes.data.balance,
                usd: balanceRes.data.balance / (balanceRes.data.exchangeRate || 1600)
            });
            setTransactions(txRes.data);
        } catch (error) {
            console.error('Failed to fetch wallet data:', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    }, []);

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-[#0B0D12]">
            <ScrollView
                className="flex-1 px-5 pt-4 pb-20"
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Header Section */}
                <Text className="text-black dark:text-white text-[28px] font-black tracking-tight mb-8">Wallet</Text>

                {/* Balance Card - Duolingo Gamified Style */}
                <Animated.View entering={FadeInDown.delay(100).springify()} className="bg-[#1CB0F6] border-2 border-b-4 border-[#1899D6] p-8 rounded-[32px] mb-10 overflow-hidden relative">
                    {/* Decorative Background */}
                    <View className="absolute top-[-20] right-[-20] w-40 h-40 bg-white/20 dark:bg-[#0B0D12]/20 rounded-full" />

                    <Text className="text-white/90 font-bold uppercase tracking-widest text-xs mb-2">Total Monetizable Balance</Text>
                    <Text className="text-white text-[42px] font-black tracking-tighter mb-1">
                        ₦{balance.ngn.toLocaleString()}
                    </Text>
                    <Text className="text-white/80 font-bold text-lg mb-2">${balance.usd.toFixed(2)} USD</Text>
                </Animated.View>

                {/* Activity */}
                <Text className="text-black dark:text-white font-bold text-xl tracking-tight mb-4">Payout History</Text>
                {transactions.length > 0 ? (
                    transactions.map((tx, index) => (
                        <Animated.View key={tx.id} entering={FadeInDown.delay(200 + index * 80).springify()} className="flex-row items-center justify-between p-5 mb-3 bg-white dark:bg-[#1E222B] border-2 border-[#E5E5E5] dark:border-[#272B36] border-b-4 rounded-2xl">
                            <View className="flex-row items-center">
                                <View className={`w-12 h-12 rounded-full items-center justify-center border-2 border-b-4 ${tx.amount > 0 ? 'bg-[#DDF4FF] border-[#1CB0F6] dark:bg-[#1CB0F6]/20' : 'bg-[#FFDFDF] border-[#FF4B4B] dark:bg-[#FF4B4B]/20'
                                    } mr-4`}>
                                    {tx.amount > 0 ? (
                                        <ArrowDownLeft size={20} color="#1CB0F6" strokeWidth={3} />
                                    ) : (
                                        <ArrowUpRight size={20} color="#FF4B4B" strokeWidth={3} />
                                    )}
                                </View>
                                <View>
                                    <Text className="text-[#4B4B4B] dark:text-white font-bold text-[17px] mb-1 uppercase tracking-wider">{tx.type.replace('_', ' ')}</Text>
                                    <Text className="text-[#AFAFAF] dark:text-gray-400 font-bold text-xs">{new Date(tx.createdAt).toLocaleDateString()}</Text>
                                </View>
                            </View>
                            <Text className={`font-black text-[17px] ${tx.amount > 0 ? 'text-[#58CC02]' : 'text-[#FF4B4B]'
                                }`}>
                                {tx.amount > 0 ? '+' : ''}₦{Math.abs(tx.amount).toLocaleString()}
                            </Text>
                        </Animated.View>
                    ))
                ) : (
                    <View className="items-center justify-center bg-gray-50 dark:bg-[#131620] p-10 rounded-[32px] border border-gray-100 dark:border-[#272B36]">
                        <Layers size={32} color="#D1D5DB" className="mb-3" />
                        <Text className="text-gray-400 font-medium text-center">No transactions yet.</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
