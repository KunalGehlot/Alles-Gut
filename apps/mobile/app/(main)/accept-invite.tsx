import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { Typography, Spacing, BorderRadius } from '@/constants/typography';
import { api } from '@/services/api';
import { Button } from '@/components';

export default function AcceptInviteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string }>();
  const { theme } = useTheme();
  const { t } = useTranslation();

  const [permission, requestPermission] = useCameraPermissions();
  const [manualCode, setManualCode] = useState(params.code ?? '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [scanned, setScanned] = useState(false);

  // If code was passed via params, process it immediately
  useEffect(() => {
    if (params.code && params.code.length > 0) {
      setShowManualEntry(true);
      handleAcceptInvite(params.code);
    }
  }, [params.code]);

  const handleAcceptInvite = async (code: string) => {
    if (isProcessing || !code.trim()) return;

    setIsProcessing(true);
    try {
      await api.acceptInvitation({ inviteCode: code.trim() });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        t('acceptInvite.inviteAccepted'),
        t('acceptInvite.successMessage'),
        [{ text: t('common.ok'), onPress: () => router.back() }]
      );
    } catch (error: unknown) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const message =
        error instanceof Error
          ? error.message
          : t('acceptInvite.couldNotAccept');
      Alert.alert(t('common.error'), message);
      setScanned(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned || isProcessing) return;
    setScanned(true);

    // Extract code from URL if it's a full URL
    let code = data;
    if (data.includes('allesgut://invite/')) {
      code = data.split('allesgut://invite/')[1];
    } else if (data.includes('/invite/')) {
      code = data.split('/invite/')[1];
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    handleAcceptInvite(code);
  };

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      handleAcceptInvite(manualCode.trim());
    }
  };

  if (!permission) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={theme.primary} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>{t('acceptInvite.title')}</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {!showManualEntry && permission.granted ? (
          <>
            <View style={styles.scannerContainer}>
              <CameraView
                style={styles.scanner}
                facing="back"
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                  barcodeTypes: ['qr'],
                }}
              />
              <View style={styles.scannerOverlay}>
                <View style={[styles.scannerFrame, { borderColor: theme.primary }]} />
              </View>
              {isProcessing && (
                <View style={styles.processingOverlay}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                  <Text style={styles.processingText}>{t('common.processing')}</Text>
                </View>
              )}
            </View>

            <Text style={[styles.instructions, { color: theme.textSecondary }]}>
              {t('acceptInvite.scanQrCode')}
            </Text>

            <Pressable
              onPress={() => setShowManualEntry(true)}
              style={styles.manualLink}
            >
              <Text style={[styles.manualLinkText, { color: theme.primary }]}>
                {t('acceptInvite.enterCodeManually')}
              </Text>
            </Pressable>
          </>
        ) : !permission.granted ? (
          <View style={styles.permissionContainer}>
            <Ionicons name="camera-outline" size={64} color={theme.textSecondary} />
            <Text style={[styles.permissionTitle, { color: theme.text }]}>
              {t('acceptInvite.cameraRequired')}
            </Text>
            <Text style={[styles.permissionText, { color: theme.textSecondary }]}>
              {t('acceptInvite.cameraPermissionText')}
            </Text>
            <Button
              title={t('acceptInvite.allowCamera')}
              onPress={requestPermission}
              style={{ marginTop: Spacing.lg }}
            />
            <Pressable
              onPress={() => setShowManualEntry(true)}
              style={styles.manualLink}
            >
              <Text style={[styles.manualLinkText, { color: theme.primary }]}>
                {t('acceptInvite.enterCodeManually')}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.manualContainer}>
            <Text style={[styles.manualTitle, { color: theme.text }]}>
              {t('acceptInvite.enterInviteCode')}
            </Text>
            <Text style={[styles.manualDescription, { color: theme.textSecondary }]}>
              {t('acceptInvite.enterCodeDescription')}
            </Text>

            <View style={[styles.inputContainer, { backgroundColor: theme.surface }]}>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={manualCode}
                onChangeText={setManualCode}
                placeholder={t('acceptInvite.codePlaceholder')}
                placeholderTextColor={theme.textTertiary}
                autoCapitalize="characters"
                autoCorrect={false}
                autoFocus
              />
            </View>

            <Button
              title={isProcessing ? t('common.processing') : t('acceptInvite.title')}
              onPress={handleManualSubmit}
              disabled={!manualCode.trim() || isProcessing}
              fullWidth
              style={{ marginTop: Spacing.lg }}
            />

            {permission.granted && (
              <Pressable
                onPress={() => {
                  setShowManualEntry(false);
                  setScanned(false);
                }}
                style={styles.manualLink}
              >
                <Text style={[styles.manualLinkText, { color: theme.primary }]}>
                  {t('acceptInvite.scanQrCodeButton')}
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  backButton: {
    padding: Spacing.sm,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  scannerContainer: {
    height: 300,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginTop: Spacing.lg,
  },
  scanner: {
    flex: 1,
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerFrame: {
    width: 200,
    height: 200,
    borderWidth: 3,
    borderRadius: BorderRadius.lg,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingText: {
    color: '#FFFFFF',
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.base,
  },
  instructions: {
    textAlign: 'center',
    marginTop: Spacing.lg,
    fontSize: Typography.fontSize.base,
  },
  manualLink: {
    marginTop: Spacing.lg,
    alignItems: 'center',
    padding: Spacing.md,
  },
  manualLinkText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '500',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  permissionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '600',
    marginTop: Spacing.lg,
  },
  permissionText: {
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  manualContainer: {
    flex: 1,
    paddingTop: Spacing.xl,
  },
  manualTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '600',
    textAlign: 'center',
  },
  manualDescription: {
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  inputContainer: {
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    marginTop: Spacing.xl,
  },
  input: {
    fontSize: Typography.fontSize.lg,
    textAlign: 'center',
    letterSpacing: 2,
  },
});
