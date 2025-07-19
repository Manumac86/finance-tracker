import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { redis } from "@/lib/db/redis";

const CACHE_KEYS = {
  BALANCE_HISTORY: (userId: string, period: string) =>
    `balance_history:${userId}:${period}`,
};

export async function POST() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Clear cache for all periods
    const periods = ["year", "month", "week"];
    const deletePromises = periods.map(period => 
      redis.del(CACHE_KEYS.BALANCE_HISTORY(user.id, period))
    );

    await Promise.all(deletePromises);

    return NextResponse.json({ 
      message: "Balance history cache cleared successfully",
      clearedPeriods: periods.length
    });
  } catch (error) {
    console.error("Clear cache error:", error);
    return NextResponse.json(
      { error: "Failed to clear cache" },
      { status: 500 }
    );
  }
}