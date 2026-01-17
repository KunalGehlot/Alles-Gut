import { Router, Request, Response } from 'express';
import { z } from 'zod';
import Expo from 'expo-server-sdk';
import { db } from '../db/client.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

const registerTokenSchema = z.object({
  pushToken: z.string().refine((token) => Expo.isExpoPushToken(token), {
    message: 'Invalid Expo push token',
  }),
});

// POST /notifications/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const { pushToken } = registerTokenSchema.parse(req.body);

    await db.query(
      'UPDATE users SET expo_push_token = $1 WHERE id = $2',
      [pushToken, userId]
    );

    res.json({ message: 'Push token registered' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation Error', message: error.errors[0].message });
      return;
    }
    console.error('Register push token error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to register push token' });
  }
});

export default router;
