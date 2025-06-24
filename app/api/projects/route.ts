import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { selectProjects, insertProject } from "@/lib/db/postgres";
import { 
  transformProjectToUI,
  projectSchema 
} from "@/lib/db/schemas/project";

// Form data schema for API validation
const createProjectSchema = projectSchema.omit({ 
  id: true, 
  user_id: true,
  created_at: true,
  updated_at: true,
  is_active: true
});

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projects = await selectProjects(userId);
    const uiProjects = projects.map(transformProjectToUI);
    
    return NextResponse.json({ projects: uiProjects });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
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
    const validatedData = createProjectSchema.parse(formData);
    
    // Add user_id and timestamps
    const projectData = {
      ...validatedData,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true,
    };
    
    const project = await insertProject(projectData);
    const uiProject = transformProjectToUI(project);
    
    return NextResponse.json(uiProject, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}