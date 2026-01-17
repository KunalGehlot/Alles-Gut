import Expo, { ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';

const expo = new Expo();

interface SendPushNotificationParams {
  pushToken: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export async function sendPushNotification({
  pushToken,
  title,
  body,
  data,
}: SendPushNotificationParams): Promise<boolean> {
  if (!Expo.isExpoPushToken(pushToken)) {
    console.error(`Push token ${pushToken} is not a valid Expo push token`);
    return false;
  }

  const message: ExpoPushMessage = {
    to: pushToken,
    sound: 'default',
    title,
    body,
    data,
    priority: 'high',
  };

  try {
    const tickets = await expo.sendPushNotificationsAsync([message]);
    const ticket = tickets[0];

    if (ticket.status === 'error') {
      console.error(`Push notification error: ${ticket.message}`);
      if (ticket.details?.error === 'DeviceNotRegistered') {
        // Token is no longer valid
        return false;
      }
    }

    return ticket.status === 'ok';
  } catch (error) {
    console.error('Failed to send push notification:', error);
    return false;
  }
}

interface SendAlertNotificationParams {
  pushTokens: string[];
  userName: string;
  hoursSinceCheckIn: number;
}

export async function sendAlertNotifications({
  pushTokens,
  userName,
  hoursSinceCheckIn,
}: SendAlertNotificationParams): Promise<ExpoPushTicket[]> {
  const messages: ExpoPushMessage[] = pushTokens
    .filter(token => Expo.isExpoPushToken(token))
    .map(token => ({
      to: token,
      sound: 'default',
      title: 'Wichtige Mitteilung',
      body: `${userName} hat sich seit ${hoursSinceCheckIn} Stunden nicht gemeldet. Bitte prüfe, ob alles in Ordnung ist.`,
      priority: 'high' as const,
      data: {
        type: 'alert',
        userName,
        hoursSinceCheckIn,
      },
    }));

  if (messages.length === 0) {
    return [];
  }

  try {
    // Expo recommends sending in chunks of 100
    const chunks = expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];

    for (const chunk of chunks) {
      const chunkTickets = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...chunkTickets);
    }

    return tickets;
  } catch (error) {
    console.error('Failed to send alert notifications:', error);
    return [];
  }
}

interface SendReminderNotificationParams {
  pushToken: string;
  hoursRemaining: number;
}

export async function sendReminderNotification({
  pushToken,
  hoursRemaining,
}: SendReminderNotificationParams): Promise<boolean> {
  return sendPushNotification({
    pushToken,
    title: 'Erinnerung',
    body: `Bitte melde dich bald! Nur noch ${hoursRemaining} Stunden bis zur Frist.`,
    data: {
      type: 'reminder',
      hoursRemaining,
    },
  });
}
