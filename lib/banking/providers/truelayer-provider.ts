import { 
  BaseBankingProvider, 
  BankAccount, 
  Transaction, 
  LinkTokenResponse, 
  ExchangeTokenResponse, 
  Institution,
  BankingError 
} from './base-provider';

import { 
  sanitizeAccountData, 
  sanitizeTransactionData,
  validateNoSensitiveData
} from '../security/data-sanitization';

import {
  TrueLayerAccount,
  TrueLayerTransaction,
  TrueLayerBalance
} from '../types';

// Note: In a real implementation, you would import from 'truelayer'
// For now, we'll create interfaces that match TrueLayer's API structure

interface TrueLayerClient {
  authLink(request: { client_id: string; redirect_uri: string; scope: string; response_type: string; state: string }): Promise<{ auth_uri: string; expires_in: number }>;
  exchangeCode(request: { client_id: string; client_secret: string; code: string; grant_type: string; redirect_uri: string }): Promise<{ access_token: string; token_type: string; expires_in: number; refresh_token: string }>;
  getAccounts(accessToken: string): Promise<{ results: TrueLayerAccount[] }>;
  getTransactions(accessToken: string, accountId: string, params: { from: string; to: string; limit: number; offset: number }): Promise<{ results: TrueLayerTransaction[] }>;
  getBalance(accessToken: string, accountId: string): Promise<{ results: TrueLayerBalance[] }>;
  revokeToken(accessToken: string): Promise<{ revoked: boolean }>;
}

export class TrueLayerProvider extends BaseBankingProvider {
  private client: TrueLayerClient;
  protected clientId: string;
  protected secretKey: string;
  protected environment: string;
  private redirectUri: string;

  readonly region = 'ES';
  readonly provider = 'truelayer';
  readonly supportedCountries = ['ES', 'IT', 'FR', 'DE', 'NL', 'BE', 'AT', 'PT', 'GB', 'IE'];
  readonly supportedCurrencies = ['EUR', 'GBP', 'CHF', 'SEK', 'NOK', 'DKK'];

  constructor(clientId: string, secretKey: string, environment: string = 'sandbox', redirectUri?: string) {
    super();
    this.clientId = clientId;
    this.secretKey = secretKey;
    this.environment = environment;
    this.redirectUri = redirectUri || 'https://localhost:3000/banking/callback';

    // Initialize TrueLayer client
    // In real implementation: this.client = new TrueLayerClient(configuration);
    this.client = this.createMockClient();
  }

  private createMockClient(): TrueLayerClient {
    // Mock client for development - replace with real TrueLayer client
    return {
      authLink: async () => ({
        auth_uri: `https://auth.truelayer.com?client_id=${this.clientId}&redirect_uri=${this.redirectUri}&scope=accounts,transactions&response_type=code`,
        expires_in: 3600
      }),
      exchangeCode: async () => ({
        access_token: 'access-token-' + Math.random().toString(36).substring(7),
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'refresh-token-' + Math.random().toString(36).substring(7)
      }),
      getAccounts: async () => ({
        results: [
          {
            account_id: 'acc-' + Math.random().toString(36).substring(7),
            account_type: 'TRANSACTION',
            display_name: 'Santander Cuenta Corriente',
            currency: 'EUR',
            account_number: {
              iban: 'ES9121000418450200051332',
              number: '0418450200051332'
            },
            provider: {
              provider_id: 'santander_es',
              display_name: 'Santander España'
            }
          }
        ]
      }),
      getTransactions: async () => ({
        results: [
          {
            transaction_id: 'txn-' + Math.random().toString(36).substring(7),
            timestamp: '2024-12-27T10:30:00Z',
            description: 'Compra en El Corte Inglés',
            amount: -45.67,
            currency: 'EUR',
            transaction_type: 'DEBIT',
            merchant_name: 'El Corte Inglés',
            transaction_category: 'SHOPPING',
            running_balance: {
              amount: 1234.56,
              currency: 'EUR'
            }
          }
        ]
      }),
      getBalance: async () => ({
        results: [
          {
            available: 1234.56,
            current: 1234.56,
            overdraft: 0,
            currency: 'EUR',
            last_update_time: '2024-12-27T15:30:00Z'
          }
        ]
      }),
      revokeToken: async () => ({
        revoked: true
      })
    };
  }

  async createLinkToken(
    userId: string, 
    redirectUri?: string,
    webhook?: string,
    options?: Record<string, unknown>
  ): Promise<LinkTokenResponse> {
    try {
      const request = {
        client_id: this.clientId,
        redirect_uri: redirectUri || this.redirectUri,
        scope: 'accounts transactions balance',
        response_type: 'code',
        state: userId,
        ...options
      };

      const response = await this.client.authLink(request);
      
      return {
        linkToken: response.auth_uri,
        expiration: new Date(Date.now() + response.expires_in * 1000).toISOString(),
      };
    } catch (error) {
      this.log('error', 'Failed to create auth link', error);
      throw this.mapError(error);
    }
  }

  async exchangePublicToken(authorizationCode: string): Promise<ExchangeTokenResponse> {
    try {
      const request = {
        client_id: this.clientId,
        client_secret: this.secretKey,
        code: authorizationCode,
        grant_type: 'authorization_code',
        redirect_uri: this.redirectUri,
      };

      const response = await this.client.exchangeCode(request);
      
      return {
        accessToken: response.access_token,
        itemId: 'truelayer-connection',
      };
    } catch (error) {
      this.log('error', 'Failed to exchange authorization code', error);
      throw this.mapError(error);
    }
  }

  async getAccounts(accessToken: string): Promise<BankAccount[]> {
    this.validateAccessToken(accessToken);

    try {
      const response = await this.client.getAccounts(accessToken);
      
      // Validate that response doesn't contain sensitive data
      validateNoSensitiveData(response, 'truelayer.accounts');
      
      return response.results.map((account: TrueLayerAccount) => {
        // Sanitize each account before processing
        const sanitizedAccount = sanitizeAccountData({
          id: account.account_id,
          name: account.display_name,
          type: this.mapAccountType(account.account_type),
          currency_code: account.currency,
          institution_name: account.provider?.display_name || 'European Bank',
          institution_id: account.provider?.provider_id || 'unknown',
          // Never store full IBAN - only last 4 digits
          mask: account.account_number?.number?.slice(-4) || '0000',
        });

        return {
          id: sanitizedAccount.accountId,
          name: sanitizedAccount.accountName,
          type: this.mapAccountType(sanitizedAccount.accountType),
          subtype: account.account_type.toLowerCase(),
          mask: sanitizedAccount.mask, // Already sanitized to last 4 digits only
          currentBalance: undefined, // Will be fetched separately
          availableBalance: undefined,
          currencyCode: sanitizedAccount.currencyCode,
          institutionName: sanitizedAccount.institutionName,
          institutionId: sanitizedAccount.institutionId,
        };
      });
    } catch (error) {
      this.log('error', 'Failed to get accounts', error);
      throw this.mapError(error);
    }
  }

  async getTransactions(
    accessToken: string,
    startDate: Date,
    endDate: Date,
    accountId?: string,
    offset: number = 0,
    limit: number = 100
  ): Promise<Transaction[]> {
    this.validateAccessToken(accessToken);
    this.validateDateRange(startDate, endDate);

    if (!accountId) {
      throw new Error('Account ID is required for TrueLayer transactions');
    }

    try {
      const params = {
        from: this.normalizeDate(startDate),
        to: this.normalizeDate(endDate),
        limit: Math.min(limit, 500), // TrueLayer max
        offset,
      };

      const response = await this.client.getTransactions(accessToken, accountId, params);
      
      // Validate that response doesn't contain sensitive data
      validateNoSensitiveData(response, 'truelayer.transactions');
      
      return response.results.map((transaction: TrueLayerTransaction) => {
        // Sanitize each transaction before processing
        const sanitizedTransaction = sanitizeTransactionData({
          id: transaction.transaction_id,
          account_id: accountId,
          amount: Math.abs(transaction.amount), // TrueLayer uses negative for debits
          date: transaction.timestamp.split('T')[0],
          name: transaction.description,
          description: transaction.description,
          merchant_name: transaction.merchant_name,
          category: transaction.transaction_category,
        });

        return {
          id: sanitizedTransaction.transactionId,
          accountId: sanitizedTransaction.accountId,
          amount: this.normalizeAmount(sanitizedTransaction.amount),
          date: sanitizedTransaction.date,
          name: sanitizedTransaction.description, // Already sanitized
          merchantName: sanitizedTransaction.merchantName, // Already sanitized
          category: this.mapCategory(sanitizedTransaction.category || ''),
          description: sanitizedTransaction.description,
          pending: false, // TrueLayer doesn't provide pending status the same way
          currencyCode: transaction.currency || 'EUR',
          location: undefined, // TrueLayer doesn't provide location data
        };
      });
    } catch (error) {
      this.log('error', 'Failed to get transactions', error);
      throw this.mapError(error);
    }
  }

  async getBalance(accessToken: string, accountId: string): Promise<{
    current: number;
    available?: number;
    currencyCode: string;
  }> {
    this.validateAccessToken(accessToken);

    try {
      const response = await this.client.getBalance(accessToken, accountId);
      const balance = response.results[0];
      
      return {
        current: balance.current,
        available: balance.available,
        currencyCode: balance.currency,
      };
    } catch (error) {
      this.log('error', 'Failed to get balance', error);
      throw this.mapError(error);
    }
  }

  async disconnectAccount(accessToken: string): Promise<void> {
    this.validateAccessToken(accessToken);

    try {
      await this.client.revokeToken(accessToken);
      this.log('info', 'Account disconnected successfully');
    } catch (error) {
      this.log('error', 'Failed to disconnect account', error);
      throw this.mapError(error);
    }
  }

  async getInstitutions(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _country = 'ES',
    offset: number = 0,
    limit: number = 50
  ): Promise<Institution[]> {
    // TrueLayer doesn't have a direct institutions endpoint
    // Return a list of common Spanish/EU banks
    const commonBanks = [
      { id: 'santander_es', name: 'Santander España', country: 'ES' },
      { id: 'bbva_es', name: 'BBVA España', country: 'ES' },
      { id: 'caixabank_es', name: 'CaixaBank', country: 'ES' },
      { id: 'bankinter_es', name: 'Bankinter', country: 'ES' },
      { id: 'sabadell_es', name: 'Banco Sabadell', country: 'ES' },
    ];

    return commonBanks.slice(offset, offset + limit).map(bank => ({
      id: bank.id,
      name: bank.name,
      country: bank.country,
      logo: undefined,
      primaryColor: undefined,
      url: undefined,
    }));
  }

  async getInstitution(institutionId: string): Promise<Institution> {
    const institutions = await this.getInstitutions();
    const institution = institutions.find(inst => inst.id === institutionId);
    
    if (!institution) {
      throw new Error(`Institution not found: ${institutionId}`);
    }
    
    return institution;
  }

  validateWebhook(body: string, signature: string): boolean {
    // Implement TrueLayer webhook validation
    // This is a simplified version - use proper signature validation
    return signature.length > 0;
  }

  async handleWebhook(body: { type: string; data: unknown }): Promise<void> {
    const { type, data } = body;
    
    this.log('info', `Received TrueLayer webhook: ${type}`, data);
    
    switch (type) {
      case 'account-update':
        this.log('info', 'Account update webhook received');
        break;
      case 'transaction-update':
        this.log('info', 'Transaction update webhook received');
        break;
    }
  }

  mapError(error: unknown): BankingError {
    // Map TrueLayer errors to standard banking errors
    if (error && typeof error === 'object' && 'response' in error) {
      const errorWithResponse = error as { response?: { data?: { error?: string; error_description?: string } } };
      if (errorWithResponse.response?.data?.error) {
        const trueLayerError = errorWithResponse.response.data;
        
        return {
          code: trueLayerError.error || 'UNKNOWN_ERROR',
          message: trueLayerError.error_description || trueLayerError.error || 'Unknown TrueLayer error',
          displayMessage: trueLayerError.error_description || trueLayerError.error,
          type: this.mapErrorType(trueLayerError.error || 'UNKNOWN'),
        };
      }
    }

    const errorWithMessage = error as { message?: string };
    return {
      code: 'UNKNOWN_ERROR',
      message: errorWithMessage.message || 'An unknown error occurred',
      type: 'API_ERROR',
    };
  }

  mapCategory(category: string): string {
    // Map TrueLayer categories to our standard categories
    const categoryMap: Record<string, string> = {
      'SHOPPING': 'shopping',
      'GROCERIES': 'groceries', 
      'EATING_OUT': 'dining',
      'TRANSPORT': 'transport',
      'ENTERTAINMENT': 'entertainment',
      'BILLS_AND_UTILITIES': 'utilities',
      'HEALTHCARE': 'health',
      'TRAVEL': 'travel',
      'CASH': 'cash',
      'GAMBLING': 'entertainment',
    };

    return categoryMap[category.toUpperCase()] || 'other';
  }

  private mapAccountType(type: string): 'checking' | 'savings' | 'credit' | 'investment' | 'loan' {
    const typeMap: Record<string, 'checking' | 'savings' | 'credit' | 'investment' | 'loan'> = {
      'TRANSACTION': 'checking',
      'SAVINGS': 'savings',
      'CREDIT_CARD': 'credit',
      'MORTGAGE': 'loan',
      'INVESTMENT': 'investment',
    };

    return typeMap[type.toUpperCase()] || 'checking';
  }

  private mapErrorType(errorType: string): BankingError['type'] {
    const errorTypeMap: Record<string, BankingError['type']> = {
      'invalid_token': 'ITEM_ERROR',
      'invalid_client': 'API_ERROR',
      'access_denied': 'INSTITUTION_ERROR',
      'rate_limit_exceeded': 'RATE_LIMIT_EXCEEDED',
    };

    return errorTypeMap[errorType] || 'API_ERROR';
  }

  protected isNonRetryableError(error: unknown): boolean {
    const nonRetryableCodes = [
      'invalid_token',
      'invalid_client',
      'access_denied',
      'unauthorized_client',
    ];

    const errorWithResponse = error as { response?: { data?: { error?: string } } };
    const errorCode = errorWithResponse?.response?.data?.error;
    return errorCode ? nonRetryableCodes.includes(errorCode) : false;
  }
}