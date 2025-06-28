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
  PlaidLinkTokenRequest,
  PlaidLinkTokenResponse,
  PlaidExchangeRequest,
  PlaidExchangeResponse,
  PlaidAccountsRequest,
  PlaidAccountsResponse,
  PlaidTransactionsRequest,
  PlaidTransactionsResponse,
  PlaidBalanceRequest,
  PlaidItemRemoveRequest,
  PlaidInstitutionsRequest,
  PlaidInstitutionsResponse,
  PlaidWebhookBody,
  PlaidAccount,
  PlaidTransaction,
  PlaidInstitution,
  PlaidError
} from '../types';

// Note: In a real implementation, you would import from 'plaid'
// For now, we'll create interfaces that match Plaid's API structure

interface PlaidClient {
  linkTokenCreate(request: PlaidLinkTokenRequest): Promise<{ data: PlaidLinkTokenResponse }>;
  itemPublicTokenExchange(request: PlaidExchangeRequest): Promise<{ data: PlaidExchangeResponse }>;
  accountsGet(request: PlaidAccountsRequest): Promise<{ data: PlaidAccountsResponse }>;
  transactionsGet(request: PlaidTransactionsRequest): Promise<{ data: PlaidTransactionsResponse }>;
  accountsBalanceGet(request: PlaidBalanceRequest): Promise<{ data: PlaidAccountsResponse }>;
  itemRemove(request: PlaidItemRemoveRequest): Promise<{ data: { removed: boolean } }>;
  institutionsGet(request: PlaidInstitutionsRequest): Promise<{ data: PlaidInstitutionsResponse }>;
  institutionsGetById(request: { institution_id: string; country_codes: string[] }): Promise<{ data: { institution: PlaidInstitution } }>;
}

export class PlaidProvider extends BaseBankingProvider {
  private client: PlaidClient;
  protected clientId: string;
  protected secretKey: string;
  protected environment: string;

  readonly region = 'US';
  readonly provider = 'plaid';
  readonly supportedCountries = ['US', 'CA'];
  readonly supportedCurrencies = ['USD', 'CAD'];

  constructor(clientId: string, secretKey: string, environment: string = 'sandbox') {
    super();
    this.clientId = clientId;
    this.secretKey = secretKey;
    this.environment = environment;

    // Initialize Plaid client
    // In real implementation: this.client = new PlaidApi(configuration);
    this.client = this.createMockClient();
  }

  private createMockClient(): PlaidClient {
    // Mock client for development - replace with real Plaid client
    return {
      linkTokenCreate: async () => ({
        data: {
          link_token: 'link-sandbox-' + Math.random().toString(36).substring(7),
          expiration: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString() // 4 hours
        }
      }),
      itemPublicTokenExchange: async () => ({
        data: {
          access_token: 'access-sandbox-' + Math.random().toString(36).substring(7),
          item_id: 'item-' + Math.random().toString(36).substring(7)
        }
      }),
      accountsGet: async () => ({
        data: {
          accounts: [
            {
              account_id: 'acc-' + Math.random().toString(36).substring(7),
              name: 'Plaid Checking',
              type: 'depository',
              subtype: 'checking',
              mask: '0000',
              balances: {
                current: 1000.50,
                available: 950.00,
                iso_currency_code: 'USD'
              }
            }
          ],
          item: {
            institution_id: 'ins_109508'
          }
        }
      }),
      transactionsGet: async (request: PlaidTransactionsRequest) => ({
        data: {
          transactions: [
            {
              transaction_id: 'txn-' + Math.random().toString(36).substring(7),
              account_id: request.account_ids?.[0] || 'acc-123',
              amount: -23.45,
              date: '2024-12-27',
              name: 'STARBUCKS STORE 12345',
              merchant_name: 'Starbucks',
              category: ['Food and Drink', 'Restaurants', 'Coffee Shop'],
              pending: false,
              iso_currency_code: 'USD',
              location: {
                address: '123 Main St',
                city: 'New York',
                region: 'NY',
                country: 'US'
              }
            }
          ],
          total_transactions: 1
        }
      }),
      accountsBalanceGet: async (request: PlaidBalanceRequest) => ({
        data: {
          accounts: [
            {
              account_id: request.account_ids?.[0] || 'acc-123',
              name: 'Plaid Checking',
              type: 'depository',
              subtype: 'checking',
              mask: '0000',
              balances: {
                current: 1000.50,
                available: 950.00,
                iso_currency_code: 'USD'
              }
            }
          ],
          item: {
            institution_id: 'ins_109508'
          }
        }
      }),
      itemRemove: async () => ({
        data: { removed: true }
      }),
      institutionsGet: async () => ({
        data: {
          institutions: [
            {
              institution_id: 'ins_109508',
              name: 'First Platypus Bank',
              country_codes: ['US'],
              primary_color: '#003d6b',
              logo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhE...',
              url: 'https://plaid.com'
            }
          ]
        }
      }),
      institutionsGetById: async (request: { institution_id: string; country_codes: string[] }) => ({
        data: {
          institution: {
            institution_id: request.institution_id,
            name: 'First Platypus Bank',
            country_codes: ['US'],
            primary_color: '#003d6b',
            logo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhE...',
            url: 'https://plaid.com'
          }
        }
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
        user: {
          client_user_id: userId,
        },
        client_name: 'FinTrack',
        products: ['transactions'],
        country_codes: ['US'],
        language: 'en',
        redirect_uri: redirectUri,
        webhook: webhook,
        ...options
      };

      const response = await this.client.linkTokenCreate(request);
      
      return {
        linkToken: response.data.link_token,
        expiration: response.data.expiration,
      };
    } catch (error) {
      this.log('error', 'Failed to create link token', error);
      throw this.mapError(error);
    }
  }

  async exchangePublicToken(publicToken: string): Promise<ExchangeTokenResponse> {
    try {
      const request = {
        public_token: publicToken,
      };

      const response = await this.client.itemPublicTokenExchange(request);
      
      return {
        accessToken: response.data.access_token,
        itemId: response.data.item_id,
      };
    } catch (error) {
      this.log('error', 'Failed to exchange public token', error);
      throw this.mapError(error);
    }
  }

  async getAccounts(accessToken: string): Promise<BankAccount[]> {
    this.validateAccessToken(accessToken);

    try {
      const request = {
        access_token: accessToken,
      };

      const response = await this.client.accountsGet(request);
      
      // Validate that response doesn't contain sensitive data
      validateNoSensitiveData(response.data, 'plaid.accounts');
      
      return response.data.accounts.map((account: PlaidAccount) => {
        // Sanitize each account before processing
        const sanitizedAccount = sanitizeAccountData({
          id: account.account_id,
          name: account.name,
          type: account.type,
          subtype: account.subtype,
          mask: account.mask,
          current_balance: account.balances.current ?? undefined,
          available_balance: account.balances.available ?? undefined,
          iso_currency_code: account.balances.iso_currency_code,
          institution_id: response.data.item.institution_id,
          institution_name: 'Bank', // Will be populated from institution data
        });

        return {
          id: sanitizedAccount.accountId,
          name: sanitizedAccount.accountName,
          type: this.mapAccountType(sanitizedAccount.accountType),
          subtype: account.subtype,
          mask: sanitizedAccount.mask, // Already sanitized to last 4 digits only
          currentBalance: sanitizedAccount.currentBalance,
          availableBalance: sanitizedAccount.availableBalance,
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

    try {
      const request = {
        access_token: accessToken,
        start_date: this.normalizeDate(startDate),
        end_date: this.normalizeDate(endDate),
        account_ids: accountId ? [accountId] : undefined,
        offset,
        count: Math.min(limit, 500), // Plaid max is 500
      };

      const response = await this.client.transactionsGet(request);
      
      // Validate that response doesn't contain sensitive data
      validateNoSensitiveData(response.data, 'plaid.transactions');
      
      return response.data.transactions.map((transaction: PlaidTransaction) => {
        // Sanitize each transaction before processing
        const sanitizedTransaction = sanitizeTransactionData({
          id: transaction.transaction_id,
          account_id: transaction.account_id,
          amount: transaction.amount,
          date: transaction.date,
          name: transaction.name,
          description: transaction.name,
          merchant_name: transaction.merchant_name,
          category: transaction.category?.[0],
          location: {
            city: transaction.location?.city,
            country: transaction.location?.country,
            // Deliberately exclude full address for privacy
          },
        });

        return {
          id: sanitizedTransaction.transactionId,
          accountId: sanitizedTransaction.accountId,
          amount: this.normalizeAmount(sanitizedTransaction.amount),
          date: sanitizedTransaction.date,
          name: sanitizedTransaction.description, // Already sanitized
          merchantName: sanitizedTransaction.merchantName, // Already sanitized
          category: sanitizedTransaction.category,
          description: sanitizedTransaction.description,
          pending: transaction.pending,
          currencyCode: transaction.iso_currency_code || 'USD',
          location: sanitizedTransaction.city || sanitizedTransaction.country ? {
            city: sanitizedTransaction.city,
            country: sanitizedTransaction.country,
            // Never include full address for privacy/security
          } : undefined,
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
      const request = {
        access_token: accessToken,
        account_ids: [accountId],
      };

      const response = await this.client.accountsBalanceGet(request);
      const account = response.data.accounts[0];
      
      return {
        current: account.balances.current || 0,
        available: account.balances.available || undefined,
        currencyCode: account.balances.iso_currency_code || 'USD',
      };
    } catch (error) {
      this.log('error', 'Failed to get balance', error);
      throw this.mapError(error);
    }
  }

  async disconnectAccount(accessToken: string): Promise<void> {
    this.validateAccessToken(accessToken);

    try {
      const request = {
        access_token: accessToken,
      };

      await this.client.itemRemove(request);
      this.log('info', 'Account disconnected successfully');
    } catch (error) {
      this.log('error', 'Failed to disconnect account', error);
      throw this.mapError(error);
    }
  }

  async getInstitutions(
    country: string = 'US',
    offset: number = 0,
    limit: number = 50
  ): Promise<Institution[]> {
    try {
      const request = {
        count: Math.min(limit, 500),
        offset,
        country_codes: [country],
      };

      const response = await this.client.institutionsGet(request);
      
      return response.data.institutions.map((institution: PlaidInstitution) => ({
        id: institution.institution_id,
        name: institution.name,
        country: institution.country_codes[0],
        logo: institution.logo,
        primaryColor: institution.primary_color,
        url: institution.url,
      }));
    } catch (error) {
      this.log('error', 'Failed to get institutions', error);
      throw this.mapError(error);
    }
  }

  async getInstitution(institutionId: string): Promise<Institution> {
    try {
      const request = {
        institution_id: institutionId,
        country_codes: ['US'],
      };

      const response = await this.client.institutionsGetById(request);
      const institution = response.data.institution;
      
      return {
        id: institution.institution_id,
        name: institution.name,
        country: institution.country_codes[0],
        logo: institution.logo,
        primaryColor: institution.primary_color,
        url: institution.url,
      };
    } catch (error) {
      this.log('error', 'Failed to get institution', error);
      throw this.mapError(error);
    }
  }

  validateWebhook(body: string, signature: string): boolean {
    // Implement Plaid webhook validation
    // This is a simplified version - use proper HMAC validation
    return signature.length > 0;
  }

  async handleWebhook(body: PlaidWebhookBody): Promise<void> {
    const { webhook_type, webhook_code, item_id } = body;
    
    this.log('info', `Received webhook: ${webhook_type}.${webhook_code}`, { item_id });
    
    switch (webhook_type) {
      case 'TRANSACTIONS':
        if (webhook_code === 'SYNC_UPDATES_AVAILABLE') {
          // Handle transaction updates
          this.log('info', 'Transaction sync updates available', { item_id });
        }
        break;
      case 'ITEM':
        if (webhook_code === 'ERROR') {
          // Handle item errors
          this.log('warn', 'Item error webhook received', { item_id });
        }
        break;
    }
  }

  mapError(error: unknown): BankingError {
    // Map Plaid errors to standard banking errors
    if (error && typeof error === 'object' && 'response' in error) {
      const errorWithResponse = error as { response?: { data?: PlaidError } };
      if (errorWithResponse.response?.data?.error_code) {
        const plaidError = errorWithResponse.response.data;
        
        return {
          code: plaidError.error_code,
          message: plaidError.error_message,
          displayMessage: plaidError.display_message,
          type: this.mapErrorType(plaidError.error_type),
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
    // Map Plaid categories to our standard categories
    const categoryMap: Record<string, string> = {
      'Food and Drink': 'dining',
      'Shops': 'shopping',
      'Transportation': 'transport',
      'Recreation': 'entertainment',
      'Healthcare': 'health',
      'Service': 'services',
      'Community': 'community',
      'Government and Non-Profit': 'government',
      'Travel': 'travel',
    };

    return categoryMap[category] || 'other';
  }

  private mapAccountType(subtype: string): 'checking' | 'savings' | 'credit' | 'investment' | 'loan' {
    const typeMap: Record<string, 'checking' | 'savings' | 'credit' | 'investment' | 'loan'> = {
      'checking': 'checking',
      'savings': 'savings',
      'credit card': 'credit',
      'money market': 'savings',
      'cd': 'savings',
      'ira': 'investment',
      '401k': 'investment',
      'brokerage': 'investment',
      'mortgage': 'loan',
      'student': 'loan',
      'auto': 'loan',
    };

    return typeMap[subtype.toLowerCase()] || 'checking';
  }

  private mapErrorType(errorType: string): BankingError['type'] {
    const errorTypeMap: Record<string, BankingError['type']> = {
      'ITEM_ERROR': 'ITEM_ERROR',
      'INSTITUTION_ERROR': 'INSTITUTION_ERROR',
      'API_ERROR': 'API_ERROR',
      'RATE_LIMIT_EXCEEDED': 'RATE_LIMIT_EXCEEDED',
    };

    return errorTypeMap[errorType] || 'API_ERROR';
  }

  protected isNonRetryableError(error: unknown): boolean {
    const nonRetryableCodes = [
      'INVALID_ACCESS_TOKEN',
      'INVALID_ACCOUNT_ID',
      'ITEM_LOGIN_REQUIRED',
      'INSUFFICIENT_CREDENTIALS',
    ];

    const errorWithResponse = error as { response?: { data?: { error_code?: string } } };
    const errorCode = errorWithResponse?.response?.data?.error_code;
    return errorCode ? nonRetryableCodes.includes(errorCode) : false;
  }
}