"use client";
import { UICategory } from "@/lib/db/schemas/category";
import { createContext, useContext } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface CategoriesContextType {
  data: UICategory[] | null;
  isLoading: boolean;
  error: Error | null;
  mutate: () => void;
}

export const CategoriesContext = createContext<CategoriesContextType>({
  data: null,
  isLoading: false,
  error: null,
  mutate: () => {},
});

export const CategoriesProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { data, error, isLoading, mutate } = useSWR<{
    categories: UICategory[];
  }>("/api/categories", fetcher);

  return (
    <CategoriesContext.Provider
      value={{
        data: data?.categories || null,
        isLoading,
        error,
        mutate,
      }}
    >
      {children}
    </CategoriesContext.Provider>
  );
};

export const useCategories = () => {
  const context = useContext(CategoriesContext);
  if (!context) {
    throw new Error("useCategories must be used within a CategoriesProvider");
  }
  return context;
};
