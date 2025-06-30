import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getBalanceHistory } from "@/lib/services/balance-history";
import { redis } from "@/lib/db/redis";

const CACHE_KEYS = {
  BALANCE_HISTORY: (userId: string, period: string) =>
    `balance_history:${userId}:${period}`,
};

const CACHE_TTL = 60 * 1; // 1 minute
const VALID_PERIODS = ["year", "month", "week"] as const;
type ValidPeriod = (typeof VALID_PERIODS)[number];

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get("period") as ValidPeriod | null;

    if (!period || !VALID_PERIODS.includes(period as ValidPeriod)) {
      return NextResponse.json(
        { error: "Invalid period. Must be one of: year, month, week" },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = CACHE_KEYS.BALANCE_HISTORY(user.id, period);
    const cached = await redis.get(cacheKey);
    if (cached) {
      return NextResponse.json({ data: cached });
    }

    // Calculate balance history
    const balanceHistory = await getBalanceHistory({
      userId: user.id,
      period,
    });

    // Cache the result
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(balanceHistory));

    return NextResponse.json({ data: balanceHistory });
  } catch (error) {
    console.error("Balance history error:", error);
    return NextResponse.json(
      { error: "Failed to fetch balance history" },
      { status: 500 }
    );
  }
}
