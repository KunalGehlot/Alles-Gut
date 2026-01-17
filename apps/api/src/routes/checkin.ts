import { Router, Request, Response } from 'express';
import { db } from '../db/client.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

const WARNING_THRESHOLD_HOURS = 6;

// POST /checkin
router.post('/', async (req: Request, res: Response) => {
  try {
    const { userId } = req as AuthenticatedRequest;

    // Get user's check-in interval
    const userResult = await db.query<{
      check_in_interval_hours: number;
      grace_period_hours: number;
      is_paused: boolean;
    }>(
      'SELECT check_in_interval_hours, grace_period_hours, is_paused FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({ error: 'Not Found', message: 'User not found' });
      return;
    }

    const { check_in_interval_hours, grace_period_hours, is_paused } = userResult.rows[0];

    const now = new Date();
    const nextDeadline = new Date(
      now.getTime() + (check_in_interval_hours + grace_period_hours) * 60 * 60 * 1000
    );

    // Update user's last check-in and next deadline
    await db.query(
      `UPDATE users SET last_check_in = $1, next_deadline = $2 WHERE id = $3`,
      [now, nextDeadline, userId]
    );

    // Record check-in in history
    await db.query(
      'INSERT INTO check_ins (user_id, checked_in_at) VALUES ($1, $2)',
      [userId, now]
    );

    // Calculate hours remaining
    const hoursRemaining = Math.ceil(
      (nextDeadline.getTime() - now.getTime()) / (1000 * 60 * 60)
    );

    res.json({
      lastCheckIn: now.toISOString(),
      nextDeadline: nextDeadline.toISOString(),
      hoursRemaining,
      status: 'ok',
      isPaused: is_paused,
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to check in' });
  }
});

// GET /checkin/status
router.get('/status', async (req: Request, res: Response) => {
  try {
    const { userId } = req as AuthenticatedRequest;

    const result = await db.query<{
      last_check_in: Date | null;
      next_deadline: Date | null;
      is_paused: boolean;
    }>(
      'SELECT last_check_in, next_deadline, is_paused FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Not Found', message: 'User not found' });
      return;
    }

    const { last_check_in, next_deadline, is_paused } = result.rows[0];

    let hoursRemaining: number | null = null;
    let status: 'ok' | 'warning' | 'overdue' = 'ok';

    if (next_deadline) {
      const now = new Date();
      hoursRemaining = Math.ceil(
        (next_deadline.getTime() - now.getTime()) / (1000 * 60 * 60)
      );

      if (hoursRemaining <= 0) {
        status = 'overdue';
        hoursRemaining = 0;
      } else if (hoursRemaining <= WARNING_THRESHOLD_HOURS) {
        status = 'warning';
      }
    }

    res.json({
      lastCheckIn: last_check_in?.toISOString() ?? null,
      nextDeadline: next_deadline?.toISOString() ?? null,
      hoursRemaining,
      status,
      isPaused: is_paused,
    });
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to get status' });
  }
});

export default router;
