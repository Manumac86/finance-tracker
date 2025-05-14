"use server";

import { addCategory, getCategories } from "@/services/categories";
import { Category } from "@/lib/db/schemas";
export async function getCategoriesAction() {
  return getCategories();
}

export async function addCategoryAction(category: Category) {
  return addCategory(category);
}
