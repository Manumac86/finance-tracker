import { NextResponse } from "next/server";
import { getCategories } from "@/services/categories";

export const GET = async (req: Request) => {
  const { data, success } = await getCategories();
  if (!success) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch categories" }),
      { status: 500 }
    );
  }
  return NextResponse.json(data);
};
