// Modified from rakazo (Apache-2.0), github.com/elie222/rakazo@912c977
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
