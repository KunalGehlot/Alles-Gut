import { Router } from 'express';
import { logAnalyticsEvent } from '../services/analytics';
import { z } from 'zod';

const router = Router();

const analyticsSchema = z.object({
    sessionId: z.string().optional(),
    eventType: z.string(),
    eventData: z.record(z.any()).optional(),
});

router.post('/', async (req, res) => {
    try {
        const event = analyticsSchema.parse(req.body);
        await logAnalyticsEvent(event);
        res.status(200).json({ success: true });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Invalid Request', details: error.errors });
        } else {
            console.error('Analytics Error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
});

export const analyticsRouter = router;
