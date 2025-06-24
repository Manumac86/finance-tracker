import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { selectCategories, insertCategory } from "@/lib/db/postgres";
import { 
  transformCategoryToUI, 
  transformCategoryToDB, 
  createCategorySchema 
} from "@/lib/db/schemas/category";

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const categories = await selectCategories();
    const uiCategories = categories.map(transformCategoryToUI);
    
    return NextResponse.json({ categories: uiCategories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate input
    const validatedData = createCategorySchema.parse(body);
    
    // Transform UI data to DB format and add user_id
    const categoryData = transformCategoryToDB({
      ...validatedData,
      userId,
    });
    
    // Add timestamps
    categoryData.created_at = new Date().toISOString();
    categoryData.updated_at = new Date().toISOString();
    
    const category = await insertCategory(categoryData);
    const uiCategory = transformCategoryToUI(category);
    
    return NextResponse.json(uiCategory, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
