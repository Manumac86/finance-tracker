import crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Get or generate encryption key from environment
 * In production, this should come from a secure key management service
 */
function getEncryptionKey(): Buffer {
  const envKey = process.env.ENCRYPTION_KEY;
  
  if (!envKey) {
    // For development only - generate a key
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ No ENCRYPTION_KEY found, using development key. Set ENCRYPTION_KEY in production!');
      return crypto.scryptSync('dev-key-finance-tracker', 'salt', KEY_LENGTH);
    } else {
      throw new Error('ENCRYPTION_KEY environment variable is required in production');
    }
  }
  
  // Derive key from environment variable
  return crypto.scryptSync(envKey, 'finance-tracker-salt', KEY_LENGTH);
}

/**
 * Encrypt sensitive data
 */
export function encrypt(text: string): string {
  if (!text) return '';
  
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    cipher.setAAD(Buffer.from('finance-tracker', 'utf8'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // Combine iv + tag + encrypted data
    const combined = iv.toString('hex') + tag.toString('hex') + encrypted;
    return combined;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt sensitive data
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) return '';
  
  try {
    const key = getEncryptionKey();
    
    // Extract components
    const iv = Buffer.from(encryptedData.slice(0, IV_LENGTH * 2), 'hex');
    const tag = Buffer.from(encryptedData.slice(IV_LENGTH * 2, (IV_LENGTH + TAG_LENGTH) * 2), 'hex');
    const encrypted = encryptedData.slice((IV_LENGTH + TAG_LENGTH) * 2);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAAD(Buffer.from('finance-tracker', 'utf8'));
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Hash sensitive data (one-way)
 */
export function hashSensitiveData(data: string): string {
  if (!data) return '';
  
  const salt = crypto.randomBytes(SALT_LENGTH);
  const hash = crypto.scryptSync(data, salt, KEY_LENGTH);
  
  return salt.toString('hex') + hash.toString('hex');
}

/**
 * Verify hashed data
 */
export function verifyHashedData(data: string, hashedData: string): boolean {
  if (!data || !hashedData) return false;
  
  try {
    const salt = Buffer.from(hashedData.slice(0, SALT_LENGTH * 2), 'hex');
    const originalHash = hashedData.slice(SALT_LENGTH * 2);
    const hash = crypto.scryptSync(data, salt, KEY_LENGTH);
    
    return hash.toString('hex') === originalHash;
  } catch (error) {
    console.error('Hash verification failed:', error);
    return false;
  }
}

/**
 * Sanitize access tokens for storage (encrypt them)
 */
export function sanitizeAccessToken(token: string): string {
  if (!token) return '';
  return encrypt(token);
}

/**
 * Desanitize access tokens for use (decrypt them)
 */
export function desanitizeAccessToken(encryptedToken: string): string {
  if (!encryptedToken) return '';
  return decrypt(encryptedToken);
}

/**
 * Generate secure random string for session tokens, API keys, etc.
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Mask sensitive data for logging (show only first and last few characters)
 */
export function maskSensitiveData(data: string, visibleChars: number = 4): string {
  if (!data || data.length <= visibleChars * 2) {
    return '*'.repeat(data?.length || 8);
  }
  
  const start = data.slice(0, visibleChars);
  const end = data.slice(-visibleChars);
  const middle = '*'.repeat(Math.max(data.length - visibleChars * 2, 4));
  
  return `${start}${middle}${end}`;
}