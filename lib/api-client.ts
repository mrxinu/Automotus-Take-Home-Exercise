import type { QueueStop, Vehicle, ZoneDetail, ActivityEntry } from '@/types'

const BASE_URL = '/api'

/**
 * Centralized fetch wrapper for all API calls.
 * Handles JSON parsing, error responses, and forwards ?error=true from page URL.
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const pageParams = typeof window !== 'undefined' ? window.location.search : ''
  const url = `${BASE_URL}${endpoint}${pageParams}`

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}))
    throw new Error(
      (errorBody as { error?: string }).error || `Request failed: ${res.status} ${res.statusText}`
    )
  }

  return res.json() as Promise<T>
}

// ---------------------------------------------------------------------------
// Queue
// ---------------------------------------------------------------------------

/** Fetch the officer's priority-sorted zone queue */
export function fetchQueue(): Promise<QueueStop[]> {
  return request<QueueStop[]>('/queue')
}

// ---------------------------------------------------------------------------
// Zone Detail
// ---------------------------------------------------------------------------

/** Fetch a zone with its vehicles */
export function fetchZoneDetail(zoneId: string): Promise<ZoneDetail> {
  return request<ZoneDetail>(`/zones/${zoneId}`)
}

// ---------------------------------------------------------------------------
// Zone Actions
// ---------------------------------------------------------------------------

/** Officer arrives at a zone */
export function arriveAtZone(
  zoneId: string
): Promise<{ zone: QueueStop; activity: ActivityEntry }> {
  return request<{ zone: QueueStop; activity: ActivityEntry }>(`/zones/${zoneId}/arrive`, {
    method: 'POST',
  })
}

/** Officer departs from a zone */
export function departZone(
  zoneId: string
): Promise<{ zone: QueueStop; activity: ActivityEntry }> {
  return request<{ zone: QueueStop; activity: ActivityEntry }>(`/zones/${zoneId}/depart`, {
    method: 'POST',
  })
}

// ---------------------------------------------------------------------------
// Vehicle Enforcement Actions
// ---------------------------------------------------------------------------

type EnforcementAction = 'cite' | 'warn' | 'skip'

/** Take enforcement action on a vehicle */
export function enforceVehicle(
  zoneId: string,
  vehicleId: string,
  action: EnforcementAction
): Promise<{ zone: QueueStop; vehicle: Vehicle; activity: ActivityEntry }> {
  return request<{ zone: QueueStop; vehicle: Vehicle; activity: ActivityEntry }>(
    `/zones/${zoneId}/vehicles/${vehicleId}/${action}`,
    { method: 'POST' }
  )
}

// ---------------------------------------------------------------------------
// Activity
// ---------------------------------------------------------------------------

/** Fetch the officer's activity log */
export function fetchActivity(): Promise<ActivityEntry[]> {
  return request<ActivityEntry[]>('/activity')
}

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

/** Reset all mock data to initial seed state */
export function resetData(): Promise<{ ok: boolean; message: string }> {
  return request<{ ok: boolean; message: string }>('/reset', {
    method: 'POST',
  })
}
