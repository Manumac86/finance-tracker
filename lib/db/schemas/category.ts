import { z } from "zod";

// PostgreSQL category schema (snake_case for database)
export const categoryDbSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string(),
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  icon: z.string().min(1, "Icon is required"),
  color: z.string().default("#6B7280"),
  category_type: z.enum(["personal", "business"]).default("personal"),
  parent_category_id: z.string().uuid().optional(),
  is_tax_deductible: z.boolean().default(false),
  tax_category_code: z.string().optional(),
  business_expense_type: z
    .enum([
      "office_supplies",
      "travel",
      "meals",
      "equipment",
      "software",
      "marketing",
      "professional_services",
      "utilities",
      "rent",
      "other",
    ])
    .optional(),
  tags: z.array(z.string()).default([]),
  project_id: z.string().optional(),
  is_system_category: z.boolean().default(false),
  sort_order: z.number().default(0),
  is_active: z.boolean().default(true),
  translations: z.record(z.string(), z.string()).optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

// UI category schema (camelCase for frontend)
export const categoryUISchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  icon: z.string().min(1, "Icon is required"),
  color: z.string().default("#6B7280"),
  categoryType: z.enum(["personal", "business"]).default("personal"),
  parentCategoryId: z.string().optional(),
  isTaxDeductible: z.boolean().default(false),
  taxCategoryCode: z.string().optional(),
  businessExpenseType: z
    .enum([
      "office_supplies",
      "travel",
      "meals",
      "equipment",
      "software",
      "marketing",
      "professional_services",
      "utilities",
      "rent",
      "other",
    ])
    .optional(),
  tags: z.array(z.string()).default([]),
  translations: z.record(z.string(), z.string()).optional(),
  projectId: z.string().optional(),
  isSystemCategory: z.boolean().default(false),
  sortOrder: z.number().default(0),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

// API input schema for creating categories
export const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  icon: z.string().min(1, "Icon is required"),
  color: z.string().default("#6B7280"),
  categoryType: z.enum(["personal", "business"]).default("personal"),
  parentCategoryId: z.string().optional(),
  isTaxDeductible: z.boolean().default(false),
  taxCategoryCode: z.string().optional(),
  businessExpenseType: z
    .enum([
      "office_supplies",
      "travel",
      "meals",
      "equipment",
      "software",
      "marketing",
      "professional_services",
      "utilities",
      "rent",
      "other",
    ])
    .optional(),
  tags: z.array(z.string()).default([]),
  projectId: z.string().optional(),
});

// Types
export type Category = z.infer<typeof categoryDbSchema>;
export type UICategory = z.infer<typeof categoryUISchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

// Transform functions between DB and UI formats
export function transformCategoryToUI(category: Category): UICategory {
  return {
    id: category.id,
    userId: category.user_id,
    name: category.name,
    description: category.description,
    icon: category.icon,
    color: category.color,
    categoryType: category.category_type,
    parentCategoryId: category.parent_category_id,
    isTaxDeductible: category.is_tax_deductible,
    taxCategoryCode: category.tax_category_code,
    businessExpenseType: category.business_expense_type,
    tags: category.tags,
    projectId: category.project_id,
    isSystemCategory: category.is_system_category,
    sortOrder: category.sort_order,
    isActive: category.is_active,
    translations: category.translations,
    createdAt: category.created_at,
    updatedAt: category.updated_at,
  };
}

export function transformCategoryToDB(
  category: Partial<UICategory>
): Partial<Category> {
  return {
    id: category.id,
    user_id: category.userId,
    name: category.name,
    description: category.description,
    icon: category.icon,
    color: category.color,
    category_type: category.categoryType,
    parent_category_id: category.parentCategoryId,
    is_tax_deductible: category.isTaxDeductible,
    tax_category_code: category.taxCategoryCode,
    business_expense_type: category.businessExpenseType,
    tags: category.tags,
    project_id: category.projectId,
    is_system_category: category.isSystemCategory,
    sort_order: category.sortOrder,
    is_active: category.isActive,
    translations: category.translations,
    created_at: category.createdAt,
    updated_at: category.updatedAt,
  };
}
