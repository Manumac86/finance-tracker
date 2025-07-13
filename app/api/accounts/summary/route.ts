import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { 
  getAccountSummary,
  selectManualAccounts 
} from '../../../../lib/db/postgres';
import { 
  transformManualAccountToUI,
  calculateAccountSummary
} from '../../../../lib/db/schemas/manual-account';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get database summary (more efficient for basic totals)
    const dbSummary = await getAccountSummary(userId);
    
    // Get detailed accounts for UI calculations
    const accounts = await selectManualAccounts(userId);
    const uiAccounts = accounts.map(transformManualAccountToUI);
    const uiSummary = calculateAccountSummary(uiAccounts);

    // Combine database and UI calculations
    const summary = {
      // Basic counts and totals from database
      totalAccounts: dbSummary.total_accounts,
      activeAccounts: dbSummary.active_accounts,
      totalBalance: dbSummary.total_balance,
      totalAssets: dbSummary.total_assets,
      totalLiabilities: dbSummary.total_liabilities,
      
      // Detailed breakdown by account type
      byType: {
        checking: {
          count: uiSummary.byType.checking.count,
          balance: dbSummary.checking_balance,
          formattedBalance: new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(dbSummary.checking_balance)
        },
        savings: {
          count: uiSummary.byType.savings.count,
          balance: dbSummary.savings_balance,
          formattedBalance: new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(dbSummary.savings_balance)
        },
        credit: {
          count: uiSummary.byType.credit.count,
          balance: dbSummary.credit_balance,
          formattedBalance: new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(dbSummary.credit_balance)
        },
        cash: {
          count: uiSummary.byType.cash.count,
          balance: dbSummary.cash_balance,
          formattedBalance: new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(dbSummary.cash_balance)
        },
        investment: {
          count: uiSummary.byType.investment.count,
          balance: dbSummary.investment_balance,
          formattedBalance: new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(dbSummary.investment_balance)
        }
      },
      
      // Formatted totals for UI
      formattedTotalBalance: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(dbSummary.total_balance),
      formattedTotalAssets: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(dbSummary.total_assets),
      formattedTotalLiabilities: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(dbSummary.total_liabilities),
      
      // Net worth calculation
      netWorth: dbSummary.total_assets - dbSummary.total_liabilities,
      formattedNetWorth: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(dbSummary.total_assets - dbSummary.total_liabilities),
      
      // Health indicators
      healthIndicators: {
        hasAccounts: dbSummary.total_accounts > 0,
        hasActiveAccounts: dbSummary.active_accounts > 0,
        hasPositiveNetWorth: (dbSummary.total_assets - dbSummary.total_liabilities) > 0,
        hasEmergencyFund: dbSummary.savings_balance > 1000, // Basic threshold
        creditUtilization: dbSummary.credit_balance < 0 ? 
          Math.abs(dbSummary.credit_balance) : 0 // Simplified calculation
      }
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Failed to fetch account summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch account summary' },
      { status: 500 }
    );
  }
}