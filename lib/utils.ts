import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCents(cents: number, currency = "EUR"): string {
  return new Intl.NumberFormat("it-IT", {
    style:    "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function formatDistance(metres: number): string {
  if (metres < 1000) return `${Math.round(metres)} m`;
  return `${(metres / 1000).toFixed(1)} km`;
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("it-IT", {
    day:   "numeric",
    month: "short",
    year:  "numeric",
  }).format(new Date(iso));
}
