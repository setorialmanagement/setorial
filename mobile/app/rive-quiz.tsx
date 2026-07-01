import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { RiveView, useRiveFile, useViewModelInstance, Fit, Alignment, RiveViewRef } from '@rive-app/react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChevronLeft } from 'lucide-react-native';
import { learningApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { feedback } from '../lib/feedback';
import { MathText } from '../components/MathText';
import { TactileButton } from '../components/TactileButton';

const { width } = Dimensions.get('window');

export default function RiveQuizScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    
    // Quiz State
    const [lesson, setLesson] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [showNext, setShowNext] = useState(false);
    const [answers, setAnswers] = useState<number[]>([]);
    const [hearts, setHearts] = useState(5);
    const [phase, setPhase] = useState<'reading' | 'questions' | 'finished'>('questions');
    
    // Rive Setup
    const riveRef = useRef<RiveViewRef>(null);
    const { riveFile } = useRiveFile(require('../assets/animations/interactive-learning.riv'));
    const { instance: viewModelInstance } = useViewModelInstance(riveFile, {
        viewModelName: 'base',
    });

    useEffect(() => {
        if (id) {
            fetchLesson();
        }
    }, [id]);

    const fetchLesson = async () => {
        try {
            const res = await learningApi.getLesson(id as string);
            setLesson(res.data);
            setPhase('questions');
        } catch (error) {
            console.error('Failed to fetch lesson:', error);
        } finally {
            setLoading(false);
        }
    };

    // Sync Quiz State -> Rive ViewModel
    useEffect(() => {
        if (!viewModelInstance || !lesson || !lesson.questions) return;
        
        const question = lesson.questions[currentIndex];
        if (!question) return;

        // 1. Progress
        const total = lesson.questions.length;
        viewModelInstance.numberProperty('numberProgress')?.set(currentIndex);
        viewModelInstance.numberProperty('greenProgress')?.set(currentIndex / total);
        
        // 2. Hide unused option slots (1-9)
        for (let i = 1; i <= 9; i++) {
            viewModelInstance.booleanProperty(`notSelected${i}`)?.set(i > question.options.length);
        }

        // 3. Reset state for new question
        if (!showNext) {
            viewModelInstance.booleanProperty('isCorrect')?.set(false);
            viewModelInstance.booleanProperty('isWrong')?.set(false);
            viewModelInstance.booleanProperty('isPressed')?.set(false);
            viewModelInstance.booleanProperty('checkBtmOn')?.set(false);
            viewModelInstance.triggerProperty('playIdle')?.fire();
            viewModelInstance.stringProperty('btmText')?.set('CHECK');
            viewModelInstance.triggerProperty('emptyset')?.fire();
        }

    }, [viewModelInstance, lesson, currentIndex, showNext]);

    // Handle Rive Events (Taps inside canvas)
    const handleRiveEvent = (event: any) => {
        const name = event.name;
        
        if (name === 'check_pressed') {
            if (!showNext) handleCheck();
            else handleNext();
        } else if (name.startsWith('option_tapped_')) {
            const idx = event.properties?.index ?? parseInt(name.split('_').pop() || '0', 10);
            if (!isNaN(idx)) handleOptionSelect(idx);
        } else if (name === 'close_pressed') {
            router.back();
        }
    };

    const handleOptionSelect = (index: number) => {
        if (showNext) return;
        setSelectedOption(index);
        viewModelInstance?.booleanProperty('isPressed')?.set(true);
        viewModelInstance?.booleanProperty('checkBtmOn')?.set(true);
        feedback.optionSelect();
    };

    const handleCheck = () => {
        if (selectedOption === null || !lesson) return;
        
        const correct = lesson.questions[currentIndex].correctOption === selectedOption;
        setIsCorrect(correct);
        setShowNext(true);

        viewModelInstance?.booleanProperty('isCorrect')?.set(correct);
        viewModelInstance?.booleanProperty('isWrong')?.set(!correct);
        
        if (correct) {
            viewModelInstance?.triggerProperty('playCorrect')?.fire();
            viewModelInstance?.triggerProperty('correct')?.fire();
            feedback.correctAnswer();
        } else {
            viewModelInstance?.triggerProperty('playWrong')?.fire();
            viewModelInstance?.triggerProperty('wrong')?.fire();
            feedback.wrongAnswer();
            
            const newHearts = Math.max(0, hearts - 1);
            setHearts(newHearts);
            if (newHearts === 0) {
                // Out of hearts animation
                viewModelInstance?.triggerProperty('fail')?.fire();
            }
        }
        
        viewModelInstance?.stringProperty('btmText')?.set('CONTINUE');
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
        try {
            await AsyncStorage.removeItem(`lesson_session_${id}`);
            const res = await learningApi.submitLesson({
                lessonId: id as string,
                answers: finalAnswers
            });
            
            if (res.data.passed) {
                feedback.victory();
                const { user, updateUser } = useAuthStore.getState();
                const oldStreak = user?.streak || 0;
                const meRes = await import('../services/api').then(m => m.authApi.getMe());
                if (meRes.data) {
                    await updateUser(meRes.data);
                    const newStreak = meRes.data.streak || 0;
                    if (newStreak > oldStreak && newStreak >= 2) {
                        setTimeout(() => {
                            router.replace({ pathname: '/streak-celebration', params: { streak: String(newStreak) } });
                        }, 1500);
                        return;
                    }
                }
            } else {
                feedback.tryAgain();
            }
            router.back();
        } catch (error) {
            console.error('Failed to submit lesson:', error);
            alert('Failed to submit lesson. Please try again.');
        }
    };

    if (loading || !riveFile) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF9600" />
            </View>
        );
    }

    const currentQuestion = lesson?.questions?.[currentIndex];

    return (
        <SafeAreaView style={styles.container}>
            {/* Background Rive Canvas */}
            <View style={StyleSheet.absoluteFill}>
                <RiveView
                    ref={riveRef}
                    file={riveFile}
                    artboardName="withLayout"
                    dataBind={viewModelInstance ?? undefined}
                    onRiveEventReceived={handleRiveEvent}
                    fit={Fit.Layout}
                    alignment={Alignment.Center}
                    style={styles.riveView}
                />
            </View>

            {/* React Native Overlay for dynamic text/math */}
            <View style={styles.overlay} pointerEvents="box-none">
                <View style={styles.header} pointerEvents="box-none">
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ChevronLeft color="#fff" size={28} />
                    </TouchableOpacity>
                    <View style={styles.heartsContainer}>
                        <Text style={styles.heartsText}>❤️ {hearts}</Text>
                    </View>
                </View>

                {currentQuestion && (
                    <View style={styles.questionContainer} pointerEvents="none">
                        <MathText content={currentQuestion.text} fontSize={22} />
                    </View>
                )}
                
                {/* Fallback Option Overlays (if Rive doesn't render them well) */}
                {currentQuestion && (
                    <View style={styles.optionsContainer} pointerEvents="box-none">
                        {currentQuestion.options.map((opt: string, i: number) => {
                            return (
                                <TouchableOpacity 
                                    key={i} 
                                    style={[
                                        styles.optionOverlay,
                                        selectedOption === i && styles.selectedOption
                                    ]}
                                    onPress={() => handleOptionSelect(i)}
                                >
                                    <MathText content={opt} fontSize={16} />
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                {/* Manual Check Button Overlay just in case Rive events fail */}
                <View style={styles.bottomNav} pointerEvents="box-none">
                    {selectedOption !== null && (
                        <TactileButton 
                            onPress={showNext ? handleNext : handleCheck}
                            backgroundColor={showNext ? (isCorrect ? '#58CC02' : '#FF4B4B') : '#1CB0F6'}
                            contentClassName="py-4 items-center"
                            className="mx-4 mb-6"
                        >
                            <Text style={styles.buttonText}>{showNext ? "CONTINUE" : "CHECK"}</Text>
                        </TactileButton>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0B0D12',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0B0D12',
    },
    riveView: {
        flex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
        zIndex: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    heartsContainer: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        justifyContent: 'center',
    },
    heartsText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    questionContainer: {
        marginTop: 40,
        paddingHorizontal: 20,
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.85)',
        marginHorizontal: 20,
        borderRadius: 16,
        paddingVertical: 16,
    },
    optionsContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
        marginTop: 20,
    },
    optionOverlay: {
        backgroundColor: 'rgba(255,255,255,0.95)',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: 'transparent',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    selectedOption: {
        borderColor: '#1CB0F6',
        backgroundColor: '#E5F3FF',
    },
    bottomNav: {
        justifyContent: 'flex-end',
        paddingBottom: 20,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    }
});
