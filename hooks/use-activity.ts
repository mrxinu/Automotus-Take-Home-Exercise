'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchActivity } from '@/lib/api-client'

/** Fetches the officer's activity log */
export function useActivity() {
  return useQuery({
    queryKey: ['activity'],
    queryFn: fetchActivity,
  })
}
