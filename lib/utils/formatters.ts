import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export function formatDate(date: Date | string): string {
  return format(new Date(date), "dd MMM yyyy", { locale: fr });
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), "dd MMM yyyy à HH:mm", { locale: fr });
}

export function formatRelative(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr });
}

export function generateOrderRef(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, "0");
  return `ORD-${year}-${random}`;
}

export function generateShipmentRef(): string {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, "0");
  const random = Math.floor(Math.random() * 100).toString().padStart(2, "0");
  return `CNT-${year}-${month}-${random}`;
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

export function parseJsonField<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
