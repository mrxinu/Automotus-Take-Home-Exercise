import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format minutes into human-readable duration (e.g., "1h 23m" or "45m") */
export function formatDuration(minutes: number): string {
  if (minutes < 0) return '0m'
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

/** Format an ISO timestamp into a relative time string (e.g., "5m ago", "2h ago") */
export function formatRelativeTime(isoTimestamp: string): string {
  const now = Date.now()
  const then = new Date(isoTimestamp).getTime()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHrs = Math.floor(diffMin / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  return `${Math.floor(diffHrs / 24)}d ago`
}

/** Format an ISO timestamp to a short time string (e.g., "3:45 PM") */
export function formatTime(isoTimestamp: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(isoTimestamp))
}

/** Generate a simple UUID-like string */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36)
}
