import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/client.js';
import {
  hashContactInfo,
  generateVerificationCode,
  encrypt,
  generateTokenHash,
  generateSecureToken,
} from '../services/encryption.js';
import { sendVerificationCode } from '../services/email.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  authMiddleware,
  AuthenticatedRequest,
} from '../middleware/auth.js';

const router = Router();

const requestCodeSchema = z.object({
  contactInfo: z.string().email(),
  contactType: z.enum(['email', 'phone']),
});

const verifySchema = z.object({
  contactInfo: z.string().email(),
  code: z.string().length(6),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

// POST /auth/request-code
router.post('/request-code', async (req: Request, res: Response) => {
  try {
    const { contactInfo, contactType } = requestCodeSchema.parse(req.body);
    const contactHash = hashContactInfo(contactInfo);
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing codes for this contact
    await db.query(
      'DELETE FROM verification_codes WHERE contact_info_hash = $1',
      [contactHash]
    );

    // Insert new code
    await db.query(
      `INSERT INTO verification_codes (contact_info_hash, code, expires_at)
       VALUES ($1, $2, $3)`,
      [contactHash, code, expiresAt]
    );

    // Send verification email
    if (contactType === 'email') {
      await sendVerificationCode({ to: contactInfo, code });
    }

    res.json({ message: 'Verification code sent' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation Error', message: error.errors[0].message });
      return;
    }
    console.error('Request code error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to send verification code' });
  }
});

// POST /auth/verify
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { contactInfo, code } = verifySchema.parse(req.body);
    const contactHash = hashContactInfo(contactInfo);

    // Check verification code
    const codeResult = await db.query<{ id: string; attempts: number }>(
      `SELECT id, attempts FROM verification_codes
       WHERE contact_info_hash = $1 AND code = $2 AND expires_at > NOW()`,
      [contactHash, code]
    );

    if (codeResult.rows.length === 0) {
      // Check if there's a code but wrong
      const attemptResult = await db.query<{ id: string; attempts: number }>(
        `SELECT id, attempts FROM verification_codes
         WHERE contact_info_hash = $1 AND expires_at > NOW()`,
        [contactHash]
      );

      if (attemptResult.rows.length > 0) {
        const { id, attempts } = attemptResult.rows[0];

        if (attempts >= 5) {
          // Too many attempts, delete the code
          await db.query('DELETE FROM verification_codes WHERE id = $1', [id]);
          res.status(400).json({ error: 'Too Many Attempts', message: 'Zu viele Versuche. Bitte fordere einen neuen Code an.' });
          return;
        }

        // Increment attempts
        await db.query(
          'UPDATE verification_codes SET attempts = attempts + 1 WHERE id = $1',
          [id]
        );
      }

      res.status(400).json({ error: 'Invalid Code', message: 'Ungültiger oder abgelaufener Code' });
      return;
    }

    // Delete the used code
    await db.query('DELETE FROM verification_codes WHERE id = $1', [codeResult.rows[0].id]);

    // Check if user exists
    let user = await db.query<{ id: string }>(
      `SELECT id FROM users
       WHERE encrypted_contact_info IS NOT NULL`,
      []
    );

    // We need to check by decrypting or use a hash
    // For simplicity, let's use the contact hash approach
    const existingUser = await db.query<{ id: string }>(
      `SELECT u.id FROM users u
       WHERE EXISTS (
         SELECT 1 FROM verification_codes vc
         WHERE vc.contact_info_hash = $1
       )`,
      [contactHash]
    );

    // Actually, let's store a contact hash in the users table for lookup
    // For now, search through users (in production, add a contact_hash column)
    const allUsers = await db.query<{ id: string; encrypted_contact_info: Buffer }>(
      'SELECT id, encrypted_contact_info FROM users'
    );

    let userId: string | null = null;
    let isNewUser = true;

    for (const u of allUsers.rows) {
      try {
        const { decrypt } = await import('../services/encryption.js');
        const decryptedContact = decrypt(u.encrypted_contact_info, u.id);
        if (hashContactInfo(decryptedContact) === contactHash) {
          userId = u.id;
          isNewUser = false;
          break;
        }
      } catch {
        // Decryption failed, skip this user
        continue;
      }
    }

    if (!userId) {
      // Create new user
      const { v4: uuidv4 } = await import('uuid');
      userId = uuidv4();

      const encryptedContactInfo = encrypt(contactInfo, userId);
      const encryptedDisplayName = encrypt('Nutzer', userId); // Default name

      await db.query(
        `INSERT INTO users (id, encrypted_display_name, encrypted_contact_info, contact_type)
         VALUES ($1, $2, $3, $4)`,
        [userId, encryptedContactInfo, encryptedDisplayName, 'email']
      );
    }

    // Generate tokens
    const accessToken = generateAccessToken(userId);
    const refreshToken = generateSecureToken();
    const refreshTokenHash = generateTokenHash(refreshToken);
    const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Store refresh token
    await db.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, refreshTokenHash, refreshExpiresAt]
    );

    // Get user profile
    const userResult = await db.query<{
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

    const userData = userResult.rows[0];
    const { decrypt } = await import('../services/encryption.js');
    const displayName = decrypt(userData.encrypted_display_name, userId);

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: userData.id,
        displayName,
        contactType: userData.contact_type,
        checkInIntervalHours: userData.check_in_interval_hours,
        gracePeriodHours: userData.grace_period_hours,
        isPaused: userData.is_paused,
        lastCheckIn: userData.last_check_in?.toISOString() ?? null,
        nextDeadline: userData.next_deadline?.toISOString() ?? null,
      },
      isNewUser,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation Error', message: error.errors[0].message });
      return;
    }
    console.error('Verify error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Verification failed' });
  }
});

// POST /auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);
    const tokenHash = generateTokenHash(refreshToken);

    // Find valid refresh token
    const tokenResult = await db.query<{ user_id: string; id: string }>(
      `SELECT id, user_id FROM refresh_tokens
       WHERE token_hash = $1 AND expires_at > NOW()`,
      [tokenHash]
    );

    if (tokenResult.rows.length === 0) {
      res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired refresh token' });
      return;
    }

    const { user_id: userId, id: oldTokenId } = tokenResult.rows[0];

    // Delete old refresh token
    await db.query('DELETE FROM refresh_tokens WHERE id = $1', [oldTokenId]);

    // Generate new tokens
    const newAccessToken = generateAccessToken(userId);
    const newRefreshToken = generateSecureToken();
    const newRefreshTokenHash = generateTokenHash(newRefreshToken);
    const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Store new refresh token
    await db.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, newRefreshTokenHash, refreshExpiresAt]
    );

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation Error', message: error.errors[0].message });
      return;
    }
    console.error('Refresh error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Token refresh failed' });
  }
});

// DELETE /auth/logout
router.delete('/logout', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req as AuthenticatedRequest;

    // Delete all refresh tokens for this user
    await db.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);

    res.status(204).send();
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Logout failed' });
  }
});

export default router;
