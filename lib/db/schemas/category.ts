import { z } from "zod";

// PostgreSQL category schema (snake_case for database)
export const categoryDbSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  icon: z.string().min(1, "Icon is required"),
  color: z.string().default('#6B7280'),
  is_active: z.boolean().default(true),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

// UI category schema (camelCase for frontend)
export const categoryUISchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  icon: z.string().min(1, "Icon is required"),
  color: z.string().default('#6B7280'),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

// API input schema for creating categories
export const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  icon: z.string().min(1, "Icon is required"),
  color: z.string().default('#6B7280'),
});

// Types
export type Category = z.infer<typeof categoryDbSchema>;
export type UICategory = z.infer<typeof categoryUISchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

// Transform functions between DB and UI formats
export function transformCategoryToUI(category: Category): UICategory {
  return {
    id: category.id,
    name: category.name,
    description: category.description,
    icon: category.icon,
    color: category.color,
    isActive: category.is_active,
    createdAt: category.created_at,
    updatedAt: category.updated_at,
  };
}

export function transformCategoryToDB(category: Partial<UICategory>): Partial<Category> {
  return {
    id: category.id,
    name: category.name,
    description: category.description,
    icon: category.icon,
    color: category.color,
    is_active: category.isActive,
    created_at: category.createdAt,
    updated_at: category.updatedAt,
  };
}