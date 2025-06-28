// Banking provider type definitions

export interface PlaidAccount {
  account_id: string;
  name: string;
  type: string;
  subtype: string;
  mask?: string;
  balances: {
    current: number | null;
    available: number | null;
    iso_currency_code?: string;
  };
}

export interface PlaidTransaction {
  transaction_id: string;
  account_id: string;
  amount: number;
  date: string;
  name: string;
  merchant_name?: string;
  category?: string[];
  pending: boolean;
  iso_currency_code?: string;
  location?: {
    address?: string;
    city?: string;
    region?: string;
    country?: string;
  };
}

export interface PlaidInstitution {
  institution_id: string;
  name: string;
  country_codes: string[];
  primary_color?: string;
  logo?: string;
  url?: string;
}

export interface PlaidError {
  error_code: string;
  error_message: string;
  error_type: string;
  display_message?: string;
}

export interface TrueLayerAccount {
  account_id: string;
  account_type: string;
  display_name: string;
  currency: string;
  account_number?: {
    iban?: string;
    number?: string;
  };
  provider?: {
    provider_id: string;
    display_name: string;
  };
}

export interface TrueLayerTransaction {
  transaction_id: string;
  timestamp: string;
  description: string;
  amount: number;
  currency: string;
  transaction_type: string;
  merchant_name?: string;
  transaction_category?: string;
  running_balance?: {
    amount: number;
    currency: string;
  };
}

export interface TrueLayerBalance {
  available: number;
  current: number;
  overdraft?: number;
  currency: string;
  last_update_time: string;
}

export interface BelvoAccount {
  id: string;
  link: string;
  institution?: {
    name: string;
    type: string;
  };
  name: string;
  number?: string;
  currency: string;
  type: string;
  balance?: {
    current: number;
    available: number;
  };
  category?: string;
}

export interface BelvoTransaction {
  id: string;
  account: string;
  value_date: string;
  description: string;
  amount: number;
  currency: string;
  type: string;
  category?: string;
  merchant?: {
    name: string;
  };
  reference?: string;
  status: string;
}

export interface BelvoBalance {
  id: string;
  account: string;
  value_date: string;
  balance: number;
  current_balance: number;
  statement: string;
}

export interface BelvoInstitution {
  id: string;
  name: string;
  type: string;
  country: string;
  status: string;
}

// Request/Response types
export interface PlaidLinkTokenRequest {
  user: {
    client_user_id: string;
  };
  client_name: string;
  products: string[];
  country_codes: string[];
  language: string;
  redirect_uri?: string;
  webhook?: string;
}

export interface PlaidLinkTokenResponse {
  link_token: string;
  expiration: string;
}

export interface PlaidExchangeRequest {
  public_token: string;
}

export interface PlaidExchangeResponse {
  access_token: string;
  item_id: string;
}

export interface PlaidAccountsRequest {
  access_token: string;
}

export interface PlaidAccountsResponse {
  accounts: PlaidAccount[];
  item: {
    institution_id: string;
  };
}

export interface PlaidTransactionsRequest {
  access_token: string;
  start_date: string;
  end_date: string;
  account_ids?: string[];
  offset: number;
  count: number;
}

export interface PlaidTransactionsResponse {
  transactions: PlaidTransaction[];
  total_transactions: number;
}

export interface PlaidBalanceRequest {
  access_token: string;
  account_ids?: string[];
}

export interface PlaidItemRemoveRequest {
  access_token: string;
}

export interface PlaidInstitutionsRequest {
  count: number;
  offset: number;
  country_codes: string[];
}

export interface PlaidInstitutionsResponse {
  institutions: PlaidInstitution[];
}

export interface PlaidWebhookBody {
  webhook_type: string;
  webhook_code: string;
  item_id: string;
  error?: PlaidError;
}