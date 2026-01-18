import React, { useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Platform,
    Dimensions,
    Image,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Typography, Spacing } from '@/constants/typography';
import { Button } from './Button';

interface LockScreenProps {
    onUnlock: () => Promise<void>;
    biometricType?: 'faceid' | 'touchid' | 'fingerprint' | 'iris' | null;
}

const { width, height } = Dimensions.get('window');

export function LockScreen({ onUnlock, biometricType }: LockScreenProps) {
    const { theme, isDark } = useTheme();

    // Auto-trigger authentication on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            onUnlock();
        }, 300);
        return () => clearTimeout(timer);
    }, [onUnlock]);

    const getBiometricIcon = (): React.ComponentProps<typeof Ionicons>['name'] => {
        switch (biometricType) {
            case 'faceid':
                return 'scan-outline';
            case 'touchid':
            case 'fingerprint':
                return 'finger-print-outline';
            case 'iris':
                return 'eye-outline';
            default:
                return 'lock-closed-outline';
        }
    };

    const getBiometricLabel = (): string => {
        switch (biometricType) {
            case 'faceid':
                return 'Face ID';
            case 'touchid':
                return 'Touch ID';
            case 'fingerprint':
                return 'Fingerabdruck';
            case 'iris':
                return 'Iris';
            default:
                return 'Biometrie';
        }
    };

    return (
        <View style={styles.container}>
            <BlurView
                intensity={100}
                tint={isDark ? 'dark' : 'light'}
                style={StyleSheet.absoluteFill}
            />
            <View
                style={[
                    StyleSheet.absoluteFill,
                    { backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)' },
                ]}
            />

            <View style={styles.content}>
                {/* App Icon */}
                <View style={[styles.iconContainer, { backgroundColor: theme.primary }]}>
                    <Ionicons name="checkmark-circle" size={60} color="#FFFFFF" />
                </View>

                <Text style={[styles.appName, { color: theme.text }]}>Alles Gut</Text>

                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                    App ist gesperrt
                </Text>

                {/* Biometric Icon */}
                <View style={styles.biometricContainer}>
                    <View
                        style={[
                            styles.biometricIconWrapper,
                            { backgroundColor: theme.surfaceSecondary },
                        ]}
                    >
                        <Ionicons
                            name={getBiometricIcon()}
                            size={64}
                            color={theme.primary}
                        />
                    </View>
                </View>

                {/* Unlock Button */}
                <Button
                    title={`Mit ${getBiometricLabel()} entsperren`}
                    onPress={onUnlock}
                    variant="primary"
                    size="large"
                    style={styles.unlockButton}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width,
        height,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.xl,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    appName: {
        fontSize: Typography.fontSize['3xl'],
        fontWeight: 'bold',
        marginBottom: Spacing.xs,
    },
    subtitle: {
        fontSize: Typography.fontSize.base,
        marginBottom: Spacing['2xl'],
    },
    biometricContainer: {
        marginBottom: Spacing['2xl'],
    },
    biometricIconWrapper: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    unlockButton: {
        minWidth: 280,
    },
});
