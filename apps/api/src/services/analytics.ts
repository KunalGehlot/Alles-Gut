import { query } from '../db/client';

interface AnalyticsEvent {
    sessionId?: string;
    eventType: string;
    eventData?: Record<string, any>;
}

export async function logAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
    const { sessionId, eventType, eventData } = event;

    await query(
        `INSERT INTO analytics_events (session_id, event_type, event_data)
     VALUES ($1, $2, $3)`,
        [sessionId || null, eventType, eventData || {}]
    );
}
