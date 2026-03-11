'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchZoneDetail } from '@/lib/api-client'

/** Fetches zone detail including vehicles */
export function useZoneDetail(zoneId: string | null) {
  return useQuery({
    queryKey: ['zone', zoneId],
    queryFn: () => fetchZoneDetail(zoneId!),
    enabled: !!zoneId,
  })
}
