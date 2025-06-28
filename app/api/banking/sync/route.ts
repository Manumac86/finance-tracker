import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { universalBankingService } from '@/lib/services/universal-banking-service';
import { z } from 'zod';

// Request schemas
const SyncAccountSchema = z.object({
  accountId: z.string().uuid(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

const SyncAllAccountsSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// POST /api/banking/sync - Sync bank transactions
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    if (action === 'account') {
      // Sync specific account
      const validatedData = SyncAccountSchema.parse(body);

      const result = await universalBankingService.syncTransactions(
        validatedData.accountId,
        validatedData.startDate ? new Date(validatedData.startDate) : undefined,
        validatedData.endDate ? new Date(validatedData.endDate) : undefined
      );

      return NextResponse.json({
        success: true,
        data: result,
        message: `Sync completed: ${result.transactionsAdded} transactions added, ${result.duplicatesDetected} duplicates detected`,
      });

    } else if (action === 'all') {
      // Sync all user accounts
      SyncAllAccountsSchema.parse(body); // Validate input but don't need the result

      const result = await universalBankingService.syncAllAccounts(userId);

      return NextResponse.json({
        success: true,
        data: result,
        message: `Sync completed: ${result.accountsUpdated} accounts updated, ${result.transactionsAdded} transactions added`,
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use ?action=account or ?action=all' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Banking sync error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to sync bank data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET /api/banking/sync - Get sync status and history
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get('accountId');

    if (accountId) {
      // Get specific account sync status
      const account = await universalBankingService.getBankAccount(accountId);
      
      if (!account) {
        return NextResponse.json(
          { error: 'Account not found' },
          { status: 404 }
        );
      }

      if (account.userId !== userId) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          accountId: account.id,
          accountName: account.accountName,
          syncStatus: account.syncStatus,
          lastSyncedAt: account.lastSyncedAt,
          lastError: account.lastError,
          isActive: account.isActive,
        },
      });

    } else {
      // Get all accounts sync status
      const accounts = await universalBankingService.getBankAccountsByUser(userId);

      const syncStatus = accounts.map(account => ({
        accountId: account.id,
        accountName: account.accountName,
        provider: account.provider,
        region: account.region,
        syncStatus: account.syncStatus,
        lastSyncedAt: account.lastSyncedAt,
        lastError: account.lastError,
        isActive: account.isActive,
      }));

      const summary = {
        totalAccounts: accounts.length,
        activeAccounts: accounts.filter(acc => acc.isActive).length,
        syncedAccounts: accounts.filter(acc => acc.syncStatus === 'synced').length,
        failedAccounts: accounts.filter(acc => acc.syncStatus === 'failed').length,
        lastGlobalSync: Math.max(
          ...accounts
            .filter(acc => acc.lastSyncedAt)
            .map(acc => new Date(acc.lastSyncedAt!).getTime())
        ),
      };

      return NextResponse.json({
        success: true,
        data: {
          summary,
          accounts: syncStatus,
        },
      });
    }

  } catch (error) {
    console.error('Failed to get sync status:', error);

    return NextResponse.json(
      { 
        error: 'Failed to get sync status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}