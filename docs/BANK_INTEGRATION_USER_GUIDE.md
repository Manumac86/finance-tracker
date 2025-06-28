# Bank Integration User Guide

## How to Connect Your Bank Account

### 🎯 Overview

FinTrack supports bank connections in **3 major regions** with automatic transaction import, real-time balance updates, and intelligent categorization.

### 🌍 Supported Regions

| Region | Provider | Banks Supported | Currencies |
|--------|----------|-----------------|------------|
| 🇺🇸 **United States** | Plaid | 12,000+ banks & credit unions | USD |
| 🇪🇸 **Spain & Europe** | TrueLayer | 2,000+ banks (PSD2 compliant) | EUR, GBP, CHF, SEK, NOK, DKK |
| 🇦🇷 **Argentina & LATAM** | Belvo | 140+ major banks | ARS, USD, BRL, CLP, COP, PEN, MXN |

---

## 🚀 How to Connect Your Bank

### Step 1: Access Bank Connection

There are **3 easy ways** to connect your bank:

#### Option A: From Dashboard
1. Go to your **Dashboard**
2. Look for the **"Connect Your Bank"** card in the sidebar
3. Click **"Connect Your Bank"** button

#### Option B: From Banking Page  
1. Navigate to **Banking** in the main menu
2. Click **"Connect Bank"** button
3. Or click **"Connect Your First Bank"** if no accounts exist

#### Option C: From Header
1. Click **"Banking"** in the top navigation
2. Access the dedicated bank management page

### Step 2: Select Your Region

1. **Automatic Detection**: FinTrack auto-detects your region based on:
   - Browser locale settings
   - Timezone
   - User preferences

2. **Manual Selection**: Choose from:
   - 🇺🇸 **United States** (Plaid)
   - 🇪🇸 **Spain & Europe** (TrueLayer) 
   - 🇦🇷 **Argentina & Latin America** (Belvo)

### Step 3: Bank Authentication

#### For US Users (Plaid)
1. Search for your bank from 12,000+ institutions
2. Enter your **online banking credentials**
3. Complete any **multi-factor authentication**
4. Select which **accounts to connect**

#### For Spanish/EU Users (TrueLayer)
1. Choose your bank from the list
2. **Redirect to your bank's secure login**
3. Authenticate using your bank's official app/website
4. **Authorize FinTrack** to access account data
5. Return to FinTrack automatically

#### For Argentine/LATAM Users (Belvo)
1. Select your bank from major institutions
2. Enter your **online banking credentials**
3. Complete bank-specific authentication
4. Choose accounts to sync

### Step 4: Account Selection & Completion

1. **Review connected accounts**
2. **Verify account information**:
   - Account name
   - Account type (checking, savings, credit, etc.)
   - Last 4 digits
   - Current balance
3. **Complete setup**

---

## 🔧 Managing Connected Accounts

### Bank Accounts Dashboard

Access via **Banking** → View all your connected accounts with:

- **Account Overview**: Name, type, balance, institution
- **Sync Status**: Last sync time, sync health
- **Provider Info**: Which service connects your bank
- **Regional Badge**: Country/region identification

### Sync Options

#### Manual Sync
- **Individual Account**: Click refresh button on specific account
- **All Accounts**: Use "Sync All" button for bulk sync

#### Automatic Sync
- **Real-time Updates**: Via webhooks (when supported)
- **Scheduled Sync**: Daily automatic synchronization
- **Smart Sync**: Triggered by app usage patterns

### Account Management

#### Sync Status Indicators
- 🟢 **Synced**: Account is up to date
- 🟡 **Pending**: Sync in progress
- 🔴 **Failed**: Requires attention
- ⚫ **Disconnected**: Account inactive

#### Troubleshooting Sync Issues
1. **Re-authenticate**: Update bank credentials if expired
2. **Check Bank Status**: Verify bank's online services are working
3. **Contact Support**: For persistent issues

---

## 🔐 Security & Privacy

### Data Protection Standards

#### What We Store (Safe)
✅ **Account identifiers** (not account numbers)  
✅ **Last 4 digits only** (for identification)  
✅ **Transaction data** (amounts, dates, merchants)  
✅ **Account balances**  
✅ **Institution names**  

#### What We NEVER Store (Forbidden)
❌ **Full account numbers**  
❌ **Bank login credentials**  
❌ **CVCs or PINs**  
❌ **SSNs or government IDs**  
❌ **Full addresses**  

### Regional Compliance
- **🇺🇸 United States**: SOC 2 Type II, Bank-level security
- **🇪🇸 Europe**: PSD2 compliant, GDPR compliant
- **🇦🇷 Argentina**: ISO 27001 certified, Local regulations

### Security Features
- **Encrypted Storage**: All sensitive data encrypted at rest
- **TLS 1.3**: All communications encrypted in transit
- **Access Controls**: Role-based permissions for family accounts
- **Audit Logging**: Full activity tracking
- **Automatic Cleanup**: Sensitive data purged on disconnect

---

## ⚡ Features & Benefits

### Automatic Transaction Import
- **Real-time Sync**: New transactions appear automatically
- **Historical Data**: Import up to 2 years of transaction history
- **Smart Categorization**: AI-powered transaction categorization
- **Duplicate Detection**: Prevents duplicate entries

### Enhanced Transaction Data
- **Merchant Information**: Enriched merchant names and categories
- **Location Data**: City and country (no full addresses)
- **Account Context**: Which account each transaction came from
- **Currency Support**: Multi-currency handling for international accounts

### Balance Reconciliation
- **Real-time Balances**: Always up-to-date account balances
- **Balance History**: Track balance changes over time
- **Reconciliation Alerts**: Notifications for discrepancies
- **Multi-Account View**: Consolidated balance across all accounts

---

## 🌟 Advanced Features

### Family Account Integration
- **Shared Bank Accounts**: Connect family banking to shared budgets
- **Permission Controls**: Control who can see which accounts
- **Consolidated Views**: Family financial overview
- **Role-based Access**: Admin and member permissions

### International Support
- **Multi-Currency**: Handle accounts in different currencies
- **Exchange Rates**: Automatic currency conversion for reporting
- **Regional Banking**: Native support for local banking standards
- **Compliance**: Meets local financial regulations

### Smart Insights
- **Spending Patterns**: Identify spending trends from bank data
- **Budget Tracking**: Automatic budget vs. actual comparisons
- **Goal Progress**: Real-time progress toward financial goals
- **Alerts & Notifications**: Smart alerts for important changes

---

## 🔧 Troubleshooting

### Common Issues

#### "Bank Not Found"
- **Try Alternative Names**: Search for your bank by different names
- **Check Region**: Ensure you've selected the correct region
- **Contact Support**: We may need to add your specific bank

#### "Authentication Failed"
- **Check Credentials**: Verify your online banking username/password
- **2FA Issues**: Complete any required multi-factor authentication
- **Bank Maintenance**: Check if your bank is undergoing maintenance

#### "Sync Failures"
- **Re-authenticate**: Your bank credentials may have expired
- **Bank Changes**: Banks sometimes update their systems
- **Temporary Issues**: Try again in a few minutes

#### "Missing Transactions"
- **Date Range**: Check the sync date range settings
- **Account Selection**: Verify all desired accounts are connected
- **Bank Delays**: Some transactions may take time to appear

### Getting Help

#### Self-Service
1. **Banking Dashboard**: Check sync status and error messages
2. **Account Settings**: Verify connection and permissions
3. **Retry Sync**: Manual sync can resolve temporary issues

#### Contact Support
- **In-App Support**: Use the help system within FinTrack
- **Email Support**: Contact our banking integration specialists
- **Documentation**: Check our comprehensive help docs

---

## 🚀 Getting Started Checklist

### Before You Connect
- [ ] **Verify Region**: Confirm your country/region is supported
- [ ] **Bank Compatibility**: Check if your bank is supported
- [ ] **Online Banking**: Ensure you have active online banking
- [ ] **Credentials Ready**: Have your login information available

### After Connecting
- [ ] **Verify Accounts**: Check all accounts are properly connected
- [ ] **Review Transactions**: Confirm transaction import is working
- [ ] **Set Preferences**: Configure sync frequency and notifications
- [ ] **Security Check**: Review connected account permissions

### Ongoing Management
- [ ] **Regular Sync**: Monitor sync status and resolve issues quickly
- [ ] **Update Credentials**: Keep bank credentials current
- [ ] **Review Security**: Periodically check access permissions
- [ ] **Optimize Usage**: Use insights to improve financial management

---

**Need Help?** Visit our [Banking Support Center](mailto:banking-support@fintrack.com) or check the [FAQ](./FAQ.md) for more detailed assistance.