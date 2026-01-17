import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/client.js';
import { encrypt, decrypt } from '../services/encryption.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

const updateUserSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  checkInIntervalHours: z.number().int().positive().optional(),
  isPaused: z.boolean().optional(),
});

// GET /user/me
router.get('/me', async (req: Request, res: Response) => {
  try {
    const { userId } = req as AuthenticatedRequest;

    const result = await db.query<{
      id: string;
      encrypted_display_name: Buffer;
      contact_type: string;
      check_in_interval_hours: number;
      grace_period_hours: number;
      is_paused: boolean;
      last_check_in: Date | null;
      next_deadline: Date | null;
    }>(
      `SELECT id, encrypted_display_name, contact_type, check_in_interval_hours,
              grace_period_hours, is_paused, last_check_in, next_deadline
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Not Found', message: 'User not found' });
      return;
    }

    const user = result.rows[0];
    const displayName = decrypt(user.encrypted_display_name, userId);

    res.json({
      id: user.id,
      displayName,
      contactType: user.contact_type,
      checkInIntervalHours: user.check_in_interval_hours,
      gracePeriodHours: user.grace_period_hours,
      isPaused: user.is_paused,
      lastCheckIn: user.last_check_in?.toISOString() ?? null,
      nextDeadline: user.next_deadline?.toISOString() ?? null,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to get user' });
  }
});

// PATCH /user/me
router.patch('/me', async (req: Request, res: Response) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const updates = updateUserSchema.parse(req.body);

    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (updates.displayName !== undefined) {
      const encryptedName = encrypt(updates.displayName, userId);
      setClauses.push(`encrypted_display_name = $${paramIndex++}`);
      values.push(encryptedName);
    }

    if (updates.checkInIntervalHours !== undefined) {
      setClauses.push(`check_in_interval_hours = $${paramIndex++}`);
      values.push(updates.checkInIntervalHours);

      // Recalculate next deadline if interval changes
      const lastCheckInResult = await db.query<{ last_check_in: Date | null }>(
        'SELECT last_check_in FROM users WHERE id = $1',
        [userId]
      );

      if (lastCheckInResult.rows[0]?.last_check_in) {
        const lastCheckIn = lastCheckInResult.rows[0].last_check_in;
        const nextDeadline = new Date(
          lastCheckIn.getTime() +
          (updates.checkInIntervalHours + 6) * 60 * 60 * 1000
        );
        setClauses.push(`next_deadline = $${paramIndex++}`);
        values.push(nextDeadline);
      }
    }

    if (updates.isPaused !== undefined) {
      setClauses.push(`is_paused = $${paramIndex++}`);
      values.push(updates.isPaused);
    }

    if (setClauses.length === 0) {
      res.status(400).json({ error: 'Bad Request', message: 'No valid fields to update' });
      return;
    }

    values.push(userId);

    await db.query(
      `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`,
      values
    );

    // Return updated user
    const result = await db.query<{
      id: string;
      encrypted_display_name: Buffer;
      contact_type: string;
      check_in_interval_hours: number;
      grace_period_hours: number;
      is_paused: boolean;
      last_check_in: Date | null;
      next_deadline: Date | null;
    }>(
      `SELECT id, encrypted_display_name, contact_type, check_in_interval_hours,
              grace_period_hours, is_paused, last_check_in, next_deadline
       FROM users WHERE id = $1`,
      [userId]
    );

    const user = result.rows[0];
    const displayName = decrypt(user.encrypted_display_name, userId);

    res.json({
      id: user.id,
      displayName,
      contactType: user.contact_type,
      checkInIntervalHours: user.check_in_interval_hours,
      gracePeriodHours: user.grace_period_hours,
      isPaused: user.is_paused,
      lastCheckIn: user.last_check_in?.toISOString() ?? null,
      nextDeadline: user.next_deadline?.toISOString() ?? null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation Error', message: error.errors[0].message });
      return;
    }
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update user' });
  }
});

// DELETE /user/me (GDPR - Right to Deletion)
router.delete('/me', async (req: Request, res: Response) => {
  try {
    const { userId } = req as AuthenticatedRequest;

    await db.transaction(async (client) => {
      // Delete all related data
      await client.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM alerts WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM check_ins WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM invitations WHERE from_user_id = $1', [userId]);
      await client.query('DELETE FROM contacts WHERE user_id = $1 OR contact_user_id = $1', [userId]);
      await client.query('DELETE FROM users WHERE id = $1', [userId]);
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to delete account' });
  }
});

// GET /user/export (GDPR - Right to Data Portability)
router.get('/export', async (req: Request, res: Response) => {
  try {
    const { userId } = req as AuthenticatedRequest;

    // Get user data
    const userResult = await db.query<{
      id: string;
      encrypted_display_name: Buffer;
      encrypted_contact_info: Buffer;
      contact_type: string;
      check_in_interval_hours: number;
      grace_period_hours: number;
      is_paused: boolean;
      last_check_in: Date | null;
      next_deadline: Date | null;
      created_at: Date;
    }>(
      `SELECT id, encrypted_display_name, encrypted_contact_info, contact_type,
              check_in_interval_hours, grace_period_hours, is_paused,
              last_check_in, next_deadline, created_at
       FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({ error: 'Not Found', message: 'User not found' });
      return;
    }

    const user = userResult.rows[0];

    // Get check-in history
    const checkInsResult = await db.query<{ checked_in_at: Date }>(
      'SELECT checked_in_at FROM check_ins WHERE user_id = $1 ORDER BY checked_in_at DESC',
      [userId]
    );

    // Get contacts
    const contactsResult = await db.query<{
      id: string;
      status: string;
      created_at: Date;
    }>(
      'SELECT id, status, created_at FROM contacts WHERE user_id = $1',
      [userId]
    );

    // Get alerts
    const alertsResult = await db.query<{
      triggered_at: Date;
      notified_contacts: string[];
    }>(
      'SELECT triggered_at, notified_contacts FROM alerts WHERE user_id = $1 ORDER BY triggered_at DESC',
      [userId]
    );

    const exportData = {
      user: {
        id: user.id,
        displayName: decrypt(user.encrypted_display_name, userId),
        contactInfo: decrypt(user.encrypted_contact_info, userId),
        contactType: user.contact_type,
        checkInIntervalHours: user.check_in_interval_hours,
        gracePeriodHours: user.grace_period_hours,
        isPaused: user.is_paused,
        lastCheckIn: user.last_check_in?.toISOString() ?? null,
        nextDeadline: user.next_deadline?.toISOString() ?? null,
        createdAt: user.created_at.toISOString(),
      },
      checkIns: checkInsResult.rows.map(c => ({
        checkedInAt: c.checked_in_at.toISOString(),
      })),
      contacts: contactsResult.rows.map(c => ({
        id: c.id,
        status: c.status,
        createdAt: c.created_at.toISOString(),
      })),
      alerts: alertsResult.rows.map(a => ({
        triggeredAt: a.triggered_at.toISOString(),
        notifiedContactsCount: a.notified_contacts.length,
      })),
      exportedAt: new Date().toISOString(),
    };

    res.json(exportData);
  } catch (error) {
    console.error('Export user data error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to export data' });
  }
});

export default router;
