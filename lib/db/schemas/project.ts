import { z } from "zod";

// Database schema (PostgreSQL snake_case)
export const projectSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string(),
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  client_name: z.string().optional(),
  project_code: z.string().optional(),
  status: z.enum(["active", "completed", "on_hold", "cancelled"]).default("active"),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  budget: z.number().optional(),
  hourly_rate: z.number().optional(),
  color: z.string().default("#6B7280"),
  tags: z.array(z.string()).default([]),
  is_billable: z.boolean().default(true),
  is_active: z.boolean().default(true),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Project = z.infer<typeof projectSchema>;

// UI schema (camelCase)
export interface UIProject {
  id?: string;
  userId: string;
  name: string;
  description?: string;
  clientName?: string;
  projectCode?: string;
  status: "active" | "completed" | "on_hold" | "cancelled";
  startDate?: string;
  endDate?: string;
  budget?: number;
  hourlyRate?: number;
  color: string;
  tags: string[];
  isBillable: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Transform functions
export function transformProjectToUI(project: Project): UIProject {
  return {
    id: project.id,
    userId: project.user_id,
    name: project.name,
    description: project.description,
    clientName: project.client_name,
    projectCode: project.project_code,
    status: project.status,
    startDate: project.start_date,
    endDate: project.end_date,
    budget: project.budget,
    hourlyRate: project.hourly_rate,
    color: project.color,
    tags: project.tags,
    isBillable: project.is_billable,
    isActive: project.is_active,
    createdAt: project.created_at,
    updatedAt: project.updated_at,
  };
}

export function transformUIToProject(uiProject: Partial<UIProject>): Partial<Project> {
  return {
    id: uiProject.id,
    user_id: uiProject.userId,
    name: uiProject.name,
    description: uiProject.description,
    client_name: uiProject.clientName,
    project_code: uiProject.projectCode,
    status: uiProject.status,
    start_date: uiProject.startDate,
    end_date: uiProject.endDate,
    budget: uiProject.budget,
    hourly_rate: uiProject.hourlyRate,
    color: uiProject.color,
    tags: uiProject.tags,
    is_billable: uiProject.isBillable,
    is_active: uiProject.isActive,
    created_at: uiProject.createdAt,
    updated_at: uiProject.updatedAt,
  };
}