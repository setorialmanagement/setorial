import { SoundButton } from '../components/SoundButton';
import { TactileButton } from '../components/TactileButton';
import { View, Text, TouchableOpacity, SafeAreaView, ActivityIndicator, ScrollView, Dimensions, useColorScheme, Linking } from "react-native";
import { ChevronLeft, CheckCircle2, XCircle, Trophy, ArrowRight, Home, BookOpen, Heart, RefreshCcw } from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import { useVideoPlayer, VideoView } from 'expo-video';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideInRight, SlideOutLeft, useSharedValue, useAnimatedStyle, withSpring, withSequence, withTiming } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { learningApi } from "../services/api";
import { MathText } from "../components/MathText";
import { feedback } from "../lib/feedback";
import { MascotInteraction } from '../components/MascotInteraction';
import { FillInTheBlank } from '../components/FillInTheBlank';
import { useAuthStore } from '../store/authStore';

const { width } = Dimensions.get('window');

// Replaces the old lightweight renderer and delegates all rendering (Markdown + LaTeX)
// to the powerful MathText component which parses it in a single unified block
function MarkdownText({ content }: { content: string }) {
    return <MathText content={content} fontSize={16} />;
}

export default function LevelScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    
    const [lesson, setLesson] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [phase, setPhase] = useState<'reading' | 'questions' | 'finished'>('reading');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [showNext, setShowNext] = useState(false);
    const [answers, setAnswers] = useState<number[]>([]);
    const [result, setResult] = useState<any>(null);
    const [submitting, setSubmitting] = useState(false);
    const [hearts, setHearts] = useState(5);
    const [showResumePrompt, setShowResumePrompt] = useState(false);
    const [savedSession, setSavedSession] = useState<any>(null);

    // Animation values
    const checkScale = useSharedValue(1);
    const buttonStyle = useAnimatedStyle(() => ({
        transform: [{ scale: checkScale.value }]
    }));

    const progress = useSharedValue(0);
    const progressStyle = useAnimatedStyle(() => ({
        width: `${progress.value * 100}%`
    }));

    useEffect(() => {
        if (lesson?.questions?.length > 0) {
            progress.value = withSpring(currentIndex / lesson.questions.length, {
                damping: 15,
                stiffness: 90
            });
        }
    }, [currentIndex, lesson]);

    useEffect(() => {
        if (id) {
            checkSavedSession();
            fetchLesson();
        }
    }, [id]);

    const checkSavedSession = async () => {
        try {
            const data = await AsyncStorage.getItem(`lesson_session_${id}`);
            if (data) {
                const session = JSON.parse(data);
                setSavedSession(session);
                setShowResumePrompt(true);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchLesson = async () => {
        try {
            const res = await learningApi.getLesson(id as string);
            setLesson(res.data);
            if (!res.data.content) setPhase('questions');
        } catch (error) {
            console.error('Failed to fetch lesson:', error);
        } finally {
            setLoading(false);
        }
    };

    const resumeSession = () => {
        if (savedSession) {
            setCurrentIndex(savedSession.currentIndex || 0);
            setAnswers(savedSession.answers || []);
            setHearts(savedSession.hearts ?? 5);
            setPhase('questions');
        }
        setShowResumePrompt(false);
    };

    const startFresh = async () => {
        await AsyncStorage.removeItem(`lesson_session_${id}`);
        setShowResumePrompt(false);
    };

    // Save session whenever state changes
    useEffect(() => {
        if (phase === 'questions' && lesson) {
            AsyncStorage.setItem(`lesson_session_${id}`, JSON.stringify({
                currentIndex,
                answers,
                hearts
            })).catch(() => {});
        }
    }, [currentIndex, answers, hearts, phase]);

    const handleOptionSelect = (index: number | null) => {
        if (showNext) return;
        setSelectedOption(index);
        if (index !== null) {
            feedback.optionSelect();
            checkScale.value = withSequence(withSpring(1.05), withSpring(1));
        }
    };

    const handleCheck = () => {
        if (selectedOption === null) return;
        const correct = lesson.questions[currentIndex].correctOption === selectedOption;
        setIsCorrect(correct);
        setShowNext(true);
        checkScale.value = withSequence(withSpring(1.1, { damping: 10, stiffness: 200 }), withSpring(1));
        // Duolingo-style feedback
        if (correct) {
            feedback.correctAnswer();
        } else {
            feedback.wrongAnswer();
            setHearts(prev => Math.max(0, prev - 1));
        }
    };

    const handleNext = () => {
        const newAnswers = [...answers, selectedOption!];
        setAnswers(newAnswers);
        setSelectedOption(null);
        setIsCorrect(null);
        setShowNext(false);

        if (currentIndex < lesson.questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            submitLesson(newAnswers);
        }
    };

    const submitLesson = async (finalAnswers: number[]) => {
        setSubmitting(true);
        try {
            await AsyncStorage.removeItem(`lesson_session_${id}`);
            const res = await learningApi.submitLesson({
                lessonId: id as string,
                answers: finalAnswers
            });
            setResult(res.data);
            setPhase('finished');
            // Celebration or retry feedback
            if (res.data.passed) {
                feedback.victory();
                // Check for streak update and show celebration
                try {
                    const { user, updateUser } = useAuthStore.getState();
                    const oldStreak = user?.streak || 0;
                    // Refresh user profile to get updated streak
                    const meRes = await import('../services/api').then(m => m.authApi.getMe());
                    if (meRes.data) {
                        await updateUser(meRes.data);
                        const newStreak = meRes.data.streak || 0;
                        if (newStreak > oldStreak && newStreak >= 2) {
                            // Navigate to streak celebration after a short delay
                            setTimeout(() => {
                                router.push({ pathname: '/streak-celebration', params: { streak: String(newStreak) } });
                            }, 1500);
                        }
                    }
                } catch (e) {
                    // Silently fail - streak celebration is non-critical
                    console.log('Streak check failed:', e);
                }
            } else {
                feedback.tryAgain();
            }
        } catch (error) {
            console.error('Failed to submit lesson:', error);
            alert('Failed to submit lesson. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const isYouTube = lesson?.videoUrl && /youtube\.com|youtu\.be/.test(lesson.videoUrl);

    const player = useVideoPlayer((!isYouTube ? (lesson?.videoUrl || '') : ''), (player) => {
        player.loop = false;
    });

    // External YouTube links will open in YouTube/browser (not embedded in-app).

    if (loading) {
        return (
            <View className="flex-1 bg-white dark:bg-[#0B0D12] items-center justify-center">
                <ActivityIndicator size="large" color="#F59E0B" />
            </View>
        );
    }

    if (!lesson) {
        return (
            <View className="flex-1 bg-white dark:bg-[#0B0D12] items-center justify-center p-5">
                <Text className="text-gray-500 dark:text-gray-400 mb-4">Lesson not found</Text>
                <SoundButton onPress={() => router.back()} className="bg-black px-6 py-3 rounded-full">
                    <Text className="text-white font-bold">Go Back</Text>
                </SoundButton>
            </View>
        );
    }

    if (showResumePrompt && lesson && phase === 'reading') {
        return (
            <SafeAreaView className="flex-1 bg-white dark:bg-[#0B0D12]">
                <View className="flex-1 items-center justify-center px-8">
                    <View className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full items-center justify-center mb-6">
                        <RefreshCcw size={48} color="#1899D6" />
                    </View>
                    <Text className="text-3xl font-black text-center text-gray-900 dark:text-white mb-4">Resume Lesson?</Text>
                    <Text className="text-gray-500 dark:text-gray-400 text-lg text-center mb-10 font-medium">
                        We saved your progress from last time. Would you like to pick up where you left off?
                    </Text>
                    
                    <View className="w-full">
                        <TactileButton 
                            onPress={resumeSession} 
                            backgroundColor="#1CB0F6"
                            shadowColor="#1899D6"
                            contentClassName="w-full p-4 items-center justify-center"
                            className="mb-4"
                        >
                            <Text className="text-white font-bold text-[17px] uppercase tracking-wider">Resume</Text>
                        </TactileButton>
                        
                        <TactileButton 
                            onPress={startFresh} 
                            backgroundColor={isDark ? '#0B0D12' : '#FFFFFF'}
                            shadowColor={isDark ? '#1E222B' : '#E5E5E5'}
                            contentClassName="w-full p-4 items-center justify-center"
                        >
                            <Text className="text-gray-500 dark:text-gray-400 font-bold text-[17px] uppercase tracking-wider">Start Over</Text>
                        </TactileButton>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    if (phase === 'questions' && hearts === 0) {
        return (
            <SafeAreaView className="flex-1 bg-white dark:bg-[#0B0D12]">
                <View className="flex-1 px-8 items-center justify-center">
                    <Animated.View entering={FadeIn} className="items-center w-full">
                        <View className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full items-center justify-center mb-6">
                            <Heart size={48} color="#FF4B4B" fill="#FF4B4B" />
                        </View>
                        <Text className="text-3xl font-black text-black dark:text-white mb-2">Out of Hearts!</Text>
                        <Text className="text-gray-500 dark:text-gray-400 text-lg mb-8 font-medium text-center">
                            You've made too many mistakes. Restart the level to try again.
                        </Text>
                        <TactileButton
                            onPress={() => {
                                setHearts(5);
                                setCurrentIndex(0);
                                setAnswers([]);
                                setSelectedOption(null);
                                setIsCorrect(null);
                                setShowNext(false);
                            }}
                            backgroundColor="#1CB0F6"
                            shadowColor="#1899D6"
                            contentClassName="w-full p-4 items-center justify-center"
                            className="mb-4"
                        >
                            <Text className="text-white font-bold text-[17px] uppercase tracking-wider">Restart Level</Text>
                        </TactileButton>
                        <SoundButton
                            activeOpacity={0.8}
                            onPress={() => router.back()}
                            className="bg-transparent w-full p-4 items-center justify-center"
                        >
                            <Text className="text-gray-500 dark:text-gray-400 font-bold text-[17px] uppercase tracking-wider">Quit</Text>
                        </SoundButton>
                    </Animated.View>
                </View>
            </SafeAreaView>
        );
    }

    if (phase === 'reading') {
        return (
            <SafeAreaView className="flex-1 bg-white dark:bg-[#0B0D12]">
                <View className="flex-row items-center justify-between p-5 border-b-2 border-gray-100 dark:border-gray-800">
                    <SoundButton onPress={() => router.back()} className="w-10 h-10 flex items-center justify-center -ml-2">
                        <XCircle size={28} color="#AFAFAF" />
                    </SoundButton>
                    <Text className="font-bold text-lg text-gray-800 dark:text-white">Learn</Text>
                    <View className="w-10 h-10" />
                </View>

                <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
                    {lesson.videoUrl && (
                        <View className="mb-6 rounded-2xl overflow-hidden border-2 border-gray-100 dark:border-gray-800 bg-black">
                            {isYouTube ? (
                                <View style={{ width: '100%', height: 210, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
                                    <TouchableOpacity onPress={() => Linking.openURL(lesson.videoUrl)} className="px-4 py-3 rounded-md bg-red-600">
                                        <Text className="text-white font-bold">Open in YouTube</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <VideoView
                                    player={player}
                                    style={{ width: '100%', height: 210 }}
                                    contentFit="contain"
                                    allowsFullscreen
                                />
                            )}
                        </View>
                    )}
                    <View className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-2xl items-center justify-center mb-6">
                        <BookOpen size={28} color="#1899D6" />
                    </View>
                    <Text className="text-2xl font-black text-gray-900 dark:text-white mb-6 leading-tight">{lesson.name}</Text>
                    <MarkdownText content={lesson.content || ''} />
                    <View className="mt-8">
                        <MascotInteraction 
                            state="thinking" 
                            message="Pay attention! I'll be testing you on this in a minute. 😉" 
                        />
                    </View>
                    <View className="h-20" />
                </ScrollView>

                <View className="p-5 border-t-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-[#0B0D12]">
                    <View className="mb-4 items-center">
                        <Text className="text-gray-400 dark:text-gray-500 font-bold text-xs uppercase tracking-widest">Pass Requirement: 60%</Text>
                    </View>
                    <TactileButton
                        onPress={() => lesson.questions?.length > 0 ? setPhase('questions') : submitLesson([])}
                        backgroundColor="#1CB0F6"
                        shadowColor="#1899D6"
                        contentClassName="p-4 items-center justify-center"
                    >
                        <Text className="text-white font-bold text-[17px] uppercase tracking-wider">
                            {lesson.questions?.length > 0 ? 'Start Exercises' : 'Complete Lesson'}
                        </Text>
                    </TactileButton>
                </View>
            </SafeAreaView>
        );
    }

    if (phase === 'finished') {
        return (
            <SafeAreaView className="flex-1 bg-white dark:bg-[#0B0D12]">
                <View className="flex-1 px-8 items-center justify-center">
                    <Animated.View entering={FadeIn} className="items-center w-full">
                    <View className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full items-center justify-center mb-6">
                        <Trophy size={48} color="#58CC02" />
                    </View>
                    <Text className="text-3xl font-black text-black dark:text-white mb-2">
                        {result?.passed ? 'Lesson Complete!' : 'Keep Training!'}
                    </Text>
                    
                    {lesson.questions?.length > 0 && (
                        <Text className="text-gray-500 dark:text-gray-400 text-lg mb-8 font-medium">
                            {result?.passed 
                                ? `You scored ${result?.score} out of ${result?.total}`
                                : `You need ${Math.ceil(result?.total * 0.6)} to unlock the next level.`
                            }
                        </Text>
                    )}

                    <View className="bg-gray-50 dark:bg-[#1E222B] w-full p-6 rounded-[24px] mb-10 border-2 border-gray-100 dark:border-gray-800">
                        <View className="flex-row justify-between mb-4 items-center">
                            <Text className="text-gray-500 dark:text-gray-400 font-bold text-[15px] uppercase">XP Earned</Text>
                            <Text className="text-[#FFC800] dark:text-[#FFD900] font-black text-xl">+{result?.pointsEarned} XP</Text>
                        </View>
                        <View className="h-[2px] bg-gray-200 dark:bg-[#272B36] mb-4" />
                        <View className="flex-row justify-between items-center">
                            <Text className="text-gray-500 dark:text-gray-400 font-bold text-[15px] uppercase">Status</Text>
                            <Text className={`${result?.passed ? 'text-[#58CC02]' : 'text-[#FF4B4B]'} font-black text-lg`}>
                                {result?.passed ? 'PASSED' : 'RETRY REQUIRED'}
                            </Text>
                        </View>
                    </View>

                    <TactileButton
                        onPress={() => result?.passed ? router.back() : setPhase('questions')}
                        backgroundColor={result?.passed ? '#58CC02' : '#1CB0F6'}
                        shadowColor={result?.passed ? '#46A302' : '#1899D6'}
                        contentClassName="w-full p-4 items-center justify-center"
                    >
                        <Text className="text-white font-bold text-[17px] uppercase tracking-wider">
                            {result?.passed ? 'Continue' : 'Try Again'}
                        </Text>
                    </TactileButton>
                </Animated.View>
                </View>
            </SafeAreaView>
        );
    }

    const currentQuestion = lesson.questions[currentIndex];
    const progressPercent = ((currentIndex) / lesson.questions.length) * 100;
    const isFillInTheBlank = currentQuestion ? /___|__\d+__/.test(currentQuestion.text) : false;

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-[#0B0D12]">
            <View className="flex-1 px-5 pt-5 pb-2">
                <View className="flex-row items-center justify-between mb-8">
                    <SoundButton onPress={() => router.back()} className="w-10 h-10 flex items-center justify-center -ml-2">
                        <XCircle size={28} color="#AFAFAF" />
                    </SoundButton>
                    <View className="flex-1 mx-4">
                        <ShiningProgressBar 
                            progress={progressPercent / 100} 
                            color="#58CC02" 
                            backgroundColor={isDark ? '#272B36' : '#E5E5E5'} 
                            height={16} 
                        />
                    </View>
                    <View className="flex-row items-center bg-red-50 dark:bg-red-950/20 px-3 py-1.5 rounded-full border border-red-100 dark:border-red-900/30" style={{ minWidth: 64, justifyContent: 'center', gap: 6 }}>
                        <Heart size={16} color="#FF4B4B" fill="#FF4B4B" />
                        <Text className="text-[#FF4B4B] font-black text-[15px]">{hearts}</Text>
                    </View>
                </View>

                {/* Provocative Mascot in Questions */}
                {currentIndex === 0 && !showNext && (
                    <Animated.View entering={FadeIn} className="mb-6">
                        <MascotInteraction 
                            state="happy" 
                            message="Let's see if you were actually reading! 🦁" 
                        />
                    </Animated.View>
                )}

                <Animated.View
                    key={currentIndex}
                    entering={SlideInRight.springify().damping(16).stiffness(100)}
                    exiting={SlideOutLeft.duration(180)}
                    className="flex-1"
                >
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                        {isFillInTheBlank ? (
                            <FillInTheBlank 
                                sentence={currentQuestion.text}
                                options={currentQuestion.options}
                                onSelect={handleOptionSelect}
                                disabled={showNext}
                                isCorrect={isCorrect}
                            />
                        ) : (
                            <>
                                <MathText content={currentQuestion.text} fontSize={22} containerStyle={{ marginBottom: 32 }} />

                        {currentQuestion.options.map((option: string, index: number) => {
                            const isSelected = selectedOption === index;
                            const isWrong = isSelected && isCorrect === false;
                            const isRight = (isSelected && isCorrect === true) || (isCorrect !== null && index === currentQuestion.correctOption);

                            let borderColor = isDark ? '#272B36' : '#E5E5E5';
                            let bgColor = isDark ? '#1E222B' : 'white';
                            let textColor = isDark ? 'white' : '#4B4B4B';
                            let shadowColor = isDark ? '#1E222B' : '#E5E5E5';

                            if (isSelected && isCorrect === null) {
                                borderColor = '#1899D6';
                                bgColor = isDark ? '#1CB0F625' : '#DDF4FF';
                                textColor = '#1899D6';
                                shadowColor = '#1899D6';
                            } else if (isRight) {
                                borderColor = '#58CC02';
                                bgColor = isDark ? '#58CC0225' : '#D7FFB8';
                                textColor = '#58CC02';
                                shadowColor = '#58CC02';
                            } else if (isWrong) {
                                borderColor = '#FF4B4B';
                                bgColor = isDark ? '#FF4B4B25' : '#FFDCDC';
                                textColor = '#FF4B4B';
                                shadowColor = '#FF4B4B';
                            }

                            return (
                                <Animated.View key={index}>
                                    <TactileButton
                                        onPress={() => handleOptionSelect(index)}
                                        disabled={showNext}
                                        backgroundColor={bgColor}
                                        shadowColor={shadowColor}
                                        depth={4}
                                        className="mb-4"
                                        contentClassName="flex-row items-center p-5"
                                    >
                                        <View style={{ borderColor: isSelected || isRight || isWrong ? 'transparent' : (isDark ? '#272B36' : '#E5E5E5'), backgroundColor: isSelected || isRight || isWrong ? textColor : 'transparent' }} className="w-8 h-8 rounded-full border-2 items-center justify-center mr-4">
                                            {(isSelected || isRight || isWrong) ? (
                                                <View className="w-2 h-2 bg-white rounded-full" />
                                            ) : (
                                                <Text className="text-[#AFAFAF] font-bold text-sm">{index + 1}</Text>
                                            )}
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <MathText content={option} color={textColor} fontSize={17} />
                                        </View>
                                    </TactileButton>
                                </Animated.View>
                            );
                        })}
                            </>
                        )}
                    </ScrollView>
                </Animated.View>
            </View>

            <View className={`pt-4 px-5 pb-8 border-t-2 border-gray-100 dark:border-gray-800 ${isCorrect === true ? 'bg-[#D7FFB8] dark:bg-[#1A2E1A]' : isCorrect === false ? 'bg-[#FFDCDC] dark:bg-[#2E1A1A]' : 'bg-white dark:bg-[#0B0D12]'}`}>
                {isCorrect !== null && (
                    <Animated.View entering={SlideInDown} className="mb-6 flex-row items-center">
                        <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${isCorrect ? 'bg-[#58CC02]' : 'bg-[#FF4B4B]'}`}>
                            {isCorrect ? <CheckCircle2 size={28} color="white" /> : <XCircle size={28} color="white" />}
                        </View>
                        <View>
                            <Text className={`font-black text-2xl ${isCorrect ? 'text-[#58CC02]' : 'text-[#FF4B4B]'}`}>
                                {isCorrect ? 'Amazing!' : 'Incorrect'}
                            </Text>
                            {!isCorrect && (
                                <View className="mt-1">
                                    <MathText content={`Correct: ${currentQuestion.options[currentQuestion.correctOption]}`} color="#FF4B4B" fontSize={14} />
                                </View>
                            )}
                        </View>
                    </Animated.View>
                )}

                <View style={{ transform: [{ scale: checkScale.value }] }}>
                    <TactileButton
                        onPress={showNext ? handleNext : handleCheck}
                        disabled={selectedOption === null || submitting}
                        backgroundColor={
                            selectedOption === null || submitting 
                                ? (isDark ? '#272B36' : '#E5E5E5')
                                : isCorrect === true ? '#58CC02' : isCorrect === false ? '#FF4B4B' : '#F59E0B'
                        }
                        shadowColor={
                            selectedOption === null || submitting
                                ? (isDark ? '#1E222B' : '#CECECE')
                                : isCorrect === true ? '#46A302' : isCorrect === false ? '#EA2B2B' : '#D97706'
                        }
                        contentClassName="p-4 items-center justify-center"
                    >
                        {submitting ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text className={`font-black text-[17px] uppercase tracking-widest ${selectedOption === null || submitting ? 'text-[#AFAFAF]' : 'text-white'}`}>
                                {showNext ? (currentIndex === lesson.questions.length - 1 ? 'Finish' : 'Continue') : 'Check'}
                            </Text>
                        )}
                    </TactileButton>
                </View>
            </View>
        </SafeAreaView>
    );
}
