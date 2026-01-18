import { useState, useEffect, useCallback } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const APP_LOCK_KEY = 'app_lock_enabled';

type BiometricType = 'faceid' | 'touchid' | 'fingerprint' | 'iris' | null;

interface BiometricState {
    hasHardware: boolean;
    isEnrolled: boolean;
    biometricType: BiometricType;
    isAppLockEnabled: boolean;
    isLoading: boolean;
}

interface UseBiometricReturn extends BiometricState {
    authenticate: () => Promise<boolean>;
    setAppLockEnabled: (enabled: boolean) => Promise<void>;
    checkBiometricSupport: () => Promise<void>;
}

export function useBiometric(): UseBiometricReturn {
    const [state, setState] = useState<BiometricState>({
        hasHardware: false,
        isEnrolled: false,
        biometricType: null,
        isAppLockEnabled: false,
        isLoading: true,
    });

    const checkBiometricSupport = useCallback(async () => {
        try {
            // Check hardware support
            const hasHardware = await LocalAuthentication.hasHardwareAsync();

            // Check if biometrics are enrolled
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();

            // Get supported authentication types
            const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

            // Determine the primary biometric type
            let biometricType: BiometricType = null;
            if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
                biometricType = 'faceid';
            } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
                // On iOS, this is TouchID; on Android, this is fingerprint
                biometricType = 'fingerprint';
            } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
                biometricType = 'iris';
            }

            // Load saved preference
            const savedPreference = await SecureStore.getItemAsync(APP_LOCK_KEY);
            const isAppLockEnabled = savedPreference === 'true';

            setState({
                hasHardware,
                isEnrolled,
                biometricType,
                isAppLockEnabled,
                isLoading: false,
            });
        } catch (error) {
            console.error('Error checking biometric support:', error);
            setState(prev => ({ ...prev, isLoading: false }));
        }
    }, []);

    useEffect(() => {
        checkBiometricSupport();
    }, [checkBiometricSupport]);

    const authenticate = useCallback(async (): Promise<boolean> => {
        try {
            // Get the appropriate prompt message based on biometric type
            const promptMessage = state.biometricType === 'faceid'
                ? 'Entsperren mit Face ID'
                : state.biometricType === 'fingerprint'
                    ? 'Entsperren mit Fingerabdruck'
                    : 'Entsperren mit Biometrie';

            const result = await LocalAuthentication.authenticateAsync({
                promptMessage,
                cancelLabel: 'Abbrechen',
                fallbackLabel: 'Passcode verwenden',
                disableDeviceFallback: false,
            });

            return result.success;
        } catch (error) {
            console.error('Biometric authentication error:', error);
            return false;
        }
    }, [state.biometricType]);

    const setAppLockEnabled = useCallback(async (enabled: boolean): Promise<void> => {
        try {
            if (enabled) {
                // Verify biometrics work before enabling
                const success = await authenticate();
                if (!success) {
                    // User cancelled or failed authentication, don't enable
                    return;
                }
            }

            await SecureStore.setItemAsync(APP_LOCK_KEY, enabled ? 'true' : 'false');
            setState(prev => ({ ...prev, isAppLockEnabled: enabled }));
        } catch (error) {
            console.error('Error saving app lock preference:', error);
        }
    }, [authenticate]);

    return {
        ...state,
        authenticate,
        setAppLockEnabled,
        checkBiometricSupport,
    };
}
