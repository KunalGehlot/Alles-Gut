import cron from 'node-cron';
import { db } from '../db/client.js';
import { decrypt } from './encryption.js';
import { sendAlertNotifications } from './notifications.js';
import { sendAlertEmail } from './email.js';

interface OverdueUser {
  id: string;
  encrypted_display_name: Buffer;
  last_check_in: Date;
  next_deadline: Date;
}

interface Contact {
  contact_user_id: string;
  expo_push_token: string | null;
  encrypted_contact_info: Buffer;
  contact_type: string;
}

export function startScheduler(): void {
  // Check for missed deadlines every minute
  cron.schedule('* * * * *', async () => {
    try {
      await checkMissedDeadlines();
    } catch (error) {
      console.error('Scheduler error:', error);
    }
  });

  // Cleanup expired tokens and codes every hour
  cron.schedule('0 * * * *', async () => {
    try {
      await cleanupExpiredData();
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  });

  console.log('Scheduler started');
}

async function checkMissedDeadlines(): Promise<void> {
  // Find users who have missed their deadline (including grace period)
  // and haven't been paused
  const result = await db.query<OverdueUser>(`
    SELECT id, encrypted_display_name, last_check_in, next_deadline
    FROM users
    WHERE next_deadline < NOW()
      AND is_paused = FALSE
      AND id NOT IN (
        SELECT user_id FROM alerts
        WHERE triggered_at > NOW() - INTERVAL '1 hour'
      )
  `);

  for (const user of result.rows) {
    await triggerAlert(user);
  }
}

async function triggerAlert(user: OverdueUser): Promise<void> {
  const userName = decrypt(user.encrypted_display_name, user.id);
  const hoursSinceCheckIn = Math.floor(
    (Date.now() - new Date(user.last_check_in).getTime()) / (1000 * 60 * 60)
  );

  // Get all accepted contacts for this user
  const contactsResult = await db.query<Contact>(`
    SELECT
      c.contact_user_id,
      u.expo_push_token,
      u.encrypted_contact_info,
      u.contact_type
    FROM contacts c
    JOIN users u ON u.id = c.contact_user_id
    WHERE c.user_id = $1 AND c.status = 'accepted'
  `, [user.id]);

  if (contactsResult.rows.length === 0) {
    console.log(`No contacts to notify for user ${user.id}`);
    return;
  }

  const pushTokens: string[] = [];
  const emailContacts: { email: string; contactId: string }[] = [];

  for (const contact of contactsResult.rows) {
    // Collect push tokens
    if (contact.expo_push_token) {
      pushTokens.push(contact.expo_push_token);
    }

    // Collect email addresses for backup notification
    if (contact.contact_type === 'email') {
      const email = decrypt(contact.encrypted_contact_info, contact.contact_user_id);
      emailContacts.push({ email, contactId: contact.contact_user_id });
    }
  }

  // Send push notifications
  if (pushTokens.length > 0) {
    await sendAlertNotifications({
      pushTokens,
      userName,
      hoursSinceCheckIn,
    });
  }

  // Send backup emails
  for (const { email } of emailContacts) {
    try {
      await sendAlertEmail({
        to: email,
        userName,
        hoursSinceCheckIn,
      });
    } catch (error) {
      console.error(`Failed to send alert email to ${email}:`, error);
    }
  }

  // Log the alert
  const notifiedContactIds = contactsResult.rows.map(c => c.contact_user_id);
  await db.query(`
    INSERT INTO alerts (user_id, notified_contacts)
    VALUES ($1, $2)
  `, [user.id, notifiedContactIds]);

  console.log(`Alert triggered for user ${user.id}, notified ${notifiedContactIds.length} contacts`);
}

async function cleanupExpiredData(): Promise<void> {
  // Clean up expired verification codes
  await db.query(`DELETE FROM verification_codes WHERE expires_at < NOW()`);

  // Clean up expired refresh tokens
  await db.query(`DELETE FROM refresh_tokens WHERE expires_at < NOW()`);

  // Clean up expired and unused invitations
  await db.query(`
    DELETE FROM invitations
    WHERE expires_at < NOW() AND used_at IS NULL
  `);

  console.log('Expired data cleaned up');
}
