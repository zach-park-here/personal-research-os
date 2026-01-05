import * as crypto from 'crypto';

/**
 * Encryption Utility
 *
 * Provides AES-256-GCM encryption for sensitive data like OAuth tokens
 * Uses environment variable OAUTH_ENCRYPTION_KEY
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For AES, this is always 16
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const TAG_POSITION = SALT_LENGTH + IV_LENGTH;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH;

/**
 * Get encryption key from environment
 * Key should be 32 bytes (64 hex characters)
 */
function getEncryptionKey(): Buffer {
  const key = process.env.OAUTH_ENCRYPTION_KEY;

  if (!key) {
    throw new Error(
      'OAUTH_ENCRYPTION_KEY environment variable is required for token encryption'
    );
  }

  if (key.length !== 64) {
    throw new Error(
      'OAUTH_ENCRYPTION_KEY must be 64 hex characters (32 bytes). Generate with: openssl rand -hex 32'
    );
  }

  return Buffer.from(key, 'hex');
}

/**
 * Derive a key from the master key and salt using PBKDF2
 */
function getKey(salt: Buffer): Buffer {
  const masterKey = getEncryptionKey();
  return crypto.pbkdf2Sync(masterKey, salt, 100000, 32, 'sha512');
}

/**
 * Encrypt a string value
 *
 * @param text - Plain text to encrypt
 * @returns Encrypted string in format: salt:iv:tag:encrypted (hex encoded)
 */
export function encrypt(text: string): string {
  if (!text) {
    throw new Error('Cannot encrypt empty text');
  }

  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getKey(salt);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  // Format: salt:iv:tag:encrypted (all hex encoded)
  return Buffer.concat([salt, iv, tag, encrypted]).toString('hex');
}

/**
 * Decrypt an encrypted string
 *
 * @param encryptedHex - Encrypted string in hex format (from encrypt function)
 * @returns Decrypted plain text
 */
export function decrypt(encryptedHex: string): string {
  if (!encryptedHex) {
    throw new Error('Cannot decrypt empty string');
  }

  const encryptedBuffer = Buffer.from(encryptedHex, 'hex');

  const salt = encryptedBuffer.subarray(0, SALT_LENGTH);
  const iv = encryptedBuffer.subarray(SALT_LENGTH, TAG_POSITION);
  const tag = encryptedBuffer.subarray(TAG_POSITION, ENCRYPTED_POSITION);
  const encrypted = encryptedBuffer.subarray(ENCRYPTED_POSITION);

  const key = getKey(salt);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

/**
 * Hash a value (one-way, for verification only)
 * Useful for logging/debugging without exposing sensitive data
 *
 * @param text - Text to hash
 * @returns SHA-256 hash (hex encoded)
 */
export function hash(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Generate a random encryption key
 * Use this to generate OAUTH_ENCRYPTION_KEY value
 *
 * @returns 32-byte key as hex string
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate encryption key format
 *
 * @param key - Key to validate
 * @returns true if valid, false otherwise
 */
export function validateEncryptionKey(key: string): boolean {
  if (!key) return false;
  if (key.length !== 64) return false;
  if (!/^[0-9a-f]{64}$/i.test(key)) return false;
  return true;
}
