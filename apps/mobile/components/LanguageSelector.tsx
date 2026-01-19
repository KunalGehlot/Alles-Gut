import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { useLocale } from '@/contexts/LocaleContext';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/locales';
import { Typography, Spacing, BorderRadius } from '@/constants/typography';

interface LanguageSelectorProps {
  visible: boolean;
  onClose: () => void;
}

export function LanguageSelector({ visible, onClose }: LanguageSelectorProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { locale, setLocale } = useLocale();

  const languages = Object.entries(SUPPORTED_LANGUAGES).map(([code, info]) => ({
    code: code as SupportedLanguage,
    ...info,
  }));

  const handleSelectLanguage = async (languageCode: SupportedLanguage) => {
    await setLocale(languageCode);
    onClose();
  };

  const renderLanguageItem = ({ item }: { item: typeof languages[0] }) => (
    <Pressable
      style={({ pressed }) => [
        styles.languageItem,
        { backgroundColor: pressed ? theme.surfaceSecondary : theme.surface },
      ]}
      onPress={() => handleSelectLanguage(item.code)}
    >
      <View style={styles.languageInfo}>
        <Text style={[styles.languageName, { color: theme.text }]}>
          {item.nativeName}
        </Text>
        <Text style={[styles.languageEnglishName, { color: theme.textSecondary }]}>
          {item.name}
        </Text>
      </View>
      {locale === item.code && (
        <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
      )}
    </Pressable>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.separator }]}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={theme.text} />
          </Pressable>
          <Text style={[styles.title, { color: theme.text }]}>
            {t('settings.language')}
          </Text>
          <View style={styles.closeButton} />
        </View>

        <FlatList
          data={languages}
          renderItem={renderLanguageItem}
          keyExtractor={(item) => item.code}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: theme.separator }]} />
          )}
        />
      </SafeAreaView>
    </Modal>
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: Typography.fontSize.base,
    fontWeight: '500',
  },
  languageEnglishName: {
    fontSize: Typography.fontSize.sm,
    marginTop: 2,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginVertical: Spacing.xs,
  },
});
