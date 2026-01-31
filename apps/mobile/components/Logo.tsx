import React from 'react';
import { Svg, Path } from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';

interface LogoProps {
    size?: number;
    color?: string;
}

export function Logo({ size = 120, color }: LogoProps) {
    const { theme } = useTheme();

    // If color is provided, use it. Otherwise use theme.text for the main curve.
    // The checkmark stays brand green #22c55e unless we want to force mono.
    // But Liquid Glass usually implies the green checkmark is a key element.
    const strokeColor = color || theme.text;

    return (
        <Svg width={size} height={size * 1.6} viewBox="0 0 50 80" fill="none">
            {/* Question mark curve */}
            <Path
                d="M9 24 C9 8 41 8 41 24 C41 36 25 36 25 50"
                stroke={strokeColor}
                strokeWidth="5"
                strokeLinecap="round"
            />
            {/* Checkmark */}
            <Path
                d="M12 64 L22 76 L42 52"
                stroke="#22c55e"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}
