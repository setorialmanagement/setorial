import { SoundButton } from '../components/SoundButton';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, Modal, FlatList } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, ShieldCheck, Building, Globe, CheckCircle2, Clock, Search, ChevronDown, Check } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useMemo } from 'react';
import { kycApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function VerificationScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const kycStatus = (user as any)?.kycStatus || 'UNVERIFIED';

    const [method, setMethod] = useState<'NGN_BANK' | 'USD_PAYPAL'>('NGN_BANK');

    // Bank selection states
    const [banks, setBanks] = useState<any[]>([]);
    const [selectedBank, setSelectedBank] = useState<any>(null);
    const [showBankPicker, setShowBankPicker] = useState(false);
    const [bankSearch, setBankSearch] = useState('');

    const [accountNumber, setAccountNumber] = useState('');
    const [accountName, setAccountName] = useState(''); // Resolved name
    const [paypalEmail, setPaypalEmail] = useState('');

    const [loadingBanks, setLoadingBanks] = useState(false);
    const [resolvingAccount, setResolvingAccount] = useState(false);
    const [saving, setSaving] = useState(false);

    const isEligible = ['SILVER', 'GOLD'].includes(user?.tier || '');

    useEffect(() => {
        if (isEligible && method === 'NGN_BANK') {
            fetchBanks();
        }
    }, [method]);

    // Auto-resolve account when number is 10 digits
    useEffect(() => {
        if (method === 'NGN_BANK' && selectedBank && accountNumber.length === 10) {
            handleResolveAccount();
        } else if (accountNumber.length < 10) {
            setAccountName('');
        }
    }, [accountNumber, selectedBank]);

    const fetchBanks = async () => {
        setLoadingBanks(true);
        try {
            const res = await kycApi.getBanks();
            setBanks(res.data);
        } catch (error) {
            console.error('Failed to fetch banks', error);
        } finally {
            setLoadingBanks(false);
        }
    };

    const handleResolveAccount = async () => {
        setResolvingAccount(true);
        try {
            const res = await kycApi.resolveAccount(accountNumber, selectedBank.code);
            if (res.data && res.data.account_name) {
                setAccountName(res.data.account_name);
            }
        } catch (error: any) {
            console.warn('Resolution failed', error.response?.data?.message);
            setAccountName('');
        } finally {
            setResolvingAccount(false);
        }
    };

    const filteredBanks = useMemo(() => {
        return banks.filter(b => b.name.toLowerCase().includes(bankSearch.toLowerCase()));
    }, [banks, bankSearch]);

    const handleSubmit = async () => {
        if (method === 'NGN_BANK') {
            if (!selectedBank || !accountNumber || !accountName) {
                Alert.alert('Missing Fields', 'Please select a bank and enter a valid account number.');
                return;
            }
        } else {
            if (!paypalEmail) {
                Alert.alert('Missing Fields', 'Please enter your PayPal email.');
                return;
            }
        }

        setSaving(true);
        try {
            const payoutAccount = method === 'NGN_BANK'
                ? {
                    bankName: selectedBank.name,
                    bankCode: selectedBank.code,
                    accountNumber,
                    accountName
                }
                : { email: paypalEmail };

            await kycApi.submitKyc({ payoutMethod: method, payoutAccount });

            // Refresh local user data if possible (here we just notify)
            Alert.alert(
                'Submitted!',
                status === 'APPROVED'
                    ? 'Your KYC has been automatically approved!'
                    : 'Your payout details have been submitted for review. If approved, you will be notified.',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Failed to submit verification';
            Alert.alert('Error', msg);
        } finally {
            setSaving(false);
        }
    };

    const renderStatus = () => {
        switch (kycStatus) {
            case 'APPROVED':
                return (
                    <View className="flex-row items-center bg-green-100 dark:bg-green-900/30 px-4 py-3 rounded-2xl border-2 border-green-200 dark:border-green-800 mb-6">
                        <CheckCircle2 size={24} color="#16A34A" />
                        <View className="ml-3 flex-1">
                            <Text className="text-green-800 dark:text-green-400 font-bold text-[15px]">Verification Approved</Text>
                            <Text className="text-green-700 dark:text-green-500 font-bold text-xs">Your payout account is verified. Payouts are automated on the 28th.</Text>
                        </View>
                    </View>
                );
            case 'PENDING':
                return (
                    <View className="flex-row items-center bg-yellow-50 dark:bg-yellow-900/20 px-4 py-3 rounded-2xl border-2 border-yellow-200 dark:border-yellow-800 mb-6">
                        <Clock size={24} color="#CA8A04" />
                        <View className="ml-3 flex-1">
                            <Text className="text-yellow-800 dark:text-yellow-400 font-bold text-[15px]">Manual Review Needed</Text>
                            <Text className="text-yellow-700 dark:text-yellow-500 font-bold text-xs">Your account name did not perfectly match your registration name. An admin will review it within 24–48 hours.</Text>
                        </View>
                    </View>
                );
            case 'REJECTED':
                return (
                    <View className="flex-row items-center bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-2xl border-2 border-red-200 dark:border-red-800 mb-6">
                        <ShieldCheck size={24} color="#DC2626" />
                        <View className="ml-3 flex-1">
                            <Text className="text-red-800 dark:text-red-400 font-bold text-[15px]">Verification Rejected</Text>
                            <Text className="text-red-700 dark:text-red-500 font-bold text-xs">Please resubmit with correct details or contact support.</Text>
                        </View>
                    </View>
                );
            default:
                return null;
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-[#0B0D12]">
            <View className="flex-row items-center justify-between px-5 py-6">
                <SoundButton onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
                    <ChevronLeft size={24} color="#AFAFAF" />
                </SoundButton>
                <Text className="text-black dark:text-white font-bold text-xl">Monetization Setup</Text>
                <View className="w-10" />
            </View>

            <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
                {renderStatus()}

                {!isEligible && (
                    <View className="bg-gray-50 dark:bg-[#1E222B] p-6 rounded-[28px] border-2 border-[#E5E5E5] dark:border-[#272B36] border-b-4 mb-6">
                        <ShieldCheck size={28} color="#AFAFAF" />
                        <Text className="text-black dark:text-white font-bold text-lg mt-3 mb-1">Silver or Gold Required</Text>
                        <Text className="text-[#AFAFAF] dark:text-gray-400 font-bold leading-5">
                            Only Silver and Gold tier subscribers can earn. Upgrade your tier to activate monetization.
                        </Text>
                    </View>
                )}

                {isEligible && kycStatus !== 'APPROVED' && (
                    <>
                        <View className="bg-[#0B0D12] dark:bg-[#1E222B] p-6 rounded-[28px] mb-8">
                            <Text className="text-white font-black text-[22px] leading-tight mb-4">Smart Verification</Text>
                            <View className="mb-4">
                                <Text className="text-gray-400 font-bold leading-5 mb-2">• Minimum 12 months of consistent activity is required to be eligible for monetization.</Text>
                                <Text className="text-gray-400 font-bold leading-5 mb-2">• Standardized assessment test must be passed.</Text>
                                <Text className="text-gray-400 font-bold leading-5 mb-2">• 30 consecutive days of inactivity will reset the cycle.</Text>
                                <Text className="text-gray-400 font-bold leading-5">• Payouts are processed on the 28th of every month.</Text>
                            </View>
                            <Text className="text-[#58CC02] font-bold leading-5 text-[13px]">
                                Link your account holding exactly your registration name for faster approval.
                            </Text>
                        </View>

                        <Text className="text-[#AFAFAF] dark:text-gray-400 font-bold text-xs uppercase tracking-widest mb-3">Payout Method</Text>
                        <View className="flex-row gap-x-4 mb-8">
                            <SoundButton
                                activeOpacity={0.8}
                                onPress={() => setMethod('NGN_BANK')}
                                className={`flex-1 p-5 rounded-2xl border-2 border-b-4 items-center ${method === 'NGN_BANK' ? 'bg-[#1CB0F6] border-[#1899D6]' : 'bg-white dark:bg-[#1E222B] border-[#E5E5E5] dark:border-[#272B36]'}`}
                            >
                                <Building size={28} color={method === 'NGN_BANK' ? '#FFF' : '#AFAFAF'} />
                                <Text className={`font-bold mt-2 text-sm ${method === 'NGN_BANK' ? 'text-white' : 'text-[#AFAFAF] dark:text-gray-400'}`}>NGN Bank</Text>
                            </SoundButton>
                            <SoundButton
                                activeOpacity={0.8}
                                onPress={() => setMethod('USD_PAYPAL')}
                                className={`flex-1 p-5 rounded-2xl border-2 border-b-4 items-center ${method === 'USD_PAYPAL' ? 'bg-[#1CB0F6] border-[#1899D6]' : 'bg-white dark:bg-[#1E222B] border-[#E5E5E5] dark:border-[#272B36]'}`}
                            >
                                <Globe size={28} color={method === 'USD_PAYPAL' ? '#FFF' : '#AFAFAF'} />
                                <Text className={`font-bold mt-2 text-sm ${method === 'USD_PAYPAL' ? 'text-white' : 'text-[#AFAFAF] dark:text-gray-400'}`}>PayPal</Text>
                            </SoundButton>
                        </View>

                        {method === 'NGN_BANK' && (
                            <>
                                <Text className="text-[#AFAFAF] dark:text-gray-400 font-bold text-xs uppercase tracking-widest mb-2">Select Bank</Text>
                                <SoundButton
                                    onPress={() => setShowBankPicker(true)}
                                    className="bg-white dark:bg-[#1E222B] p-5 rounded-2xl border-2 border-b-4 border-[#E5E5E5] dark:border-[#272B36] flex-row items-center justify-between mb-5"
                                >
                                    <View className="flex-row items-center">
                                        <Building size={20} color={selectedBank ? (user?.tier === 'GOLD' ? '#FFC800' : '#1CB0F6') : '#AFAFAF'} />
                                        <Text className={`font-bold text-[17px] ml-3 ${selectedBank ? 'text-[#4B4B4B] dark:text-white' : 'text-[#AFAFAF]'}`}>
                                            {selectedBank ? selectedBank.name : 'Choose your bank...'}
                                        </Text>
                                    </View>
                                    <ChevronDown size={20} color="#AFAFAF" />
                                </SoundButton>

                                <Text className="text-[#AFAFAF] dark:text-gray-400 font-bold text-xs uppercase tracking-widest mb-2">Account Number</Text>
                                <TextInput
                                    value={accountNumber}
                                    onChangeText={setAccountNumber}
                                    placeholder="10-digit NUMBER"
                                    placeholderTextColor="#94A3B8"
                                    keyboardType="numeric"
                                    maxLength={10}
                                    className="bg-white dark:bg-[#1E222B] p-5 rounded-2xl text-[#4B4B4B] dark:text-white font-bold text-[17px] border-2 border-b-4 border-[#E5E5E5] dark:border-[#272B36] mb-5"
                                />

                                {resolvingAccount && (
                                    <View className="flex-row items-center mb-5 px-1">
                                        <ActivityIndicator size="small" color="#F59E0B" />
                                        <Text className="text-[#1CB0F6] font-bold ml-2">Identifying account name...</Text>
                                    </View>
                                )}

                                {accountName ? (
                                    <View className="bg-green-50 dark:bg-green-900/10 p-5 rounded-2xl border-2 border-green-100 dark:border-green-800/30 mb-8">
                                        <Text className="text-[#AFAFAF] dark:text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-1">Verify Account Name</Text>
                                        <Text className="text-green-600 dark:text-green-400 font-black text-xl uppercase">{accountName}</Text>
                                        <View className="flex-row items-center mt-2">
                                            <CheckCircle2 size={14} color="#16A34A" />
                                            <Text className="text-green-600 dark:text-green-400 font-bold text-xs ml-1">Resolution successful</Text>
                                        </View>
                                    </View>
                                ) : (
                                    <View className="h-4" />
                                )}
                            </>
                        )}

                        {method === 'USD_PAYPAL' && (
                            <>
                                <Text className="text-[#AFAFAF] dark:text-gray-400 font-bold text-xs uppercase tracking-widest mb-2">PayPal Email</Text>
                                <TextInput
                                    value={paypalEmail}
                                    onChangeText={setPaypalEmail}
                                    placeholder="you@email.com"
                                    placeholderTextColor="#94A3B8"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    className="bg-white dark:bg-[#1E222B] p-5 rounded-2xl text-[#4B4B4B] dark:text-white font-bold text-[17px] border-2 border-b-4 border-[#E5E5E5] dark:border-[#272B36] mb-8"
                                />
                            </>
                        )}

                        <SoundButton
                            activeOpacity={0.8}
                            onPress={handleSubmit}
                            disabled={saving || (method === 'NGN_BANK' && !accountName)}
                            className={`py-5 rounded-2xl items-center flex-row justify-center border-b-4 mb-10 ${saving || (method === 'NGN_BANK' && !accountName) ? 'bg-[#E5E5E5] dark:bg-[#272B36] border-[#CECECE]' : 'bg-[#58CC02] border-[#58A700]'}`}
                        >
                            {saving ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <>
                                    <ShieldCheck size={20} color="#FFF" />
                                    <Text className="text-white font-bold text-[17px] uppercase tracking-wider ml-2">
                                        {kycStatus === 'REJECTED' ? 'Resubmit Verification' : 'Link Account'}
                                    </Text>
                                </>
                            )}
                        </SoundButton>
                    </>
                )}
            </ScrollView>

            {/* Bank Picker Modal */}
            <Modal visible={showBankPicker} animationType="slide" transparent={true}>
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white dark:bg-[#1E222B] rounded-t-[32px] h-[80%] pt-6">
                        <View className="flex-row items-center justify-between px-6 mb-6">
                            <Text className="text-black dark:text-white font-black text-2xl">Select Bank</Text>
                            <SoundButton onPress={() => setShowBankPicker(false)} className="p-2">
                                <Text className="text-[#1CB0F6] font-bold text-[17px]">Done</Text>
                            </SoundButton>
                        </View>

                        <View className="px-6 mb-4">
                            <View className="flex-row items-center bg-[#F5F5F5] dark:bg-[#0B0D12] p-4 rounded-2xl border-2 border-[#E5E5E5] dark:border-[#272B36]">
                                <Search size={20} color="#AFAFAF" />
                                <TextInput
                                    placeholder="Search banks..."
                                    placeholderTextColor="#AFAFAF"
                                    value={bankSearch}
                                    onChangeText={setBankSearch}
                                    className="flex-1 ml-3 text-black dark:text-white font-bold"
                                />
                            </View>
                        </View>

                        {loadingBanks ? (
                            <ActivityIndicator size="large" color="#F59E0B" className="mt-10" />
                        ) : (
                            <FlatList
                                data={filteredBanks}
                                keyExtractor={(item) => item.id.toString()}
                                px-6
                                contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
                                renderItem={({ item }) => (
                                    <SoundButton
                                        onPress={() => {
                                            setSelectedBank(item);
                                            setShowBankPicker(false);
                                        }}
                                        className="py-5 border-b border-[#E5E5E5] dark:border-[#272B36] flex-row items-center justify-between"
                                    >
                                        <Text className={`font-bold text-[17px] ${selectedBank?.id === item.id ? 'text-[#1CB0F6]' : 'text-[#4B4B4B] dark:text-gray-300'}`}>
                                            {item.name}
                                        </Text>
                                        {selectedBank?.id === item.id && <Check size={20} color="#1CB0F6" />}
                                    </SoundButton>
                                )}
                            />
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
