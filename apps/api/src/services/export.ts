import { query } from '../db/client';
import { decrypt } from './encryption';

interface UserExportData {
    profile: any;
    contacts: any[];
    checkIns: any[];
    alerts: any[];
    invitations: any[];
}

export async function exportUserData(userId: string): Promise<UserExportData> {
    // 1. Fetch User Profile
    const userResult = await query(
        `SELECT id, encrypted_display_name, encrypted_contact_info, contact_type, 
            check_in_interval_hours, grace_period_hours, created_at
     FROM users WHERE id = $1`,
        [userId]
    );

    if (userResult.rows.length === 0) {
        throw new Error('User not found');
    }

    const user = userResult.rows[0];

    // Decrypt sensitive fields
    const profile = {
        ...user,
        displayName: decrypt(user.encrypted_display_name, userId),
        contactInfo: decrypt(user.encrypted_contact_info, userId),
    };

    // Remove encrypted fields from export
    delete (profile as any).encrypted_display_name;
    delete (profile as any).encrypted_contact_info;

    // 2. Fetch Contacts
    const contactsResult = await query(
        `SELECT c.id, c.status, c.created_at,
            CASE 
              WHEN c.user_id = $1 THEN 'initiated' 
              ELSE 'received' 
            END as direction
     FROM contacts c
     WHERE c.user_id = $1 OR c.contact_user_id = $1`,
        [userId]
    );

    // 3. Fetch Check-ins
    const checkInsResult = await query(
        `SELECT checked_in_at FROM check_ins WHERE user_id = $1 ORDER BY checked_in_at DESC`,
        [userId]
    );

    // 4. Fetch Alerts
    const alertsResult = await query(
        `SELECT triggered_at, notified_contacts FROM alerts WHERE user_id = $1 ORDER BY triggered_at DESC`,
        [userId]
    );

    // 5. Fetch Invitations
    const invitationsResult = await query(
        `SELECT invite_code, expires_at, used_at, created_at 
     FROM invitations 
     WHERE from_user_id = $1`,
        [userId]
    );

    return {
        profile,
        contacts: contactsResult.rows,
        checkIns: checkInsResult.rows,
        alerts: alertsResult.rows,
        invitations: invitationsResult.rows,
    };
}
