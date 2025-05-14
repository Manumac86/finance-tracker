import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fetcher = async (url: string, method: string = "GET") => {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    method,
  });
  if (!res.ok) {
    throw new Error("Failed to fetch data");
  }
  return res.json();
};
