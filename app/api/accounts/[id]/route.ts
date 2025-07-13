import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { 
  selectManualAccountById, 
  updateManualAccount,
  deleteManualAccount,
  selectAccountBalanceHistory
} from '../../../../lib/db/postgres';
import { 
  UpdateManualAccountSchema,
  transformManualAccountToUI
} from '../../../../lib/db/schemas/manual-account';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const includeHistory = searchParams.get('history') === 'true';

    // Fetch account
    const account = await selectManualAccountById(id, userId);
    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    const uiAccount = transformManualAccountToUI(account);
    const response: { account: typeof uiAccount; history?: unknown[] } = { account: uiAccount };

    // Optionally include balance history
    if (includeHistory) {
      const history = await selectAccountBalanceHistory(id, userId);
      response.history = history;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to fetch account:', error);
    return NextResponse.json(
      { error: 'Failed to fetch account' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
    const validationResult = UpdateManualAccountSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid account data',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    // Update account
    const account = await updateManualAccount(
      id,
      userId,
      validationResult.data
    );
    
    const uiAccount = transformManualAccountToUI(account);
    return NextResponse.json(uiAccount);
  } catch (error) {
    console.error('Failed to update account:', error);
    return NextResponse.json(
      { error: 'Failed to update account' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await deleteManualAccount(id, userId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete account:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}