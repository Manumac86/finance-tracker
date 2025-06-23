import { NextRequest, NextResponse } from "next/server";
import { selectCategories } from "@/lib/db/postgres";
import { transformCategoryToUI } from "@/lib/db/schemas/category";

export async function GET(request: NextRequest) {
  try {
    const categories = await selectCategories();
    const uiCategories = categories.map(transformCategoryToUI);
    
    return NextResponse.json(uiCategories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
