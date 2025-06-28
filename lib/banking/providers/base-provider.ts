// Base banking provider interface for multi-regional support

export interface BankAccount {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'investment' | 'loan';
  subtype?: string;
  mask?: string;
  currentBalance?: number;
  availableBalance?: number;
  currencyCode: string;
  institutionName: string;
  institutionId: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  amount: number;
  date: string;
  name: string;
  merchantName?: string;
  category?: string;
  description?: string;
  pending: boolean;
  currencyCode: string;
  location?: {
    address?: string;
    city?: string;
    country?: string;
  };
}

export interface LinkTokenResponse {
  linkToken: string;
  expiration?: string;
}

export interface ExchangeTokenResponse {
  accessToken: string;
  itemId?: string;
}

export interface Institution {
  id: string;
  name: string;
  country: string;
  logo?: string;
  primaryColor?: string;
  url?: string;
}

export interface BankingError {
  code: string;
  message: string;
  displayMessage?: string;
  type: 'ITEM_ERROR' | 'INSTITUTION_ERROR' | 'API_ERROR' | 'RATE_LIMIT_EXCEEDED' | 'TEMPORARY_ERROR';
}

// Base abstract class for all banking providers
export abstract class BaseBankingProvider {
  protected abstract clientId: string;
  protected abstract secretKey: string;
  protected abstract environment: string;
  
  abstract readonly region: string;
  abstract readonly provider: string;
  abstract readonly supportedCountries: string[];
  abstract readonly supportedCurrencies: string[];

  // Core banking operations
  abstract createLinkToken(
    userId: string, 
    redirectUri?: string,
    webhook?: string,
    options?: Record<string, unknown>
  ): Promise<LinkTokenResponse>;

  abstract exchangePublicToken(
    publicToken: string
  ): Promise<ExchangeTokenResponse>;

  abstract getAccounts(
    accessToken: string
  ): Promise<BankAccount[]>;

  abstract getTransactions(
    accessToken: string,
    startDate: Date,
    endDate: Date,
    accountId?: string,
    offset?: number,
    limit?: number
  ): Promise<Transaction[]>;

  abstract getBalance(
    accessToken: string,
    accountId: string
  ): Promise<{
    current: number;
    available?: number;
    currencyCode: string;
  }>;

  abstract disconnectAccount(
    accessToken: string
  ): Promise<void>;

  // Institution operations
  abstract getInstitutions(
    country?: string,
    offset?: number,
    limit?: number
  ): Promise<Institution[]>;

  abstract getInstitution(
    institutionId: string
  ): Promise<Institution>;

  // Utility methods
  abstract validateWebhook(
    body: string,
    signature: string
  ): boolean;

  abstract handleWebhook(
    body: unknown
  ): Promise<void>;

  // Error handling
  abstract mapError(error: unknown): BankingError;

  // Category mapping for regional differences
  abstract mapCategory(category: string): string;

  // Currency conversion utilities
  formatCurrency(amount: number, currencyCode: string): string {
    const localeMap: Record<string, string> = {
      'US': 'en-US',
      'ES': 'es-ES',
      'EU': 'en-EU',
      'AR': 'es-AR',
      'LATAM': 'es-AR'
    };

    const locale = localeMap[this.region] || 'en-US';

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  // Common validation methods
  protected validateAccessToken(accessToken: string): void {
    if (!accessToken || accessToken.trim().length === 0) {
      throw new Error('Access token is required');
    }
  }

  protected validateDateRange(startDate: Date, endDate: Date): void {
    if (startDate > endDate) {
      throw new Error('Start date must be before end date');
    }

    const maxDaysBack = 730; // 2 years
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() - maxDaysBack);

    if (startDate < maxDate) {
      throw new Error(`Start date cannot be more than ${maxDaysBack} days ago`);
    }
  }

  protected normalizeAmount(amount: number): number {
    // Ensure amount is positive and rounded to 2 decimal places
    return Math.abs(Math.round(amount * 100) / 100);
  }

  protected normalizeDate(date: string | Date): string {
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    
    // Ensure date is in YYYY-MM-DD format
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) {
      throw new Error(`Invalid date format: ${date}`);
    }
    
    return parsed.toISOString().split('T')[0];
  }

  // Helper method to determine transaction type
  protected determineTransactionType(amount: number): 'income' | 'expense' {
    return amount > 0 ? 'income' : 'expense';
  }

  // Helper method to extract clean merchant name
  protected cleanMerchantName(name: string): string {
    // Remove common payment processor prefixes and clean up
    return name
      .replace(/^(SQ\*|SP\*|TST\*|PAYPAL\s*\*|CHECKCARD\s*)/i, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 255); // Limit length
  }

  // Common retry logic for API calls
  protected async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on certain errors
        if (this.isNonRetryableError(error)) {
          throw error;
        }

        if (attempt < maxRetries) {
          await this.delay(delay * attempt);
        }
      }
    }

    throw lastError!;
  }

  protected isNonRetryableError(_error?: unknown): boolean {
    // Override in specific providers to define non-retryable errors
    return false;
  }

  protected async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Logging helper for debugging
  protected log(level: 'info' | 'warn' | 'error', message: string, data?: unknown): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${this.provider.toUpperCase()}] ${message}`;
    
    switch (level) {
      case 'info':
        console.log(logMessage, data || '');
        break;
      case 'warn':
        console.warn(logMessage, data || '');
        break;
      case 'error':
        console.error(logMessage, data || '');
        break;
    }
  }
}

// Provider configuration interface
export interface ProviderConfig {
  clientId: string;
  secretKey: string;
  environment: 'sandbox' | 'development' | 'production';
  webhookUrl?: string;
  redirectUri?: string;
  additionalConfig?: Record<string, unknown>;
}

// Provider factory interface
export interface ProviderFactory {
  createProvider(region: string, config: ProviderConfig): BaseBankingProvider;
  getSupportedRegions(): string[];
  getProviderForRegion(region: string): string;
}