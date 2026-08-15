import React, { useEffect } from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, Easing, withDelay } from 'react-native-reanimated';
import Svg, { Path, Circle, Ellipse } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

const GrassTuft = ({ color }: { color: string }) => (
    <Svg width="40" height="40" viewBox="0 0 40 40">
        <Path d="M20 40 Q 15 20, 5 10 Q 12 25, 20 40 M20 40 Q 20 15, 20 5 Q 23 20, 20 40 M20 40 Q 25 20, 35 15 Q 28 25, 20 40" fill={color} />
    </Svg>
);

const Flower = ({ stemColor, petalColor }: { stemColor: string, petalColor: string }) => (
    <Svg width="40" height="40" viewBox="0 0 40 40">
        <Path d="M20 40 Q 15 20 20 15" stroke={stemColor} strokeWidth="3" fill="none" />
        <Circle cx="20" cy="15" r="5" fill="#FFC800" />
        <Circle cx="14" cy="12" r="4.5" fill={petalColor} />
        <Circle cx="26" cy="12" r="4.5" fill={petalColor} />
        <Circle cx="14" cy="18" r="4.5" fill={petalColor} />
        <Circle cx="26" cy="18" r="4.5" fill={petalColor} />
        <Circle cx="20" cy="8" r="4.5" fill={petalColor} />
        <Circle cx="20" cy="22" r="4.5" fill={petalColor} />
    </Svg>
);

const Bush = ({ color }: { color: string }) => (
    <Svg width="60" height="40" viewBox="0 0 60 40">
        <Circle cx="15" cy="30" r="15" fill={color} />
        <Circle cx="45" cy="30" r="15" fill={color} />
        <Circle cx="30" cy="20" r="20" fill={color} />
    </Svg>
);

const AnimatedScenery = ({ x, y, scale, delay, color, type }: { x: number, y: number, scale: number, delay: number, color: string, type: string }) => {
    const skewX = useSharedValue(0);

    useEffect(() => {
        skewX.value = withDelay(delay, withRepeat(
            withSequence(
                withTiming(12, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
                withTiming(-4, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
                withTiming(8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
                withTiming(-2, { duration: 1800, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        ));
    }, [delay, skewX]);

    const swayMultiplier = type === 'bush' ? 0.2 : 1;

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: x },
            { translateY: y },
            { translateY: 20 },
            { skewX: `${skewX.value * swayMultiplier}deg` },
            { translateY: -20 },
            { scale }
        ] as any
    }));

    const petalColors = ['#FF4B4B', '#1CB0F6', '#CE82FF', '#FF9600'];
    const randomPetal = petalColors[Math.floor(delay) % petalColors.length];

    return (
        <Animated.View style={[{ position: 'absolute' }, animatedStyle]}>
            {type === 'grass' && <GrassTuft color={color} />}
            {type === 'flower' && <Flower stemColor={color} petalColor={randomPetal} />}
            {type === 'bush' && <Bush color={color} />}
        </Animated.View>
    );
};

const AnimatedMole = ({ x, y, delay, scale }: { x: number, y: number, delay: number, scale: number }) => {
    const popY = useSharedValue(25);

    useEffect(() => {
        popY.value = withDelay(delay, withRepeat(
            withSequence(
                withTiming(25, { duration: 5000 + Math.random() * 4000 }), // Wait randomly underground
                withTiming(0, { duration: 400, easing: Easing.out(Easing.back(1.5)) }), // Pop up fast
                withTiming(0, { duration: 2500 }), // Look around
                withTiming(25, { duration: 300, easing: Easing.in(Easing.ease) }) // Go back down
            ),
            -1,
            true
        ));
    }, [delay]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: popY.value }]
    }));

    return (
        <View style={{ position: 'absolute', left: x, top: y, width: 40, height: 35, overflow: 'hidden', transform: [{ scale }] }}>
            <Animated.View style={animatedStyle}>
                <Svg width="40" height="40" viewBox="0 0 40 40">
                    {/* Mole Body */}
                    <Path d="M 8 40 Q 8 10 20 10 Q 32 10 32 40" fill="#795548" />
                    {/* Eyes */}
                    <Circle cx="15" cy="20" r="2.5" fill="#111" />
                    <Circle cx="25" cy="20" r="2.5" fill="#111" />
                    {/* Nose */}
                    <Circle cx="20" cy="24" r="3" fill="#FFC0CB" />
                </Svg>
            </Animated.View>
            {/* The Hole */}
            <Svg width="40" height="15" viewBox="0 0 40 15" style={{ position: 'absolute', bottom: -5 }}>
                <Ellipse cx="20" cy="7.5" rx="18" ry="6" fill="#000" opacity="0.3" />
            </Svg>
        </View>
    );
};

export default function AnimatedGrassBackground({ isDark }: { isDark: boolean }) {
    const grassColor = isDark ? 'rgba(46, 71, 46, 0.4)' : 'rgba(198, 232, 161, 0.8)';
    const bushColor = isDark ? 'rgba(30, 50, 30, 0.5)' : 'rgba(150, 210, 110, 0.6)';

    const items = React.useMemo(() => {
        const arr = [];
        const startY = 150; // Push items down so they don't overlap the top header
        const playAreaHeight = height * 1.5;
        
        // Define a grid to prevent overlaps
        const cols = 4;
        const rows = 16;
        const cellWidth = width / cols;
        const cellHeight = playAreaHeight / rows;
        
        // Create an array of available cells
        let availableCells: {c: number, r: number}[] = [];
        for (let c = 0; c < cols; c++) {
            for (let r = 0; r < rows; r++) {
                availableCells.push({c, r});
            }
        }
        
        // Shuffle the cells to randomize placement
        for (let i = availableCells.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [availableCells[i], availableCells[j]] = [availableCells[j], availableCells[i]];
        }
        
        const getNextPosition = () => {
            if (availableCells.length === 0) return { x: 0, y: 0 };
            const cell = availableCells.pop();
            if (!cell) return { x: 0, y: 0 };
            
            // Add some jitter inside the cell so it doesn't look perfectly rigid
            const jitterX = (Math.random() - 0.5) * (cellWidth * 0.4);
            const jitterY = (Math.random() - 0.5) * (cellHeight * 0.4);
            return {
                x: (cell.c * cellWidth) + (cellWidth / 2) + jitterX - 20, // -20 to center the 40px item
                y: startY + (cell.r * cellHeight) + (cellHeight / 2) + jitterY
            };
        };
        
        const getMolePosition = () => {
            // Moles should only appear lower down (not near the top header)
            const index = availableCells.findIndex(cell => cell.r > 2);
            if (index === -1) return getNextPosition(); // Fallback if no lower cells are left
            const cell = availableCells.splice(index, 1)[0];
            
            const jitterX = (Math.random() - 0.5) * (cellWidth * 0.4);
            const jitterY = (Math.random() - 0.5) * (cellHeight * 0.4);
            return {
                x: (cell.c * cellWidth) + (cellWidth / 2) + jitterX - 20,
                y: startY + (cell.r * cellHeight) + (cellHeight / 2) + jitterY
            };
        };
        
        // Scatter Grass
        for (let i = 0; i < 20; i++) {
            const pos = getNextPosition();
            arr.push({ id: `grass-${i}`, type: 'grass', x: pos.x, y: pos.y, scale: 0.6 + Math.random() * 0.8, delay: Math.random() * 3000 });
        }
        // Scatter Bushes
        for (let i = 0; i < 6; i++) {
            const pos = getNextPosition();
            arr.push({ id: `bush-${i}`, type: 'bush', x: pos.x, y: pos.y, scale: 0.7 + Math.random() * 0.5, delay: Math.random() * 3000 });
        }
        // Scatter Moles (Animals)
        for (let i = 0; i < 8; i++) {
            const pos = getMolePosition();
            arr.push({ id: `mole-${i}`, type: 'mole', x: pos.x, y: pos.y, scale: 0.6 + Math.random() * 0.3, delay: Math.random() * 3000 });
        }
        return arr;
    }, []);

    return (
        <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="none">
            {items.map(t => {
                if (t.type === 'mole') {
                    return <AnimatedMole key={t.id} x={t.x} y={t.y} scale={t.scale} delay={t.delay} />;
                }
                const color = t.type === 'bush' ? bushColor : grassColor;
                return (
                    <AnimatedScenery 
                        key={t.id} 
                        x={t.x} 
                        y={t.y} 
                        scale={t.scale} 
                        delay={t.delay} 
                        color={color}
                        type={t.type}
                    />
                );
            })}
        </View>
    );
}
