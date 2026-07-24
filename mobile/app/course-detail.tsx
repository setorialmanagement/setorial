import { TactileButton } from '../components/TactileButton';
import { MascotInteraction } from '../components/MascotInteraction';
import { SoundButton } from '../components/SoundButton';
import { View, Text, ScrollView, SafeAreaView, ActivityIndicator, Dimensions, useColorScheme } from "react-native";
import { ChevronLeft, Star, Lock, CheckCircle2 } from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import { learningApi } from "../services/api";
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import Svg, { Path, Circle, Rect, Polygon, Ellipse, G } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PATH_WIDTH = SCREEN_WIDTH;
const NODE_SIZE = 70;

// --- SVG Nature Decorations ---

function TreeSvg({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
    return (
        <G transform={`translate(${x}, ${y}) scale(${scale})`}>
            {/* Trunk */}
            <Rect x={-4} y={-5} width={8} height={22} fill="#8B6914" rx={3} />
            {/* Foliage layers */}
            <Polygon points="-18,0 0,-35 18,0" fill="#2D8B4E" />
            <Polygon points="-14,-12 0,-42 14,-12" fill="#34A853" />
            <Polygon points="-10,-22 0,-48 10,-22" fill="#43C466" />
        </G>
    );
}

function CloudSvg({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
    return (
        <G transform={`translate(${x}, ${y}) scale(${scale})`} opacity={0.5}>
            <Ellipse cx={0} cy={0} rx={30} ry={12} fill="#FFFFFF" />
            <Ellipse cx={20} cy={-4} rx={22} ry={10} fill="#FFFFFF" />
            <Ellipse cx={-16} cy={-2} rx={18} ry={9} fill="#FFFFFF" />
        </G>
    );
}

function FlowerSvg({ x, y }: { x: number; y: number }) {
    return (
        <G transform={`translate(${x}, ${y})`}>
            <Circle cx={0} cy={0} r={4} fill="#FFD700" />
            <Circle cx={-4} cy={-3} r={3} fill="#FF69B4" />
            <Circle cx={4} cy={-3} r={3} fill="#FF69B4" />
            <Circle cx={-4} cy={3} r={3} fill="#FF69B4" />
            <Circle cx={4} cy={3} r={3} fill="#FF69B4" />
        </G>
    );
}

function RockSvg({ x, y, flip = false }: { x: number; y: number; flip?: boolean }) {
    return (
        <G transform={`translate(${x}, ${y}) scale(${flip ? -1 : 1}, 1)`}>
            <Ellipse cx={0} cy={0} rx={18} ry={12} fill="#9CA3AF" />
            <Ellipse cx={-8} cy={-5} rx={12} ry={8} fill="#B0B8C4" />
        </G>
    );
}

/**
 * Generate a winding S-curve path and node positions
 */
function generateWindingPath(nodeCount: number) {
    const startY = 80;
    const verticalSpacing = 130;
    const horizontalAmplitude = SCREEN_WIDTH * 0.25;
    const centerX = PATH_WIDTH / 2;

    const nodes: { x: number; y: number }[] = [];

    for (let i = 0; i < nodeCount; i++) {
        const y = startY + i * verticalSpacing;
        // S-curve: alternates left-right using sine
        const phase = (i / 2) * Math.PI;
        const x = centerX + Math.sin(phase) * horizontalAmplitude;
        nodes.push({ x, y });
    }

    // Build SVG path through nodes with smooth curves
    let pathD = '';
    if (nodes.length > 0) {
        pathD = `M ${nodes[0].x} ${nodes[0].y}`;
        for (let i = 1; i < nodes.length; i++) {
            const prev = nodes[i - 1];
            const curr = nodes[i];
            const midY = (prev.y + curr.y) / 2;
            pathD += ` C ${prev.x} ${midY}, ${curr.x} ${midY}, ${curr.x} ${curr.y}`;
        }
    }

    const totalHeight = nodeCount > 0 ? nodes[nodes.length - 1].y + 120 : 400;
    return { nodes, pathD, totalHeight };
}

/**
 * Generate semi-random decorations (trees, flowers, rocks) for a given path area
 */
function generateDecorations(nodeCount: number, totalHeight: number) {
    const decorations: Array<{ type: 'tree' | 'flower' | 'rock' | 'cloud'; x: number; y: number; scale?: number; flip?: boolean }> = [];
    const seed = nodeCount * 7; // pseudo-random seed

    // Trees along edges
    for (let i = 0; i < nodeCount + 4; i++) {
        const y = 40 + i * 110 + ((seed + i * 37) % 50);
        const side = i % 2 === 0;
        const x = side ? 25 + ((seed + i * 13) % 30) : SCREEN_WIDTH - 25 - ((seed + i * 17) % 30);
        const scale = 0.7 + ((seed + i * 23) % 40) / 100;
        decorations.push({ type: 'tree', x, y, scale });
    }

    // Flowers scattered
    for (let i = 0; i < nodeCount + 2; i++) {
        const y = 100 + i * 140 + ((seed + i * 41) % 80);
        const x = 30 + ((seed + i * 31) % (SCREEN_WIDTH - 60));
        decorations.push({ type: 'flower', x, y });
    }

    // Rocks
    for (let i = 0; i < Math.ceil(nodeCount / 2); i++) {
        const y = 160 + i * 250 + ((seed + i * 53) % 100);
        const side = i % 2 === 1;
        const x = side ? 40 + ((seed + i * 19) % 40) : SCREEN_WIDTH - 40 - ((seed + i * 29) % 40);
        decorations.push({ type: 'rock', x, y, flip: side });
    }

    // Clouds at the top
    decorations.push({ type: 'cloud', x: 60, y: 30, scale: 0.8 });
    decorations.push({ type: 'cloud', x: SCREEN_WIDTH - 80, y: 50, scale: 0.6 });
    decorations.push({ type: 'cloud', x: SCREEN_WIDTH / 2 + 20, y: 15, scale: 0.5 });

    return decorations;
}

export default function CourseDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [subject, setSubject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    useEffect(() => {
        if (id) fetchSubject();
    }, [id]);

    const fetchSubject = async () => {
        try {
            const res = await learningApi.getSubject(id as string);
            setSubject(res.data);
        } catch (error) {
            console.error('Failed to fetch subject details:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 bg-white dark:bg-[#0B0D12] items-center justify-center">
                <ActivityIndicator size="large" color="#F59E0B" />
            </View>
        );
    }

    if (!subject) {
        return (
            <View className="flex-1 bg-white dark:bg-[#0B0D12] items-center justify-center p-5">
                <Text className="text-gray-500 dark:text-gray-400 mb-4">Subject not found</Text>
                <TactileButton onPress={() => router.back()} backgroundColor="#1CB0F6" shadowColor="#1899D6" contentClassName="px-6 py-3 items-center justify-center">
                    <Text className="text-white font-bold">Go Back</Text>
                </TactileButton>
            </View>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#0B0D12' : '#8BC34A' }}>
            {/* Header Banner */}
            <View style={{
                backgroundColor: '#F59E0B',
                paddingHorizontal: 20,
                paddingTop: 16,
                paddingBottom: 20,
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                zIndex: 20,
            }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <SoundButton onPress={() => router.back()} style={{ marginRight: 12 }}>
                        <ChevronLeft size={28} color="#FFF" />
                    </SoundButton>
                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontWeight: '800', fontSize: 13, textTransform: 'uppercase', letterSpacing: 2 }}>
                        {subject.name}
                    </Text>
                </View>
            </View>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 120 }}
                showsVerticalScrollIndicator={false}
            >
                {subject.topics?.map((topic: any, topicIndex: number) => {
                    const lessons = topic.lessons || [];
                    const { nodes, pathD, totalHeight } = generateWindingPath(lessons.length);
                    const decorations = generateDecorations(lessons.length, totalHeight);

                    // Find the first CURRENT lesson to auto-show "LANJUTKAN" popup
                    const currentLessonIdx = lessons.findIndex((l: any) => l.status === 'CURRENT');

                    return (
                        <View key={topic.id}>
                            {/* Topic Unit Header */}
                            <Animated.View entering={FadeInDown.delay(topicIndex * 100)}>
                                <TactileButton
                                    onPress={() => {
                                        const firstLesson = lessons.find((l: any) => l.status !== 'LOCKED') || lessons[0];
                                        if (firstLesson) {
                                            router.push(`/level?id=${firstLesson.id}`);
                                        }
                                    }}
                                    backgroundColor="#F59E0B"
                                    shadowColor="#D97706"
                                    depth={6}
                                    className="mx-5 mt-5 mb-4"
                                    contentClassName="p-5 items-start"
                                >
                                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontWeight: '900', fontSize: 12, textTransform: 'uppercase', letterSpacing: 2 }}>
                                        KELAS : {topicIndex + 1}
                                    </Text>
                                    <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 20, marginTop: 4 }}>
                                        {topic.name}
                                    </Text>
                                </TactileButton>
                            </Animated.View>

                            {/* Nature Path Area */}
                            <View style={{
                                height: totalHeight,
                                width: PATH_WIDTH,
                                backgroundColor: isDark ? '#1A2E1A' : '#8BC34A',
                                position: 'relative',
                                overflow: 'hidden',
                            }}>
                                {/* Background gradient at the bottom — grass */}
                                <View style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    height: 80,
                                    backgroundColor: isDark ? '#0D1F0D' : '#7CB342',
                                    borderTopLeftRadius: 999,
                                    borderTopRightRadius: 999,
                                }} />

                                {/* SVG Layer — path + decorations */}
                                <Svg width={PATH_WIDTH} height={totalHeight} style={{ position: 'absolute', top: 0, left: 0 }}>
                                    {/* Decorative elements BEHIND the path */}
                                    {decorations.map((dec, i) => {
                                        if (dec.type === 'tree') return <TreeSvg key={`t${i}`} x={dec.x} y={dec.y} scale={dec.scale} />;
                                        if (dec.type === 'flower') return <FlowerSvg key={`f${i}`} x={dec.x} y={dec.y} />;
                                        if (dec.type === 'rock') return <RockSvg key={`r${i}`} x={dec.x} y={dec.y} flip={dec.flip} />;
                                        if (dec.type === 'cloud') return <CloudSvg key={`c${i}`} x={dec.x} y={dec.y} scale={dec.scale} />;
                                        return null;
                                    })}

                                    {/* The winding path itself */}
                                    {pathD && (
                                        <>
                                            {/* Path shadow */}
                                            <Path
                                                d={pathD}
                                                fill="none"
                                                stroke={isDark ? '#2A3A2A' : '#6D9B30'}
                                                strokeWidth={50}
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                            {/* Main path */}
                                            <Path
                                                d={pathD}
                                                fill="none"
                                                stroke={isDark ? '#3A4E3A' : '#F5E6B8'}
                                                strokeWidth={42}
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                            {/* Inner path highlight */}
                                            <Path
                                                d={pathD}
                                                fill="none"
                                                stroke={isDark ? '#4A5E4A' : '#FFF3D6'}
                                                strokeWidth={32}
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </>
                                    )}
                                </Svg>

                                {/* Lesson Nodes — positioned absolutely over the SVG */}
                                {lessons.map((lesson: any, index: number) => {
                                    const node = nodes[index];
                                    if (!node) return null;

                                    const isCompleted = lesson.status === 'COMPLETED';
                                    const isCurrent = lesson.status === 'CURRENT';
                                    const isLocked = lesson.status === 'LOCKED';

                                    let bgColor = isDark ? '#4B5563' : '#D1D5DB';
                                    let shadowColor = isDark ? '#374151' : '#9CA3AF';
                                    let icon = <Lock size={24} color={isDark ? '#9CA3AF' : '#FFF'} />;

                                    if (isCompleted) {
                                        bgColor = '#FFC800';
                                        shadowColor = '#E5B400';
                                        icon = <Star size={28} color="#FFF" fill="#FFF" />;
                                    } else if (isCurrent) {
                                        bgColor = '#FFC800';
                                        shadowColor = '#E5B400';
                                        icon = <Star size={28} color="#FFF" fill="#FFF" />;
                                    }

                                    return (
                                        <Animated.View
                                            key={lesson.id}
                                            entering={ZoomIn.delay(150 + index * 80).springify().damping(14)}
                                            style={{
                                                position: 'absolute',
                                                left: node.x - NODE_SIZE / 2,
                                                top: node.y - NODE_SIZE / 2,
                                                width: NODE_SIZE,
                                                height: NODE_SIZE,
                                                zIndex: 20,
                                            }}
                                        >
                                            {/* "Learn: Beginners" popup for current lesson */}
                                            {isCurrent && (
                                                <Animated.View
                                                    entering={FadeIn.delay(600)}
                                                    style={{
                                                        position: 'absolute',
                                                        top: -75,
                                                        left: -40,
                                                        width: NODE_SIZE + 80,
                                                        backgroundColor: '#F59E0B',
                                                        borderRadius: 16,
                                                        padding: 12,
                                                        alignItems: 'center',
                                                        zIndex: 30,
                                                        shadowColor: '#000',
                                                        shadowOffset: { width: 0, height: 4 },
                                                        shadowOpacity: 0.2,
                                                        shadowRadius: 8,
                                                        elevation: 8,
                                                    }}
                                                >
                                                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontWeight: '800', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
                                                        Learn: {topic.name?.split(' ')[0] || 'Next'}
                                                    </Text>
                                                    <TactileButton
                                                        onPress={() => router.push(`/level?id=${lesson.id}`)}
                                                        backgroundColor="#FFF"
                                                        shadowColor="#E5E5E5"
                                                        depth={3}
                                                        className="mt-2"
                                                        contentClassName="px-5 py-2 items-center justify-center"
                                                    >
                                                        <Text style={{ color: '#F59E0B', fontWeight: '900', fontSize: 13, textTransform: 'uppercase', letterSpacing: 2 }}>
                                                            LANJUTKAN
                                                        </Text>
                                                    </TactileButton>
                                                    {/* Triangle pointer */}
                                                    <View style={{
                                                        position: 'absolute',
                                                        bottom: -8,
                                                        width: 0,
                                                        height: 0,
                                                        borderLeftWidth: 10,
                                                        borderRightWidth: 10,
                                                        borderTopWidth: 10,
                                                        borderLeftColor: 'transparent',
                                                        borderRightColor: 'transparent',
                                                        borderTopColor: '#F59E0B',
                                                    }} />
                                                </Animated.View>
                                            )}

                                            <TactileButton
                                                disabled={isLocked}
                                                onPress={() => router.push(`/level?id=${lesson.id}`)}
                                                backgroundColor={bgColor}
                                                shadowColor={shadowColor}
                                                depth={isCurrent ? 8 : (isLocked ? 3 : 5)}
                                                borderRadius={999}
                                                style={{ width: NODE_SIZE, height: NODE_SIZE }}
                                                contentClassName="items-center justify-center"
                                            >
                                                {icon}
                                            </TactileButton>
                                        </Animated.View>
                                    );
                                })}
                            </View>
                        </View>
                    );
                })}

                {(!subject.topics || subject.topics.length === 0) && (
                    <View className="items-center justify-center mt-10 px-6">
                        <MascotInteraction
                            state="thinking"
                            message="No units available yet! Check back later."
                        />
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
