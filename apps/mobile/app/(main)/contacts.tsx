import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
  Alert,
  Share,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import QRCode from 'react-native-qrcode-svg';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { Typography, Spacing, BorderRadius } from '@/constants/typography';
import { useContacts } from '@/hooks/useContacts';
import { Button } from '@/components';
import type { ContactWithDetails, CreateInvitationResponse } from '@alles-gut/shared';

const MAX_CONTACTS = 5;

export default function ContactsScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { contacts, isLoading, removeContact, createInvitation } = useContacts();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [invitation, setInvitation] = useState<CreateInvitationResponse | null>(null);
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);

  const activeContacts = contacts.filter((c) => c.status === 'accepted');
  const pendingContacts = contacts.filter((c) => c.status === 'pending');

  const handleCreateInvite = async () => {
    setIsCreatingInvite(true);
    try {
      const inv = await createInvitation();
      setInvitation(inv);
      setShowInviteModal(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      Alert.alert(t('common.error'), t('errors.inviteCreateFailed'));
    } finally {
      setIsCreatingInvite(false);
    }
  };

  const handleCopyLink = async () => {
    if (invitation?.inviteLink) {
      await Clipboard.setStringAsync(invitation.inviteLink);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(t('contacts.copied'), t('contacts.linkCopied'));
    }
  };

  const handleShareLink = async () => {
    if (invitation?.inviteLink) {
      await Share.share({
        message: t('contacts.shareMessage', { link: invitation.inviteLink }),
      });
    }
  };

  const handleRemoveContact = (contact: ContactWithDetails) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      t('contacts.removeContact'),
      t('contacts.removeConfirm', { name: contact.displayName }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.remove'),
          style: 'destructive',
          onPress: () => removeContact(contact.id),
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const renderContact = ({ item }: { item: ContactWithDetails }) => (
    <Pressable
      style={[styles.contactCard, { backgroundColor: theme.surface }]}
      onLongPress={() => handleRemoveContact(item)}
    >
      <View style={[styles.contactAvatar, { backgroundColor: theme.primary }]}>
        <Text style={styles.avatarText}>
          {item.displayName.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.contactInfo}>
        <Text style={[styles.contactName, { color: theme.text }]}>
          {item.displayName}
        </Text>
        <View style={styles.contactStatus}>
          {item.status === 'accepted' ? (
            <>
              <Ionicons name="checkmark-circle" size={14} color={theme.success} />
              <Text style={[styles.statusText, { color: theme.textSecondary }]}>
                {t('contacts.active')} · {formatDate(item.createdAt)}
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="time" size={14} color={theme.warning} />
              <Text style={[styles.statusText, { color: theme.textSecondary }]}>
                {t('contacts.invitePending')}
              </Text>
            </>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
    </Pressable>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>{t('contacts.title')}</Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          {t('contacts.emergencyContacts')} ({activeContacts.length + pendingContacts.length}/{MAX_CONTACTS})
        </Text>

        {contacts.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconContainer, { backgroundColor: theme.surfaceSecondary }]}>
              <Ionicons name="people-outline" size={48} color={theme.textSecondary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              {t('contacts.noContacts')}
            </Text>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              {t('contacts.addContactsHint')}
            </Text>
          </View>
        ) : (
          <FlatList
            data={contacts}
            renderItem={renderContact}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {contacts.length < MAX_CONTACTS && (
            <Button
              title={isCreatingInvite ? t('contacts.creatingInvite') : t('contacts.inviteContact')}
              onPress={handleCreateInvite}
              disabled={isCreatingInvite}
              loading={isCreatingInvite}
              fullWidth
            />
          )}
          <Button
            title={t('contacts.acceptInvite')}
            variant="secondary"
            onPress={() => router.push('/(main)/accept-invite')}
            fullWidth
          />
        </View>
      </View>

      {/* Invite Modal */}
      <Modal
        visible={showInviteModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowInviteModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.separator }]}>
            <Pressable
              onPress={() => setShowInviteModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={28} color={theme.text} />
            </Pressable>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {t('contacts.inviteContact')}
            </Text>
            <View style={styles.closeButton} />
          </View>

          <View style={styles.modalContent}>
            <Text style={[styles.modalDescription, { color: theme.textSecondary }]}>
              {t('contacts.shareQrOrLink')}
            </Text>

            <View style={[styles.qrContainer, { backgroundColor: '#FFFFFF' }]}>
              {invitation?.inviteLink && (
                <QRCode
                  value={invitation.inviteLink}
                  size={200}
                  color="#000000"
                  backgroundColor="#FFFFFF"
                />
              )}
            </View>

            <View style={styles.dividerContainer}>
              <View style={[styles.divider, { backgroundColor: theme.separator }]} />
              <Text style={[styles.dividerText, { color: theme.textSecondary }]}>
                {t('common.or')}
              </Text>
              <View style={[styles.divider, { backgroundColor: theme.separator }]} />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.linkButton,
                { backgroundColor: theme.surface },
                pressed && { opacity: 0.8 },
              ]}
              onPress={handleCopyLink}
            >
              <Ionicons name="copy-outline" size={24} color={theme.primary} />
              <View style={styles.linkInfo}>
                <Text style={[styles.linkLabel, { color: theme.text }]}>
                  {t('contacts.copyLink')}
                </Text>
                <Text
                  style={[styles.linkUrl, { color: theme.textSecondary }]}
                  numberOfLines={1}
                >
                  {invitation?.inviteLink}
                </Text>
              </View>
            </Pressable>

            <Button
              title={t('contacts.shareLink')}
              onPress={handleShareLink}
              fullWidth
              style={{ marginTop: Spacing.md }}
            />

            <View style={styles.validityNote}>
              <Ionicons name="information-circle" size={18} color={theme.textSecondary} />
              <Text style={[styles.validityText, { color: theme.textSecondary }]}>
                {t('contacts.linkValid7Days')}
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    marginBottom: Spacing.md,
  },
  list: {
    gap: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    marginBottom: 2,
  },
  contactStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statusText: {
    fontSize: Typography.fontSize.sm,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.base * 1.4,
  },
  buttonContainer: {
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
    paddingBottom: 100,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
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
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  modalDescription: {
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.base * 1.4,
    marginBottom: Spacing.xl,
  },
  qrContainer: {
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignSelf: 'center',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xl,
    gap: Spacing.md,
  },
  divider: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  linkInfo: {
    flex: 1,
  },
  linkLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
  },
  linkUrl: {
    fontSize: Typography.fontSize.sm,
    marginTop: 2,
  },
  validityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  validityText: {
    fontSize: Typography.fontSize.base,
  },
});
