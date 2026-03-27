import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function truncate(str: string, length: number): string {
  return str.length > length ? str.slice(0, length) + "…" : str;
}

const ACTION_LABELS: Record<string, string> = {
  "secret.read": "Read secret",
  "secret.write": "Updated secret",
  "secret.delete": "Deleted secret",
  "secret.bulk_read": "Bulk secret pull",
  "project.created": "Created project",
  "project.deleted": "Deleted project",
  "environment.created": "Created environment",
  "org.created": "Created organization",
  "token.created": "Created API token",
  "token.revoked": "Revoked API token",
};

export function actionLabel(action: string): string {
  return ACTION_LABELS[action] || action;
}
