'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchQueue } from '@/lib/api-client'

/** Fetches the priority-sorted zone queue */
export function useQueue() {
  return useQuery({
    queryKey: ['queue'],
    queryFn: fetchQueue,
    refetchInterval: 30_000,
  })
}
