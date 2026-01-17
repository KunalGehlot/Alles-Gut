import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/client.js';
import { generateInviteCode, decrypt } from '../services/encryption.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

const MAX_CONTACTS = 5;
const INVITATION_EXPIRY_DAYS = 7;
const APP_URL = process.env.APP_URL || 'https://allesgut.app';

const acceptInvitationSchema = z.object({
  inviteCode: z.string().min(1),
});

// GET /contacts
router.get('/', async (req: Request, res: Response) => {
  try {
    const { userId } = req as AuthenticatedRequest;

    // Get contacts where the user is either the owner or the contact
    const result = await db.query<{
      id: string;
      user_id: string;
      contact_user_id: string;
      status: string;
      created_at: Date;
    }>(
      `SELECT id, user_id, contact_user_id, status, created_at
       FROM contacts
       WHERE user_id = $1 OR contact_user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    const contacts = await Promise.all(
      result.rows.map(async (contact) => {
        // Get the other user's info
        const otherUserId =
          contact.user_id === userId ? contact.contact_user_id : contact.user_id;

        const userResult = await db.query<{
          encrypted_display_name: Buffer;
          last_check_in: Date | null;
        }>(
          'SELECT encrypted_display_name, last_check_in FROM users WHERE id = $1',
          [otherUserId]
        );

        if (userResult.rows.length === 0) {
          return null;
        }

        const otherUser = userResult.rows[0];
        const displayName = decrypt(otherUser.encrypted_display_name, otherUserId);

        return {
          id: contact.id,
          userId: contact.user_id,
          contactUserId: contact.contact_user_id,
          status: contact.status,
          createdAt: contact.created_at.toISOString(),
          displayName,
          lastCheckIn: otherUser.last_check_in?.toISOString() ?? null,
        };
      })
    );

    res.json(contacts.filter(Boolean));
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to get contacts' });
  }
});

// POST /contacts/invite
router.post('/invite', async (req: Request, res: Response) => {
  try {
    const { userId } = req as AuthenticatedRequest;

    // Check contact limit
    const countResult = await db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM contacts
       WHERE (user_id = $1 OR contact_user_id = $1) AND status = 'accepted'`,
      [userId]
    );

    if (parseInt(countResult.rows[0].count) >= MAX_CONTACTS) {
      res.status(400).json({
        error: 'Limit Reached',
        message: `Du kannst maximal ${MAX_CONTACTS} Kontakte haben.`,
      });
      return;
    }

    const inviteCode = generateInviteCode();
    const expiresAt = new Date(Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    await db.query(
      `INSERT INTO invitations (from_user_id, invite_code, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, inviteCode, expiresAt]
    );

    res.json({
      inviteCode,
      inviteLink: `${APP_URL}/invite/${inviteCode}`,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('Create invitation error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to create invitation' });
  }
});

// POST /contacts/accept
router.post('/accept', async (req: Request, res: Response) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const { inviteCode } = acceptInvitationSchema.parse(req.body);

    // Find valid invitation
    const inviteResult = await db.query<{
      id: string;
      from_user_id: string;
    }>(
      `SELECT id, from_user_id FROM invitations
       WHERE invite_code = $1 AND expires_at > NOW() AND used_at IS NULL`,
      [inviteCode]
    );

    if (inviteResult.rows.length === 0) {
      res.status(400).json({
        error: 'Invalid Invitation',
        message: 'Ungültige oder abgelaufene Einladung.',
      });
      return;
    }

    const invitation = inviteResult.rows[0];

    // Can't accept own invitation
    if (invitation.from_user_id === userId) {
      res.status(400).json({
        error: 'Invalid Invitation',
        message: 'Du kannst deine eigene Einladung nicht annehmen.',
      });
      return;
    }

    // Check if already contacts
    const existingResult = await db.query<{ id: string }>(
      `SELECT id FROM contacts
       WHERE (user_id = $1 AND contact_user_id = $2)
          OR (user_id = $2 AND contact_user_id = $1)`,
      [invitation.from_user_id, userId]
    );

    if (existingResult.rows.length > 0) {
      res.status(400).json({
        error: 'Already Connected',
        message: 'Ihr seid bereits Kontakte.',
      });
      return;
    }

    // Check contact limits for both users
    const fromUserCount = await db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM contacts
       WHERE (user_id = $1 OR contact_user_id = $1) AND status = 'accepted'`,
      [invitation.from_user_id]
    );

    const toUserCount = await db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM contacts
       WHERE (user_id = $1 OR contact_user_id = $1) AND status = 'accepted'`,
      [userId]
    );

    if (parseInt(fromUserCount.rows[0].count) >= MAX_CONTACTS) {
      res.status(400).json({
        error: 'Limit Reached',
        message: 'Der andere Nutzer hat bereits die maximale Anzahl an Kontakten.',
      });
      return;
    }

    if (parseInt(toUserCount.rows[0].count) >= MAX_CONTACTS) {
      res.status(400).json({
        error: 'Limit Reached',
        message: `Du kannst maximal ${MAX_CONTACTS} Kontakte haben.`,
      });
      return;
    }

    // Create bidirectional contact relationship
    await db.transaction(async (client) => {
      // Mark invitation as used
      await client.query(
        `UPDATE invitations SET used_at = NOW(), used_by_user_id = $1 WHERE id = $2`,
        [userId, invitation.id]
      );

      // Create contact entry (immediately accepted since both parties agreed)
      await client.query(
        `INSERT INTO contacts (user_id, contact_user_id, status)
         VALUES ($1, $2, 'accepted')`,
        [invitation.from_user_id, userId]
      );
    });

    // Get the new contact info
    const userResult = await db.query<{
      encrypted_display_name: Buffer;
      last_check_in: Date | null;
    }>(
      'SELECT encrypted_display_name, last_check_in FROM users WHERE id = $1',
      [invitation.from_user_id]
    );

    const otherUser = userResult.rows[0];
    const displayName = decrypt(otherUser.encrypted_display_name, invitation.from_user_id);

    // Get the created contact
    const contactResult = await db.query<{
      id: string;
      user_id: string;
      contact_user_id: string;
      status: string;
      created_at: Date;
    }>(
      `SELECT id, user_id, contact_user_id, status, created_at
       FROM contacts WHERE user_id = $1 AND contact_user_id = $2`,
      [invitation.from_user_id, userId]
    );

    const contact = contactResult.rows[0];

    res.json({
      id: contact.id,
      userId: contact.user_id,
      contactUserId: contact.contact_user_id,
      status: contact.status,
      createdAt: contact.created_at.toISOString(),
      displayName,
      lastCheckIn: otherUser.last_check_in?.toISOString() ?? null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation Error', message: error.errors[0].message });
      return;
    }
    console.error('Accept invitation error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to accept invitation' });
  }
});

// DELETE /contacts/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const { id } = req.params;

    // Verify ownership
    const result = await db.query<{ id: string }>(
      `SELECT id FROM contacts
       WHERE id = $1 AND (user_id = $2 OR contact_user_id = $2)`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Not Found', message: 'Contact not found' });
      return;
    }

    await db.query('DELETE FROM contacts WHERE id = $1', [id]);

    res.status(204).send();
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to remove contact' });
  }
});

export default router;
