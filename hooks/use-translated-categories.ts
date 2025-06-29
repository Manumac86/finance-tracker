"use client";

import { useMemo } from "react";
import { useLocale } from "next-intl";
import { useCategories } from "@/contexts/categories";
import { UICategory } from "@/lib/db/schemas/category";

// Default category translations - you can expand this
const DEFAULT_CATEGORY_TRANSLATIONS: Record<string, Record<string, string>> = {
  // Common expense categories
  "Food & Dining": {
    en: "Food & Dining",
    es: "Comida y Restaurantes",
  },
  Groceries: {
    en: "Groceries",
    es: "Comestibles",
  },
  Transportation: {
    en: "Transportation",
    es: "Transporte",
  },
  Shopping: {
    en: "Shopping",
    es: "Compras",
  },
  Entertainment: {
    en: "Entertainment",
    es: "Entretenimiento",
  },
  "Bills & Utilities": {
    en: "Bills & Utilities",
    es: "Facturas y Servicios",
  },
  Healthcare: {
    en: "Healthcare",
    es: "Salud",
  },
  Travel: {
    en: "Travel",
    es: "Viajes",
  },
  Education: {
    en: "Education",
    es: "Educación",
  },
  "Personal Care": {
    en: "Personal Care",
    es: "Cuidado Personal",
  },
  "Home & Garden": {
    en: "Home & Garden",
    es: "Hogar y Jardín",
  },
  "Sports & Recreation": {
    en: "Sports & Recreation",
    es: "Deportes y Recreación",
  },
  "Gifts & Donations": {
    en: "Gifts & Donations",
    es: "Regalos y Donaciones",
  },
  "Business Expenses": {
    en: "Business Expenses",
    es: "Gastos de Negocio",
  },
  Insurance: {
    en: "Insurance",
    es: "Seguros",
  },
  Taxes: {
    en: "Taxes",
    es: "Impuestos",
  },
  Investments: {
    en: "Investments",
    es: "Inversiones",
  },
  // Common income categories
  Salary: {
    en: "Salary",
    es: "Salario",
  },
  Freelance: {
    en: "Freelance",
    es: "Trabajo Independiente",
  },
  "Business Income": {
    en: "Business Income",
    es: "Ingresos de Negocio",
  },
  "Investments Income": {
    en: "Investments Income",
    es: "Ingresos de Inversiones",
  },
  "Rental Income": {
    en: "Rental Income",
    es: "Ingresos de Alquiler",
  },
  "Other Income": {
    en: "Other Income",
    es: "Otros Ingresos",
  },
  // Additional categories that were found in the database
  "Food & Drink": {
    en: "Food & Drink",
    es: "Comida y Bebida",
  },
  Income: {
    en: "Income",
    es: "Ingresos",
  },
  Savings: {
    en: "Savings",
    es: "Ahorros",
  },
  Other: {
    en: "Other",
    es: "Otros",
  },
};

export interface TranslatedCategory extends UICategory {
  translatedName: string;
}

export function useTranslatedCategories() {
  const { data: categories, isLoading, error } = useCategories();
  const locale = useLocale();

  const translatedCategories = useMemo(() => {
    if (!categories) return [];

    return categories.map((category): TranslatedCategory => {
      let translatedName = category.name;

      // Method 1: Check if category has translations in database
      if (category.translations && category.translations[locale]) {
        translatedName = category.translations[locale];
      }
      // Method 2: Fallback to predefined translations
      else if (DEFAULT_CATEGORY_TRANSLATIONS[category.name]?.[locale]) {
        translatedName = DEFAULT_CATEGORY_TRANSLATIONS[category.name][locale];
      }
      // Method 3: Fallback to English if available
      else if (
        locale !== "en" &&
        DEFAULT_CATEGORY_TRANSLATIONS[category.name]?.en
      ) {
        translatedName = DEFAULT_CATEGORY_TRANSLATIONS[category.name].en;
      }

      return {
        ...category,
        translatedName,
      };
    });
  }, [categories, locale]);

  return {
    data: translatedCategories,
    isLoading,
    error,
    locale,
  };
}

// Helper function to get translated category name by ID
export function getTranslatedCategoryName(
  categories: TranslatedCategory[],
  categoryId: string
): string {
  const category = categories.find((cat) => cat.id === categoryId);
  return category?.translatedName || category?.name || "Unknown Category";
}
