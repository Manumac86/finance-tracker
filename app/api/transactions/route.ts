import { NextResponse } from "next/server";
import { getTransactions } from "@/services/transactions";

export const GET = async (req: Request) => {
  const { data, success } = await getTransactions();
  if (!success) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch transactions" }),
      { status: 500 }
    );
  }
  return NextResponse.json(data);
};
