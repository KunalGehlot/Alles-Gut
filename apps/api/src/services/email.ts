import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@allesgut.app';
const APP_NAME = 'Alles Gut';

interface SendVerificationCodeParams {
  to: string;
  code: string;
}

export async function sendVerificationCode({
  to,
  code,
}: SendVerificationCodeParams): Promise<void> {
  console.log(`Attempting to send verification code to ${to}`);
  console.log(`Using FROM_EMAIL: ${FROM_EMAIL}`);
  console.log(`RESEND_API_KEY present: ${!!process.env.RESEND_API_KEY}`);

  try {
    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to,
      subject: `Dein Bestätigungscode: ${code}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #212121; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="width: 60px; height: 60px; background-color: #2D7D46; border-radius: 30px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 15px;">
              <span style="color: white; font-size: 24px; font-weight: bold;">AG</span>
            </div>
            <h1 style="margin: 0; font-size: 24px; color: #212121;">Alles Gut</h1>
          </div>

          <div style="background-color: #f5f5f5; border-radius: 12px; padding: 30px; text-align: center;">
            <p style="margin: 0 0 20px 0; font-size: 16px;">Dein Bestätigungscode lautet:</p>
            <div style="background-color: white; border-radius: 8px; padding: 20px; display: inline-block;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2D7D46;">${code}</span>
            </div>
            <p style="margin: 20px 0 0 0; font-size: 14px; color: #757575;">
              Der Code ist 10 Minuten gültig.
            </p>
          </div>

          <p style="margin-top: 30px; font-size: 14px; color: #757575; text-align: center;">
            Falls du diese E-Mail nicht angefordert hast, kannst du sie ignorieren.
          </p>

          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #9e9e9e;">
              © ${new Date().getFullYear()} Alles Gut · Dein digitales Lebenszeichen
            </p>
          </div>
        </body>
        </html>
      `,
      text: `Dein Alles Gut Bestätigungscode: ${code}\n\nDer Code ist 10 Minuten gültig.\n\nFalls du diese E-Mail nicht angefordert hast, kannst du sie ignorieren.`,
    });

    if (error) {
      console.error('Resend API error:', error);
      throw new Error(`Resend error: ${error.message}`);
    }

    console.log(`Verification code sent to ${to}, email ID: ${data?.id}`);
  } catch (error) {
    console.error('Failed to send verification email:', error);
    throw new Error('Failed to send verification email');
  }
}

interface SendAlertParams {
  to: string;
  userName: string;
  hoursSinceCheckIn: number;
}

export async function sendAlertEmail({
  to,
  userName,
  hoursSinceCheckIn,
}: SendAlertParams): Promise<void> {
  try {
    await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to,
      subject: `Wichtig: ${userName} hat sich nicht gemeldet`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #212121; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="width: 60px; height: 60px; background-color: #E53935; border-radius: 30px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 15px;">
              <span style="color: white; font-size: 24px;">!</span>
            </div>
            <h1 style="margin: 0; font-size: 24px; color: #E53935;">Wichtige Mitteilung</h1>
          </div>

          <div style="background-color: #ffebee; border-radius: 12px; padding: 30px; text-align: center; border: 2px solid #E53935;">
            <p style="margin: 0; font-size: 18px; color: #212121;">
              <strong>${userName}</strong> hat sich seit <strong>${hoursSinceCheckIn} Stunden</strong> nicht gemeldet.
            </p>
            <p style="margin: 20px 0 0 0; font-size: 16px; color: #212121;">
              Bitte prüfe, ob alles in Ordnung ist.
            </p>
          </div>

          <p style="margin-top: 30px; font-size: 14px; color: #757575; text-align: center;">
            Diese Nachricht wurde automatisch über die Alles Gut App gesendet.
          </p>

          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #9e9e9e;">
              © ${new Date().getFullYear()} Alles Gut · Dein digitales Lebenszeichen
            </p>
          </div>
        </body>
        </html>
      `,
      text: `Wichtige Mitteilung von Alles Gut\n\n${userName} hat sich seit ${hoursSinceCheckIn} Stunden nicht gemeldet.\n\nBitte prüfe, ob alles in Ordnung ist.\n\nDiese Nachricht wurde automatisch über die Alles Gut App gesendet.`,
    });

    console.log(`Alert email sent to ${to} for user ${userName}`);
  } catch (error) {
    console.error('Failed to send alert email:', error);
    throw new Error('Failed to send alert email');
  }
}
