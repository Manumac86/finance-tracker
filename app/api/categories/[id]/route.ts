import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { updateCategory, deleteCategory, selectCategoryById } from "@/lib/db/postgres";
import { 
  transformCategoryToUI, 
  transformCategoryToDB, 
  createCategorySchema 
} from "@/lib/db/schemas/category";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await context.params;
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate input
    const validatedData = createCategorySchema.parse(body);
    
    // Transform UI data to DB format
    const categoryData = transformCategoryToDB(validatedData);
    
    // Add updated timestamp
    categoryData.updated_at = new Date().toISOString();
    
    const category = await updateCategory(id, categoryData);
    const uiCategory = transformCategoryToUI(category);
    
    return NextResponse.json(uiCategory);
  } catch (error) {
    console.error("Error updating category:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await context.params;
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await deleteCategory(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await context.params;
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const category = await selectCategoryById(id);
    
    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }
    
    const uiCategory = transformCategoryToUI(category);
    
    return NextResponse.json(uiCategory);
  } catch (error) {
    console.error("Error fetching category:", error);
    
    return NextResponse.json(
      { error: "Failed to fetch category" },
      { status: 500 }
    );
  }
}