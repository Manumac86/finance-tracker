import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { 
  selectManualAccounts, 
  insertManualAccount,
  getAccountSummary 
} from '../../../lib/db/postgres';
import { 
  CreateManualAccountSchema,
  transformManualAccountToUI
} from '../../../lib/db/schemas/manual-account';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const includeSummary = searchParams.get('summary') === 'true';

    // Fetch accounts
    const accounts = await selectManualAccounts(userId);
    const uiAccounts = accounts.map(transformManualAccountToUI);

    const response: { accounts: typeof uiAccounts; summary?: unknown } = {
      accounts: uiAccounts
    };

    // Optionally include summary
    if (includeSummary) {
      const summary = await getAccountSummary(userId);
      response.summary = summary;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to fetch accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = CreateManualAccountSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid account data',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const accountData = {
      ...validationResult.data,
      user_id: userId,
    };

    // Create account
    const account = await insertManualAccount(accountData);
    const uiAccount = transformManualAccountToUI(account);

    return NextResponse.json(uiAccount, { status: 201 });
  } catch (error) {
    console.error('Failed to create account:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}