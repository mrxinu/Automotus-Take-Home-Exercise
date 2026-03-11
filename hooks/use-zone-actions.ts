'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { arriveAtZone, departZone, enforceVehicle } from '@/lib/api-client'
import { toast } from 'sonner'
import type { QueueStop, ZoneDetail } from '@/types'

/** Mutation: officer arrives at a zone */
export function useArriveAtZone() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (zoneId: string) => arriveAtZone(zoneId),
    onMutate: async (zoneId) => {
      await queryClient.cancelQueries({ queryKey: ['queue'] })
      const previous = queryClient.getQueryData<QueueStop[]>(['queue'])

      queryClient.setQueryData<QueueStop[]>(['queue'], (old) =>
        old?.map((z) => (z.zone_id === zoneId ? { ...z, status: 'on_scene' as const } : z))
      )

      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['queue'], context.previous)
      }
      toast.error('Failed to arrive at zone. Try again.')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['queue'] })
      queryClient.invalidateQueries({ queryKey: ['zone'] })
      queryClient.invalidateQueries({ queryKey: ['activity'] })
    },
  })
}

/** Mutation: officer departs from a zone */
export function useDepartZone() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (zoneId: string) => departZone(zoneId),
    onMutate: async (zoneId) => {
      await queryClient.cancelQueries({ queryKey: ['queue'] })
      const previous = queryClient.getQueryData<QueueStop[]>(['queue'])

      queryClient.setQueryData<QueueStop[]>(['queue'], (old) =>
        old?.map((z) => (z.zone_id === zoneId ? { ...z, status: 'idle' as const } : z))
      )

      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['queue'], context.previous)
      }
      toast.error('Failed to depart zone. Try again.')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['queue'] })
      queryClient.invalidateQueries({ queryKey: ['zone'] })
      queryClient.invalidateQueries({ queryKey: ['activity'] })
    },
  })
}

/** Mutation: take enforcement action on a vehicle (cite, warn, skip) */
export function useEnforceVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ zoneId, vehicleId, action }: {
      zoneId: string
      vehicleId: string
      action: 'cite' | 'warn' | 'skip'
    }) => enforceVehicle(zoneId, vehicleId, action),
    onMutate: async ({ zoneId, vehicleId }) => {
      await queryClient.cancelQueries({ queryKey: ['zone', zoneId] })
      const previous = queryClient.getQueryData<ZoneDetail>(['zone', zoneId])

      queryClient.setQueryData<ZoneDetail>(['zone', zoneId], (old) => {
        if (!old) return old
        return {
          ...old,
          vehicles: old.vehicles.filter((v) => v.id !== vehicleId),
        }
      })

      return { previous }
    },
    onError: (_err, { zoneId, action }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['zone', zoneId], context.previous)
      }
      const labels = { cite: 'Cite', warn: 'Warn', skip: 'Skip' } as const
      toast.error(`Failed to ${labels[action].toLowerCase()} vehicle. Try again.`)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['queue'] })
      queryClient.invalidateQueries({ queryKey: ['zone'] })
      queryClient.invalidateQueries({ queryKey: ['activity'] })
    },
  })
}
