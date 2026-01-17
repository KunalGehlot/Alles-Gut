import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 16;

function getMasterKey(): Buffer {
  const key = process.env.MASTER_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('MASTER_ENCRYPTION_KEY environment variable is not set');
  }
  // Ensure key is 32 bytes for AES-256
  return crypto.scryptSync(key, 'alles-gut-salt', 32);
}

function deriveUserKey(userId: string): Buffer {
  const masterKey = getMasterKey();
  return crypto.scryptSync(masterKey, userId, 32);
}

export function encrypt(plaintext: string, userId: string): Buffer {
  const userKey = deriveUserKey(userId);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, userKey, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  // Format: IV (16 bytes) + AuthTag (16 bytes) + EncryptedData
  return Buffer.concat([iv, authTag, encrypted]);
}

export function decrypt(encryptedData: Buffer, userId: string): string {
  const userKey = deriveUserKey(userId);

  const iv = encryptedData.subarray(0, IV_LENGTH);
  const authTag = encryptedData.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = encryptedData.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, userKey, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

export function hashContactInfo(contactInfo: string): string {
  return crypto
    .createHash('sha256')
    .update(contactInfo.toLowerCase().trim())
    .digest('hex');
}

export function generateVerificationCode(): string {
  // Generate a 6-digit numeric code
  return crypto.randomInt(100000, 999999).toString();
}

export function generateInviteCode(): string {
  // Generate a short, URL-safe code
  return crypto.randomBytes(6).toString('base64url');
}

export function generateTokenHash(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}
