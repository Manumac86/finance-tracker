import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { 
  updateAccountBalance,
  selectAccountBalanceHistory
} from '../../../../../lib/db/postgres';
import { 
  ManualBalanceAdjustmentSchema
} from '../../../../../lib/db/schemas/manual-account';

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
    const validationResult = ManualBalanceAdjustmentSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid balance adjustment data',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const { new_balance, description } = validationResult.data;

    // Update account balance
    const account = await updateAccountBalance(
      id,
      userId,
      new_balance,
      description
    );

    return NextResponse.json({
      success: true,
      account,
      message: 'Account balance updated successfully'
    });
  } catch (error) {
    console.error('Failed to update account balance:', error);
    return NextResponse.json(
      { error: 'Failed to update account balance' },
      { status: 500 }
    );
  }
}

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
    const limit = parseInt(searchParams.get('limit') || '50');

    // Fetch balance history
    const history = await selectAccountBalanceHistory(id, userId, limit);

    return NextResponse.json({
      history,
      count: history.length
    });
  } catch (error) {
    console.error('Failed to fetch balance history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch balance history' },
      { status: 500 }
    );
  }
}