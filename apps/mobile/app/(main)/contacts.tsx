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
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { Colors } from '@/constants/colors';
import { Typography, Spacing, BorderRadius } from '@/constants/typography';
import { useContacts } from '@/hooks/useContacts';
import type { ContactWithDetails, CreateInvitationResponse } from '@alles-gut/shared';

const MAX_CONTACTS = 5;

export default function ContactsScreen() {
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
    } catch (err) {
      Alert.alert('Fehler', 'Einladung konnte nicht erstellt werden.');
    } finally {
      setIsCreatingInvite(false);
    }
  };

  const handleCopyLink = async () => {
    if (invitation?.inviteLink) {
      await Clipboard.setStringAsync(invitation.inviteLink);
      Alert.alert('Kopiert', 'Link wurde in die Zwischenablage kopiert.');
    }
  };

  const handleShareLink = async () => {
    if (invitation?.inviteLink) {
      await Share.share({
        message: `Ich möchte dich als Notfallkontakt in der Alles Gut App hinzufügen. Bitte installiere die App und nutze diesen Link: ${invitation.inviteLink}`,
      });
    }
  };

  const handleRemoveContact = (contact: ContactWithDetails) => {
    Alert.alert(
      'Kontakt entfernen',
      `Möchtest du ${contact.displayName} wirklich als Notfallkontakt entfernen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Entfernen',
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
      style={styles.contactCard}
      onLongPress={() => handleRemoveContact(item)}
    >
      <View style={styles.contactAvatar}>
        <Text style={styles.avatarText}>
          {item.displayName.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.displayName}</Text>
        <View style={styles.contactStatus}>
          {item.status === 'accepted' ? (
            <>
              <Text style={styles.statusDot}>&#x2713;</Text>
              <Text style={styles.statusText}>
                Aktiv · Hinzugefügt am {formatDate(item.createdAt)}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.statusDotPending}>&#x23F3;</Text>
              <Text style={styles.statusText}>Einladung ausstehend</Text>
            </>
          )}
        </View>
      </View>
    </Pressable>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Kontakte</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>
          Deine Notfallkontakte ({activeContacts.length + pendingContacts.length}/{MAX_CONTACTS})
        </Text>

        {contacts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>&#x1F465;</Text>
            <Text style={styles.emptyTitle}>Keine Kontakte</Text>
            <Text style={styles.emptyText}>
              Füge Notfallkontakte hinzu, die benachrichtigt werden, wenn du
              dich nicht meldest.
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

        {contacts.length < MAX_CONTACTS && (
          <Pressable
            style={({ pressed }) => [
              styles.inviteButton,
              pressed && styles.buttonPressed,
              isCreatingInvite && styles.buttonDisabled,
            ]}
            onPress={handleCreateInvite}
            disabled={isCreatingInvite}
          >
            {isCreatingInvite ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Text style={styles.inviteIcon}>+</Text>
                <Text style={styles.inviteText}>Kontakt einladen</Text>
              </>
            )}
          </Pressable>
        )}
      </View>

      {/* Invite Modal */}
      <Modal
        visible={showInviteModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowInviteModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable
              onPress={() => setShowInviteModal(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeText}>&#x2715;</Text>
            </Pressable>
            <Text style={styles.modalTitle}>Kontakt einladen</Text>
            <View style={styles.closeButton} />
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.modalDescription}>
              Teile diesen Link oder QR-Code mit der Person, die dich im Notfall
              benachrichtigt werden soll.
            </Text>

            <View style={styles.qrContainer}>
              {invitation?.inviteLink && (
                <QRCode
                  value={invitation.inviteLink}
                  size={200}
                  color={Colors.textPrimary}
                  backgroundColor={Colors.white}
                />
              )}
            </View>

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>ODER</Text>
              <View style={styles.divider} />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.linkButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleCopyLink}
            >
              <Text style={styles.linkIcon}>&#x1F4CB;</Text>
              <View style={styles.linkInfo}>
                <Text style={styles.linkLabel}>Link kopieren</Text>
                <Text style={styles.linkUrl} numberOfLines={1}>
                  {invitation?.inviteLink}
                </Text>
              </View>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.shareButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleShareLink}
            >
              <Text style={styles.shareIcon}>&#x1F4E4;</Text>
              <Text style={styles.shareText}>Link teilen</Text>
            </Pressable>

            <View style={styles.validityNote}>
              <Text style={styles.validityIcon}>&#x2139;</Text>
              <Text style={styles.validityText}>
                Der Link ist 7 Tage gültig
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
    backgroundColor: Colors.background,
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
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  list: {
    gap: Spacing.sm,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '600',
    color: Colors.white,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  contactStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statusDot: {
    color: Colors.success,
    fontSize: Typography.fontSize.sm,
  },
  statusDotPending: {
    color: Colors.warning,
    fontSize: Typography.fontSize.sm,
  },
  statusText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.base,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  inviteIcon: {
    fontSize: Typography.fontSize.xl,
    color: Colors.white,
    fontWeight: 'bold',
  },
  inviteText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.white,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: Typography.fontSize.xl,
    color: Colors.textPrimary,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  modalDescription: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.base,
    marginBottom: Spacing.xl,
  },
  qrContainer: {
    alignItems: 'center',
    backgroundColor: Colors.white,
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
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  linkIcon: {
    fontSize: 24,
  },
  linkInfo: {
    flex: 1,
  },
  linkLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  linkUrl: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  shareIcon: {
    fontSize: 20,
    color: Colors.white,
  },
  shareText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.white,
  },
  validityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  validityIcon: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textSecondary,
  },
  validityText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },
});
