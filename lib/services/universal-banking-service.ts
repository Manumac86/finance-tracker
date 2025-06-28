import { bankingProviderFactory, getEnvironmentConfig, detectUserRegion } from '../banking/provider-factory';
import { 
  CreateBankAccount, 
  UpdateBankAccount, 
  UIBankAccount, 
  BankAccount,
  transformBankAccountToUI
} from '../db/schemas/bank-account';
import { 
  sanitizeAccessToken, 
  desanitizeAccessToken,
  validateNoSensitiveData 
} from '../banking/security/data-sanitization';
import { query } from '../db/postgres';

export interface BankConnectionRequest {
  userId: string;
  region: string;
  redirectUri?: string;
  webhookUrl?: string;
}

export interface BankConnectionResponse {
  linkToken: string;
  provider: string;
  region: string;
  expiration?: string;
}

export interface AccountSyncResult {
  accountsUpdated: number;
  transactionsAdded: number;
  duplicatesDetected: number;
  errors: string[];
}

export interface DuplicateTransaction {
  originalId: string;
  duplicateId: string;
  similarityScore: number;
  reason: string;
}

export class UniversalBankingService {
  private static instance: UniversalBankingService;
  private providerConfigs: ReturnType<typeof getEnvironmentConfig>;

  private constructor() {
    this.providerConfigs = getEnvironmentConfig();
  }

  static getInstance(): UniversalBankingService {
    if (!UniversalBankingService.instance) {
      UniversalBankingService.instance = new UniversalBankingService();
    }
    return UniversalBankingService.instance;
  }

  /**
   * Initiate bank account connection for a user
   */
  async initiateConnection(request: BankConnectionRequest): Promise<BankConnectionResponse> {
    try {
      const config = this.providerConfigs[request.region.toUpperCase()];
      if (!config) {
        throw new Error(`No configuration found for region: ${request.region}`);
      }

      // Add request-specific options
      if (request.redirectUri) config.redirectUri = request.redirectUri;
      if (request.webhookUrl) config.webhookUrl = request.webhookUrl;

      const provider = await bankingProviderFactory.createProvider(request.region, config);
      const linkResponse = await provider.createLinkToken(
        request.userId,
        request.redirectUri,
        request.webhookUrl
      );

      return {
        linkToken: linkResponse.linkToken,
        provider: provider.provider,
        region: provider.region,
        expiration: linkResponse.expiration,
      };
    } catch (error) {
      console.error('Failed to initiate bank connection:', error);
      throw new Error(`Failed to initiate bank connection: ${error}`);
    }
  }

  /**
   * Complete bank account connection after user authorization
   */
  async completeConnection(
    userId: string,
    publicToken: string,
    region: string,
    /* metadata */
  ): Promise<UIBankAccount[]> {
    try {
      const config = this.providerConfigs[region.toUpperCase()];
      const provider = await bankingProviderFactory.createProvider(region, config);

      // Exchange public token for access token
      const exchangeResponse = await provider.exchangePublicToken(publicToken);
      const accessToken = sanitizeAccessToken(exchangeResponse.accessToken);

      // Get account information
      const accounts = await provider.getAccounts(desanitizeAccessToken(accessToken));
      
      // Save accounts to database
      const savedAccounts: UIBankAccount[] = [];
      
      for (const account of accounts) {
        // Validate no sensitive data
        validateNoSensitiveData(account, 'bank.account');

        const bankAccountData: CreateBankAccount = {
          user_id: userId,
          provider: provider.provider as 'plaid' | 'truelayer',
          region: provider.region as 'US' | 'ES' | 'EU',
          is_active: true,
          sync_status: 'synced' as const,
          
          // Set provider-specific token field
          ...(provider.provider === 'plaid' && {
            plaid_account_id: account.id,
            plaid_access_token: accessToken,
          }),
          ...(provider.provider === 'truelayer' && {
            truelayer_account_id: account.id,
            truelayer_access_token: accessToken,
          }),

          account_name: account.name,
          account_type: account.type,
          account_subtype: account.subtype,
          institution_name: account.institutionName,
          institution_id: account.institutionId,
          mask: account.mask,
          currency_code: account.currencyCode,
          current_balance: account.currentBalance,
          available_balance: account.availableBalance,
          last_synced_at: new Date().toISOString(),
        };

        const savedAccount = await this.saveBankAccount(bankAccountData);
        savedAccounts.push(savedAccount);
      }

      return savedAccounts;
    } catch (error) {
      console.error('Failed to complete bank connection:', error);
      throw new Error(`Failed to complete bank connection: ${error}`);
    }
  }

  /**
   * Sync transactions for a specific bank account
   */
  async syncTransactions(
    accountId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AccountSyncResult> {
    try {
      const account = await this.getBankAccount(accountId);
      if (!account) {
        throw new Error(`Bank account not found: ${accountId}`);
      }

      const config = this.providerConfigs[account.region.toUpperCase()];
      const provider = await bankingProviderFactory.createProvider(account.region, config);

      // Get the encrypted access token
      const accessToken = this.getAccessTokenForAccount(account);
      if (!accessToken) {
        throw new Error('No access token found for account');
      }

      // Set default date range (last 30 days if not specified)
      const syncEndDate = endDate || new Date();
      const syncStartDate = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Get transactions from provider
      const transactions = await provider.getTransactions(
        desanitizeAccessToken(accessToken),
        syncStartDate,
        syncEndDate,
        this.getProviderAccountId(account)
      );

      let transactionsAdded = 0;
      let duplicatesDetected = 0;
      const errors: string[] = [];

      for (const transaction of transactions) {
        try {
          // Validate no sensitive data
          validateNoSensitiveData(transaction, 'bank.transaction');

          // Check for duplicates
          const isDuplicate = await this.checkForDuplicate(transaction.id);
          if (isDuplicate) {
            duplicatesDetected++;
            continue;
          }

          // Save transaction to database
          await this.saveBankTransaction(transaction, account);
          transactionsAdded++;
        } catch (error) {
          console.error('Failed to save transaction:', error);
          errors.push(`Transaction ${transaction.id}: ${error}`);
        }
      }

      // Update account sync status
      await this.updateBankAccount(accountId, {
        sync_status: 'synced',
        last_synced_at: new Date().toISOString(),
        last_error: errors.length > 0 ? errors.join('; ') : undefined,
      });

      return {
        accountsUpdated: 1,
        transactionsAdded,
        duplicatesDetected,
        errors,
      };
    } catch (error) {
      console.error('Failed to sync transactions:', error);
      
      // Update account with error status
      await this.updateBankAccount(accountId, {
        sync_status: 'failed',
        last_error: String(error),
      });

      throw error;
    }
  }

  /**
   * Sync all bank accounts for a user
   */
  async syncAllAccounts(userId: string): Promise<AccountSyncResult> {
    const accounts = await this.getBankAccountsByUser(userId);
    
    let totalAccountsUpdated = 0;
    let totalTransactionsAdded = 0;
    let totalDuplicatesDetected = 0;
    const allErrors: string[] = [];

    for (const account of accounts) {
      if (!account.isActive) continue;

      try {
        const result = await this.syncTransactions(account.id!);
        totalAccountsUpdated += result.accountsUpdated;
        totalTransactionsAdded += result.transactionsAdded;
        totalDuplicatesDetected += result.duplicatesDetected;
        allErrors.push(...result.errors);
      } catch (error) {
        allErrors.push(`Account ${account.accountName}: ${error}`);
      }
    }

    return {
      accountsUpdated: totalAccountsUpdated,
      transactionsAdded: totalTransactionsAdded,
      duplicatesDetected: totalDuplicatesDetected,
      errors: allErrors,
    };
  }

  /**
   * Disconnect a bank account
   */
  async disconnectAccount(accountId: string): Promise<void> {
    try {
      const account = await this.getBankAccount(accountId);
      if (!account) {
        throw new Error(`Bank account not found: ${accountId}`);
      }

      const config = this.providerConfigs[account.region.toUpperCase()];
      const provider = await bankingProviderFactory.createProvider(account.region, config);

      const accessToken = this.getAccessTokenForAccount(account);
      if (accessToken) {
        // Disconnect from provider
        await provider.disconnectAccount(desanitizeAccessToken(accessToken));
      }

      // Mark account as disconnected in database
      await this.updateBankAccount(accountId, {
        is_active: false,
        sync_status: 'disconnected',
        last_error: undefined,
      });

      // Optionally: Remove sensitive data
      await this.removeSensitiveAccountData(accountId);
    } catch (error) {
      console.error('Failed to disconnect account:', error);
      throw error;
    }
  }

  /**
   * Get bank accounts for a user
   */
  async getBankAccountsByUser(userId: string): Promise<UIBankAccount[]> {
    const result = await query<BankAccount>(
      'SELECT * FROM bank_accounts WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    return result.map(transformBankAccountToUI);
  }

  /**
   * Get a specific bank account
   */
  async getBankAccount(accountId: string): Promise<UIBankAccount | null> {
    const result = await query<BankAccount>(
      'SELECT * FROM bank_accounts WHERE id = $1',
      [accountId]
    );

    return result.length > 0 ? transformBankAccountToUI(result[0]) : null;
  }

  /**
   * Auto-detect user region from locale/timezone
   */
  detectUserRegion(
    locale?: string,
    countryCode?: string,
    timezone?: string
  ): string {
    return detectUserRegion(locale, countryCode, timezone);
  }

  /**
   * Get supported regions and their capabilities
   */
  getSupportedRegions(): Record<string, {
    provider: string;
    currencies: string[];
    countries: string[];
  }> {
    const regions = bankingProviderFactory.getSupportedRegions();
    const result: Record<string, {
      provider: string;
      currencies: string[];
      countries: string[];
    }> = {};

    for (const region of regions) {
      result[region] = {
        provider: bankingProviderFactory.getProviderForRegion(region),
        currencies: bankingProviderFactory.getSupportedCurrencies(region),
        countries: bankingProviderFactory.getSupportedCountries(region),
      };
    }

    return result;
  }

  // Private helper methods

  private async saveBankAccount(accountData: CreateBankAccount): Promise<UIBankAccount> {
    const result = await query<BankAccount>(
      `INSERT INTO bank_accounts (
        user_id, provider, region, plaid_account_id, plaid_access_token,
        truelayer_account_id, truelayer_access_token,
        account_name, account_type, account_subtype, institution_name, institution_id,
        mask, currency_code, current_balance, available_balance, sync_status, last_synced_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        accountData.user_id, accountData.provider, accountData.region,
        accountData.plaid_account_id, accountData.plaid_access_token,
        accountData.truelayer_account_id, accountData.truelayer_access_token,
        accountData.account_name, accountData.account_type, accountData.account_subtype,
        accountData.institution_name, accountData.institution_id, accountData.mask,
        accountData.currency_code, accountData.current_balance, accountData.available_balance,
        accountData.sync_status, accountData.last_synced_at
      ]
    );

    return transformBankAccountToUI(result[0]);
  }

  private async updateBankAccount(accountId: string, updates: Partial<UpdateBankAccount>): Promise<void> {
    const setParts: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        setParts.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (setParts.length === 0) return;

    setParts.push(`updated_at = NOW()`);
    values.push(accountId);

    await query(
      `UPDATE bank_accounts SET ${setParts.join(', ')} WHERE id = $${paramIndex}`,
      values
    );
  }

  private getAccessTokenForAccount(account: UIBankAccount): string | null {
    // Type assertion is needed because UIBankAccount doesn't expose provider-specific tokens
    // This is intentional to keep the UI type clean
    const accountWithTokens = account as UIBankAccount & {
      plaidAccessToken?: string;
      truelayerAccessToken?: string;
    };
    
    switch (account.provider) {
      case 'plaid':
        return accountWithTokens.plaidAccessToken || null;
      case 'truelayer':
        return accountWithTokens.truelayerAccessToken || null;
      default:
        return null;
    }
  }

  private getProviderAccountId(account: UIBankAccount): string {
    // Type assertion is needed because UIBankAccount doesn't expose provider-specific IDs
    // This is intentional to keep the UI type clean
    const accountWithProviderIds = account as UIBankAccount & {
      plaidAccountId?: string;
      truelayerAccountId?: string;
    };
    
    switch (account.provider) {
      case 'plaid':
        return accountWithProviderIds.plaidAccountId || account.id!;
      case 'truelayer':
        return accountWithProviderIds.truelayerAccountId || account.id!;
      default:
        return account.id!;
    }
  }

  private async checkForDuplicate(transactionId: string): Promise<boolean> {
    const result = await query(
      'SELECT id FROM transactions WHERE plaid_transaction_id = $1 OR truelayer_transaction_id = $1',
      [transactionId]
    );

    return result.length > 0;
  }

  private async saveBankTransaction(transaction: unknown, account: UIBankAccount): Promise<void> {
    // This would integrate with the existing transaction creation logic
    // For now, this is a placeholder
    const txn = transaction as { id: string };
    console.log('Saving bank transaction:', txn.id, 'for account:', account.id);
  }

  private async removeSensitiveAccountData(accountId: string): Promise<void> {
    // Remove access tokens and other sensitive data
    await query(
      `UPDATE bank_accounts SET 
        plaid_access_token = NULL,
        truelayer_access_token = NULL,
        last_error = NULL
      WHERE id = $1`,
      [accountId]
    );
  }
}

// Export singleton instance
export const universalBankingService = UniversalBankingService.getInstance();