import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { universalBankingService } from '@/lib/services/universal-banking-service';
import { z } from 'zod';

// Request schemas
const InitiateConnectionSchema = z.object({
  region: z.string().min(1),
  redirectUri: z.string().url().optional(),
  webhookUrl: z.string().url().optional(),
});

const CompleteConnectionSchema = z.object({
  publicToken: z.string().min(1),
  region: z.string().min(1),
  metadata: z.record(z.any()).optional(),
});

// POST /api/banking/connect - Initiate bank connection
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    if (action === 'initiate') {
      // Validate request
      const validatedData = InitiateConnectionSchema.parse(body);

      // Initiate connection
      const connectionResponse = await universalBankingService.initiateConnection({
        userId,
        region: validatedData.region,
        redirectUri: validatedData.redirectUri,
        webhookUrl: validatedData.webhookUrl,
      });

      return NextResponse.json({
        success: true,
        data: connectionResponse,
      });

    } else if (action === 'complete') {
      // Validate request
      const validatedData = CompleteConnectionSchema.parse(body);

      // Complete connection
      const accounts = await universalBankingService.completeConnection(
        userId,
        validatedData.publicToken,
        validatedData.region
      );

      return NextResponse.json({
        success: true,
        data: {
          accounts,
          message: `Successfully connected ${accounts.length} account(s)`,
        },
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use ?action=initiate or ?action=complete' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Banking connection error:', error);

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
        error: 'Failed to process bank connection',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET /api/banking/connect - Get supported regions and connection info
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    if (action === 'regions') {
      // Get supported regions
      const supportedRegions = universalBankingService.getSupportedRegions();

      return NextResponse.json({
        success: true,
        data: {
          supportedRegions,
          autoDetectedRegion: universalBankingService.detectUserRegion(
            searchParams.get('locale') || undefined,
            searchParams.get('countryCode') || undefined,
            searchParams.get('timezone') || undefined
          ),
        },
      });

    } else if (action === 'accounts') {
      // Get user's existing bank accounts
      const accounts = await universalBankingService.getBankAccountsByUser(userId);

      return NextResponse.json({
        success: true,
        data: {
          accounts,
          total: accounts.length,
        },
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use ?action=regions or ?action=accounts' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Failed to get banking info:', error);

    return NextResponse.json(
      { 
        error: 'Failed to get banking information',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}