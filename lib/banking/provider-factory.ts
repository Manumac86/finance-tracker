import { BaseBankingProvider, ProviderConfig, ProviderFactory } from './providers/base-provider';
import { PlaidProvider } from './providers/plaid-provider';
import { TrueLayerProvider } from './providers/truelayer-provider';

export class BankingProviderFactory implements ProviderFactory {
  private static instance: BankingProviderFactory;
  private providers: Map<string, BaseBankingProvider> = new Map();

  private constructor() {}

  static getInstance(): BankingProviderFactory {
    if (!BankingProviderFactory.instance) {
      BankingProviderFactory.instance = new BankingProviderFactory();
    }
    return BankingProviderFactory.instance;
  }

  /**
   * Create a banking provider for the specified region
   */
  createProvider(region: string, config: ProviderConfig): BaseBankingProvider {
    const providerKey = `${region}-${config.environment}`;
    
    // Return cached provider if available
    if (this.providers.has(providerKey)) {
      return this.providers.get(providerKey)!;
    }

    let provider: BaseBankingProvider;

    switch (region.toUpperCase()) {
      case 'US':
      case 'USA':
      case 'UNITED_STATES':
        provider = new PlaidProvider(config.clientId, config.secretKey, config.environment);
        break;

      case 'ES':
      case 'EU':
      case 'SPAIN':
      case 'EUROPE':
        provider = new TrueLayerProvider(config.clientId, config.secretKey, config.environment, config.redirectUri);
        break;

      default:
        throw new Error(`Unsupported region: ${region}. Supported regions: US, ES/EU`);
    }

    // Cache the provider
    this.providers.set(providerKey, provider);
    
    return provider;
  }

  /**
   * Get supported regions
   */
  getSupportedRegions(): string[] {
    return ['US', 'ES', 'EU'];
  }

  /**
   * Get the recommended provider for a region
   */
  getProviderForRegion(region: string): string {
    const providerMap: Record<string, string> = {
      'US': 'plaid',
      'USA': 'plaid',
      'UNITED_STATES': 'plaid',
      'ES': 'truelayer',
      'EU': 'truelayer',
      'SPAIN': 'truelayer',
      'EUROPE': 'truelayer'
    };

    const provider = providerMap[region.toUpperCase()];
    if (!provider) {
      throw new Error(`No provider available for region: ${region}`);
    }

    return provider;
  }

  /**
   * Get supported currencies for a region
   */
  getSupportedCurrencies(region: string): string[] {
    const currencyMap: Record<string, string[]> = {
      'US': ['USD'],
      'ES': ['EUR'],
      'EU': ['EUR', 'GBP', 'CHF', 'SEK', 'NOK', 'DKK']
    };

    return currencyMap[region.toUpperCase()] || ['USD'];
  }

  /**
   * Get supported countries for a region
   */
  getSupportedCountries(region: string): string[] {
    const countryMap: Record<string, string[]> = {
      'US': ['US', 'USA'],
      'ES': ['ES', 'IT', 'FR', 'DE', 'NL', 'BE', 'AT', 'PT'],
      'EU': ['ES', 'IT', 'FR', 'DE', 'NL', 'BE', 'AT', 'PT', 'FI', 'SE', 'NO', 'DK', 'GB']
    };

    return countryMap[region.toUpperCase()] || [];
  }

  /**
   * Validate configuration for a region/provider
   */
  validateConfig(region: string, config: ProviderConfig): boolean {
    const provider = this.getProviderForRegion(region);
    
    // Basic validation
    if (!config.clientId || !config.secretKey) {
      throw new Error(`Missing required credentials for ${provider} provider`);
    }

    if (!['sandbox', 'development', 'production'].includes(config.environment)) {
      throw new Error(`Invalid environment: ${config.environment}`);
    }

    // Provider-specific validation
    switch (provider) {
      case 'plaid':
        return this.validatePlaidConfig(config);
      case 'truelayer':
        return this.validateTrueLayerConfig(config);
      default:
        return true;
    }
  }

  private validatePlaidConfig(config: ProviderConfig): boolean {
    // Plaid-specific validation
    if (config.environment === 'production' && !config.webhookUrl) {
      console.warn('Webhook URL recommended for production Plaid integration');
    }
    return true;
  }

  private validateTrueLayerConfig(config: ProviderConfig): boolean {
    // TrueLayer-specific validation
    if (!config.redirectUri) {
      throw new Error('Redirect URI required for TrueLayer integration');
    }
    return true;
  }


  /**
   * Clear cached providers (useful for testing or configuration changes)
   */
  clearCache(): void {
    this.providers.clear();
  }

  /**
   * Get regional configuration requirements
   */
  getConfigRequirements(region: string): {
    required: string[];
    optional: string[];
    environment: string[];
  } {
    const provider = this.getProviderForRegion(region);

    const baseRequirements = {
      required: ['clientId', 'secretKey'],
      optional: ['webhookUrl'],
      environment: ['sandbox', 'development', 'production'],
    };

    switch (provider) {
      case 'plaid':
        return baseRequirements;

      case 'truelayer':
        return {
          ...baseRequirements,
          required: [...baseRequirements.required, 'redirectUri'],
          optional: [...baseRequirements.optional, 'additionalConfig' as const],
        };

      default:
        return baseRequirements;
    }
  }
}

// Convenience export for singleton access
export const bankingProviderFactory = BankingProviderFactory.getInstance();

// Configuration helpers
export function createProviderConfig(
  clientId: string,
  secretKey: string,
  environment: 'sandbox' | 'development' | 'production' = 'sandbox',
  options?: {
    webhookUrl?: string;
    redirectUri?: string;
    additionalConfig?: Record<string, unknown>;
  }
): ProviderConfig {
  return {
    clientId,
    secretKey,
    environment,
    webhookUrl: options?.webhookUrl,
    redirectUri: options?.redirectUri,
    additionalConfig: options?.additionalConfig,
  };
}

// Environment configuration helpers
export function getEnvironmentConfig(): Record<string, ProviderConfig> {
  return {
    US: createProviderConfig(
      process.env.PLAID_CLIENT_ID || '',
      process.env.PLAID_SECRET_KEY || '',
      (process.env.PLAID_ENV as 'sandbox' | 'development' | 'production') || 'sandbox',
      {
        webhookUrl: process.env.PLAID_WEBHOOK_URL,
      }
    ),
    ES: createProviderConfig(
      process.env.TRUELAYER_CLIENT_ID || '',
      process.env.TRUELAYER_CLIENT_SECRET || '',
      (process.env.TRUELAYER_ENV as 'sandbox' | 'development' | 'production') || 'sandbox',
      {
        redirectUri: process.env.TRUELAYER_REDIRECT_URI,
        webhookUrl: process.env.TRUELAYER_WEBHOOK_URL,
      }
    ),
    EU: createProviderConfig(
      process.env.TRUELAYER_CLIENT_ID || '',
      process.env.TRUELAYER_CLIENT_SECRET || '',
      (process.env.TRUELAYER_ENV as 'sandbox' | 'development' | 'production') || 'sandbox',
      {
        redirectUri: process.env.TRUELAYER_REDIRECT_URI,
        webhookUrl: process.env.TRUELAYER_WEBHOOK_URL,
      }
    )
  };
}

// Utility to detect region from user locale or IP
export function detectUserRegion(
  locale?: string,
  countryCode?: string,
  timezone?: string
): string {
  // Priority: explicit country code > locale > timezone
  if (countryCode) {
    const normalizedCountry = countryCode.toUpperCase();
    if (['US', 'USA'].includes(normalizedCountry)) return 'US';
    if (['ES', 'IT', 'FR', 'DE', 'NL', 'BE', 'AT', 'PT', 'GB'].includes(normalizedCountry)) return 'EU';
  }

  if (locale) {
    const localeParts = locale.toLowerCase().split('-');
    const language = localeParts[0];
    const country = localeParts[1];

    if (country) {
      if (['us', 'usa'].includes(country)) return 'US';
      if (['es', 'it', 'fr', 'de', 'nl', 'be', 'at', 'pt', 'gb'].includes(country)) return 'EU';
    }

    if (language === 'en') return 'US';
    if (['es', 'it', 'fr', 'de', 'nl'].includes(language)) return 'EU';
  }

  if (timezone) {
    if (timezone.includes('America/New_York') || timezone.includes('America/Chicago')) return 'US';
    if (timezone.includes('Europe/')) return 'EU';
  }

  // Default to US if unable to detect
  return 'US';
}

