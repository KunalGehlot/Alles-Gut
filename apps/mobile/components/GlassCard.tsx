import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/contexts/ThemeContext';
import { BorderRadius, Spacing } from '@/constants/typography';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  padding?: boolean;
}

export function GlassCard({
  children,
  style,
  intensity = 80,
  padding = true,
}: GlassCardProps) {
  const { theme, isDark } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <BlurView
        intensity={intensity}
        tint={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          styles.content,
          padding && styles.padding,
          { borderColor: theme.glassBorder },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  content: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  padding: {
    padding: Spacing.lg,
  },
});
