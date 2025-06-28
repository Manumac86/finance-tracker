// Data sanitization utilities to prevent storing sensitive financial information

/**
 * Security Policy: NEVER store sensitive financial data
 * - No full account numbers
 * - No CVCs, PINs, or security codes  
 * - No full SSNs or government IDs
 * - No routing numbers beyond institution identification
 * - No card expiration dates
 * - No authentication tokens in plain text
 * - No personal identification beyond what's necessary for functionality
 */

// Type definitions for raw data from external providers
interface RawAccountData {
  id?: string;
  account_id?: string;
  name?: string;
  type?: string;
  subtype?: string;
  institution_name?: string;
  institution_id?: string;
  mask?: string;
  currency_code?: string;
  iso_currency_code?: string;
  current_balance?: number;
  available_balance?: number;
  balance?: {
    current?: number;
    available?: number;
  };
}

interface RawTransactionData {
  id?: string;
  transaction_id?: string;
  account_id?: string;
  amount?: number;
  date?: string;
  transaction_date?: string;
  name?: string;
  description?: string;
  category?: string;
  merchant_name?: string;
  merchant_category?: string;
  location?: {
    city?: string;
    country?: string;
    address?: string;
  };
}


export interface SanitizedAccountData {
  // Safe to store
  accountId: string;           // External provider account ID (not account number)
  accountName: string;         // User-friendly name
  accountType: string;         // checking, savings, etc.
  institutionName: string;     // Bank name
  institutionId: string;       // Institution identifier
  mask: string;               // Last 4 digits only
  currencyCode: string;       // Currency
  
  // Balance info (safe)
  currentBalance?: number;
  availableBalance?: number;
  
  // NEVER store these - handled by providers only
  // accountNumber: FORBIDDEN
  // routingNumber: FORBIDDEN 
  // cvc: FORBIDDEN
  // pin: FORBIDDEN
  // ssn: FORBIDDEN
  // fullCardNumber: FORBIDDEN
  // expirationDate: FORBIDDEN
}

export interface SanitizedTransactionData {
  // Safe to store
  transactionId: string;       // External provider transaction ID
  accountId: string;          // Reference to our account record
  amount: number;             // Transaction amount
  date: string;               // Transaction date
  description: string;        // Merchant/description
  category?: string;          // Category
  
  // Enhanced merchant info (safe)
  merchantName?: string;      // Cleaned merchant name
  merchantCategory?: string;  // Merchant category
  
  // Location (safe, general)
  city?: string;
  country?: string;
  
  // NEVER store these
  // accountNumber: FORBIDDEN
  // cardNumber: FORBIDDEN
  // authCode: FORBIDDEN
  // rawMerchantData: FORBIDDEN (may contain sensitive info)
  // fullLocationAddress: FORBIDDEN (privacy concern)
}

/**
 * Sanitize account data from external providers
 * Removes all sensitive information and validates safe data
 */
export function sanitizeAccountData(rawAccountData: RawAccountData): SanitizedAccountData {
  // Validate and extract only safe fields
  const sanitized: SanitizedAccountData = {
    accountId: String(rawAccountData.id || rawAccountData.account_id),
    accountName: sanitizeString(rawAccountData.name || 'Unknown Account'),
    accountType: sanitizeAccountType(rawAccountData.type || rawAccountData.subtype),
    institutionName: sanitizeString(rawAccountData.institution_name || 'Unknown Bank'),
    institutionId: String(rawAccountData.institution_id),
    mask: sanitizeMask(rawAccountData.mask),
    currencyCode: sanitizeCurrencyCode(rawAccountData.currency_code || rawAccountData.iso_currency_code),
    currentBalance: sanitizeAmount(rawAccountData.current_balance || rawAccountData.balance?.current),
    availableBalance: sanitizeAmount(rawAccountData.available_balance || rawAccountData.balance?.available),
  };

  // Validate all fields are safe
  validateSanitizedAccountData(sanitized);
  
  return sanitized;
}

/**
 * Sanitize transaction data from external providers
 * Removes all sensitive information and validates safe data
 */
export function sanitizeTransactionData(rawTransactionData: RawTransactionData): SanitizedTransactionData {
  const sanitized: SanitizedTransactionData = {
    transactionId: String(rawTransactionData.id || rawTransactionData.transaction_id),
    accountId: String(rawTransactionData.account_id),
    amount: sanitizeAmount(rawTransactionData.amount ?? 0) ?? 0,
    date: sanitizeDate(rawTransactionData.date || rawTransactionData.transaction_date),
    description: sanitizeTransactionDescription(rawTransactionData.name || rawTransactionData.description),
    category: sanitizeString(rawTransactionData.category),
    merchantName: sanitizeMerchantName(rawTransactionData.merchant_name),
    merchantCategory: sanitizeString(rawTransactionData.merchant_category),
    city: sanitizeString(rawTransactionData.location?.city),
    country: sanitizeString(rawTransactionData.location?.country),
  };

  // Validate all fields are safe
  validateSanitizedTransactionData(sanitized);
  
  return sanitized;
}

/**
 * Sanitize mask to ensure it's only last 4 digits
 */
function sanitizeMask(mask: unknown): string {
  if (!mask) return '';
  
  const maskStr = String(mask);
  
  // Extract only last 4 digits
  const digits = maskStr.replace(/\D/g, '');
  if (digits.length >= 4) {
    return digits.slice(-4);
  }
  
  // If less than 4 digits, pad with X
  return digits.padStart(4, 'X');
}

/**
 * Sanitize string fields with length limits and character validation
 */
function sanitizeString(value: unknown, maxLength: number = 255): string {
  if (!value) return '';
  
  return String(value)
    .trim()
    .substring(0, maxLength)
    .replace(/[<>\"'&]/g, ''); // Remove potentially dangerous characters
}

/**
 * Sanitize merchant name to remove sensitive patterns
 */
function sanitizeMerchantName(merchantName: unknown): string {
  if (!merchantName) return '';
  
  let sanitized = sanitizeString(merchantName, 100);
  
  // Remove common patterns that might contain sensitive info
  sanitized = sanitized
    .replace(/\b\d{4}\s*\d{4}\s*\d{4}\s*\d{4}\b/g, '[CARD]') // Remove any card-like numbers
    .replace(/\b\d{9,}\b/g, '[NUMBER]') // Remove long numbers that might be sensitive
    .replace(/\b(AUTH|CVC|CVV|PIN)\s*\d+/gi, '[AUTH]') // Remove auth codes
    .replace(/\*{4,}/g, '[MASKED]'); // Replace long masked strings
  
  return sanitized;
}

/**
 * Sanitize transaction description
 */
function sanitizeTransactionDescription(description: unknown): string {
  if (!description) return '';
  
  let sanitized = sanitizeString(description, 500);
  
  // Remove potentially sensitive patterns
  sanitized = sanitized
    .replace(/\b\d{4}\s*\d{4}\s*\d{4}\s*\d{4}\b/g, '[CARD]')
    .replace(/\b\d{9,}\b/g, '[NUMBER]')
    .replace(/\b(SSN|SIN)\s*\d+/gi, '[ID]')
    .replace(/\b(AUTH|CONF|REF)\s*\d+/gi, '[REF]');
  
  return sanitized;
}

/**
 * Sanitize account type
 */
function sanitizeAccountType(type: unknown): string {
  const validTypes = ['checking', 'savings', 'credit', 'investment', 'loan'];
  const typeStr = String(type).toLowerCase();
  
  // Map common variations
  const typeMap: Record<string, string> = {
    'depository': 'checking',
    'credit card': 'credit',
    'money market': 'savings',
    'cd': 'savings',
    'certificate of deposit': 'savings',
    'ira': 'investment',
    '401k': 'investment',
    'brokerage': 'investment',
    'mortgage': 'loan',
    'student': 'loan',
    'auto': 'loan',
    'personal': 'loan',
  };
  
  const mapped = typeMap[typeStr] || typeStr;
  return validTypes.includes(mapped) ? mapped : 'checking';
}

/**
 * Sanitize currency code
 */
function sanitizeCurrencyCode(currencyCode: unknown): string {
  if (!currencyCode) return 'USD';
  
  const code = String(currencyCode).toUpperCase().trim();
  
  // Validate currency code format (3 letters)
  if (!/^[A-Z]{3}$/.test(code)) {
    return 'USD';
  }
  
  return code;
}

/**
 * Sanitize monetary amounts
 */
function sanitizeAmount(amount: unknown): number | undefined {
  if (amount === null || amount === undefined || amount === '') {
    return undefined;
  }
  
  const numericAmount = Number(amount);
  
  if (isNaN(numericAmount) || !isFinite(numericAmount)) {
    return undefined;
  }
  
  // Round to 2 decimal places and ensure reasonable bounds
  const rounded = Math.round(numericAmount * 100) / 100;
  
  // Sanity check for reasonable bounds (prevent overflow attacks)
  if (Math.abs(rounded) > 999999999.99) {
    return undefined;
  }
  
  return rounded;
}

/**
 * Sanitize date strings
 */
function sanitizeDate(date: unknown): string {
  if (!date) return new Date().toISOString().split('T')[0];
  
  const dateObj = new Date(String(date));
  
  if (isNaN(dateObj.getTime())) {
    return new Date().toISOString().split('T')[0];
  }
  
  // Ensure date is reasonable (not too far in past or future)
  const now = new Date();
  const tenYearsAgo = new Date(now.getFullYear() - 10, now.getMonth(), now.getDate());
  const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  
  if (dateObj < tenYearsAgo || dateObj > oneYearFromNow) {
    return now.toISOString().split('T')[0];
  }
  
  return dateObj.toISOString().split('T')[0];
}

/**
 * Validate sanitized account data to ensure no sensitive information
 */
function validateSanitizedAccountData(data: SanitizedAccountData): void {
  // Check for patterns that might indicate unsanitized sensitive data
  const sensitivePatterns = [
    /\b\d{4}\s*\d{4}\s*\d{4}\s*\d{4}\b/, // Card number pattern
    /\b\d{9}\b/, // SSN pattern
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN with dashes
    /\bcvc\b/i,
    /\bpin\b/i,
    /\brouting\b/i,
  ];
  
  const allFields = Object.values(data).join(' ');
  
  for (const pattern of sensitivePatterns) {
    if (pattern.test(allFields)) {
      throw new Error('Sensitive data detected in sanitized account data');
    }
  }
  
  // Validate mask is only 4 digits
  if (data.mask && !/^\d{4}$/.test(data.mask)) {
    throw new Error('Invalid mask format - must be exactly 4 digits');
  }
}

/**
 * Validate sanitized transaction data to ensure no sensitive information
 */
function validateSanitizedTransactionData(data: SanitizedTransactionData): void {
  const sensitivePatterns = [
    /\b\d{4}\s*\d{4}\s*\d{4}\s*\d{4}\b/, // Card number pattern
    /\b\d{9}\b/, // SSN pattern
    /\bcvc\b/i,
    /\bpin\b/i,
  ];
  
  const textFields = [
    data.description,
    data.merchantName,
    data.merchantCategory,
  ].filter(Boolean).join(' ');
  
  for (const pattern of sensitivePatterns) {
    if (pattern.test(textFields)) {
      throw new Error('Sensitive data detected in sanitized transaction data');
    }
  }
}

/**
 * Sanitize access tokens for storage (encrypt them)
 */
export function sanitizeAccessToken(token: string): string {
  // In production, this should use proper encryption
  // For now, we'll use a simple obfuscation (REPLACE WITH REAL ENCRYPTION)
  if (!token) return '';
  
  // TODO: Implement proper encryption using a key management service
  // This is just a placeholder to show the pattern
  return Buffer.from(token).toString('base64');
}

/**
 * Desanitize access tokens for use (decrypt them)
 */
export function desanitizeAccessToken(encryptedToken: string): string {
  // In production, this should use proper decryption
  // For now, we'll use simple deobfuscation (REPLACE WITH REAL DECRYPTION)
  if (!encryptedToken) return '';
  
  try {
    // TODO: Implement proper decryption
    return Buffer.from(encryptedToken, 'base64').toString();
  } catch {
    throw new Error('Failed to decrypt access token');
  }
}

/**
 * Validate that an object doesn't contain forbidden sensitive fields
 */
export function validateNoSensitiveData(obj: unknown, path: string = 'root'): void {
  const forbiddenKeys = [
    'account_number',
    'accountNumber', 
    'routing_number',
    'routingNumber',
    'cvc',
    'cvv',
    'pin',
    'ssn',
    'social_security_number',
    'card_number',
    'cardNumber',
    'expiration_date',
    'expirationDate',
    'security_code',
    'auth_code',
    'authCode',
  ];
  
  if (typeof obj === 'object' && obj !== null) {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = `${path}.${key}`;
      
      // Check if key name suggests sensitive data
      if (forbiddenKeys.some(forbidden => 
        key.toLowerCase().includes(forbidden.toLowerCase())
      )) {
        throw new Error(`Forbidden sensitive field detected: ${currentPath}`);
      }
      
      // Recursively validate nested objects
      if (typeof value === 'object' && value !== null) {
        validateNoSensitiveData(value, currentPath);
      }
      
      // Check for patterns in string values
      if (typeof value === 'string') {
        validateNoSensitiveDataInString(value, currentPath);
      }
    }
  }
}

function validateNoSensitiveDataInString(value: string, path: string): void {
  const sensitivePatterns = [
    { pattern: /\b\d{4}\s*\d{4}\s*\d{4}\s*\d{4}\b/, name: 'credit card number' },
    { pattern: /\b\d{3}-\d{2}-\d{4}\b/, name: 'SSN' },
    { pattern: /\b\d{9}\b/, name: 'SSN or account number' },
    { pattern: /\b\d{3}\s*\d{3}\s*\d{4}\b/, name: 'phone number' },
  ];
  
  for (const { pattern, name } of sensitivePatterns) {
    if (pattern.test(value)) {
      console.warn(`Potential ${name} detected in ${path}: ${value.substring(0, 20)}...`);
    }
  }
}