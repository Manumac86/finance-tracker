"use client";
import { Category } from "@/lib/db/schemas";
import { fetcher } from "@/lib/utils";
import { methodType } from "@/types/common.type";
import { createContext, useContext, useEffect, useState } from "react";
import useSWR from "swr";

export const SWRContext = createContext({
  categories: [] as Category[],
  setCategories: (newCategories: Category[]) => {},
});

export const CategoriesProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [categories, setCategories] = useState<Category[]>([]);

  const { data } = useSWR<Category[]>(
    ["/api/categories", "GET"],
    ([url, method]: [string, methodType]) => fetcher(url, method)
  );

  useEffect(() => {
    if (data) {
      setCategories(data);
    }
  }, [data]);

  return (
    <SWRContext.Provider
      value={{
        categories,
        setCategories: (newCategories: Category[]) =>
          setCategories(newCategories),
      }}
    >
      {children}
    </SWRContext.Provider>
  );
};

export const useCategories = () => {
  const { categories, setCategories } = useContext(SWRContext);
  return { categories, setCategories };
};
