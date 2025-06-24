import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { updateProject, deleteProject, selectProjectById } from "@/lib/db/postgres";
import { 
  transformProjectToUI, 
  projectSchema
} from "@/lib/db/schemas/project";

// Form data schema for API validation
const updateProjectSchema = projectSchema.omit({ 
  id: true, 
  user_id: true,
  created_at: true,
  updated_at: true,
  is_active: true
});

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
    
    // Convert form data format to match our schema
    const formData = {
      name: body.name,
      description: body.description,
      client_name: body.clientName,
      project_code: body.projectCode,
      status: body.status || "active",
      start_date: body.startDate,
      end_date: body.endDate,
      budget: body.budget ? parseFloat(body.budget) : undefined,
      hourly_rate: body.hourlyRate ? parseFloat(body.hourlyRate) : undefined,
      color: body.color || "#6B7280",
      tags: body.tags || [],
      is_billable: body.isBillable ?? true,
    };
    
    // Validate input
    const validatedData = updateProjectSchema.parse(formData);
    
    // Add updated timestamp
    const projectData = {
      ...validatedData,
      updated_at: new Date().toISOString(),
    };
    
    const project = await updateProject(id, userId, projectData);
    const uiProject = transformProjectToUI(project);
    
    return NextResponse.json(uiProject);
  } catch (error) {
    console.error("Error updating project:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to update project" },
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

    await deleteProject(id, userId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting project:", error);
    
    return NextResponse.json(
      { error: "Failed to delete project" },
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

    const project = await selectProjectById(id, userId);
    
    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }
    
    const uiProject = transformProjectToUI(project);
    
    return NextResponse.json(uiProject);
  } catch (error) {
    console.error("Error fetching project:", error);
    
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}