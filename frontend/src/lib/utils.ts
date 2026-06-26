import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(dateString);
}

export function statusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: "bg-slate-100 text-slate-700",
    "in-progress": "bg-blue-50 text-blue-700",
    validated: "bg-emerald-50 text-emerald-700",
    done: "bg-emerald-50 text-emerald-700",
    blocked: "bg-red-50 text-red-700",
  };
  return colors[status] || "bg-slate-100 text-slate-700";
}

export function priorityColor(priority: string): string {
  const colors: Record<string, string> = {
    critical: "bg-red-50 text-red-700 border-red-200",
    high: "bg-amber-50 text-amber-700 border-amber-200",
    medium: "bg-blue-50 text-blue-700 border-blue-200",
    low: "bg-slate-50 text-slate-600 border-slate-200",
  };
  return colors[priority] || "bg-slate-50 text-slate-600 border-slate-200";
}

export function severityColor(severity: string): string {
  const colors: Record<string, string> = {
    critical: "text-red-700 bg-red-50",
    high: "text-amber-700 bg-amber-50",
    medium: "text-blue-700 bg-blue-50",
    low: "text-slate-600 bg-slate-50",
  };
  return colors[severity] || "text-slate-600 bg-slate-50";
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}
