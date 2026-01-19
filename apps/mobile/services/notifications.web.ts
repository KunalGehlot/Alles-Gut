// Web stub for notifications service
// expo-notifications uses localStorage which breaks during static rendering (SSG) in Node environment
// Since we don't need push notifications on the web version for now, we provide no-op stubs.

export async function setupNotificationChannels(): Promise<void> {
    return;
}

export async function checkDndPermission(): Promise<boolean> {
    return true;
}

export async function requestDndPermission(): Promise<void> {
    return;
}

export async function registerForPushNotifications(): Promise<string | null> {
    console.log('Push notifications not supported on web');
    return null;
}

export async function areNotificationsEnabled(): Promise<boolean> {
    return false;
}

export async function getCurrentPushToken(): Promise<string | null> {
    return null;
}

export async function scheduleTestNotification(): Promise<void> {
    return;
}

export function addNotificationResponseListener(
    callback: (response: any) => void
): any {
    return { remove: () => { } };
}

export function addNotificationReceivedListener(
    callback: (notification: any) => void
): any {
    return { remove: () => { } };
}
