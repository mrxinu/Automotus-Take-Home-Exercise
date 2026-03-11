'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { Vehicle, EnforcementAction } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDuration } from '@/lib/utils'
import { cn } from '@/lib/utils'
import styles from './vehicle-card.module.scss'

interface VehicleCardProps {
  vehicle: Vehicle
  onAction: (vehicleId: string, action: EnforcementAction) => void
}

const TYPE_COLORS: Record<string, string> = {
  personal: 'bg-blue-100 text-blue-800',
  rideshare: 'bg-violet-100 text-violet-800',
  delivery: 'bg-orange-100 text-orange-800',
  commercial: 'bg-slate-100 text-slate-800',
}

export function VehicleCard({ vehicle, onAction }: VehicleCardProps) {
  const [clicked, setClicked] = useState<EnforcementAction | null>(null)

  const overstayLabel =
    vehicle.overstay_status === 'violation'
      ? `+${formatDuration(vehicle.overstay_minutes)}`
      : vehicle.overstay_status === 'approaching'
        ? 'Almost up'
        : `${formatDuration(vehicle.time_limit_minutes - vehicle.overstay_minutes)} left`

  return (
    <div className={styles.card}>
      {vehicle.image_url && (
        <div className={styles.image}>
          <Image
            src={vehicle.image_url}
            alt={`${vehicle.color} ${vehicle.make}`}
            fill
            unoptimized
          />
          <span className={cn(styles.overstay, styles[vehicle.overstay_status])}>
            {overstayLabel}
          </span>
        </div>
      )}

      <div className={styles.body}>
        <div className={styles.row}>
          <span className={styles.plate}>{vehicle.license_plate}</span>
          <Badge
            variant="outline"
            className={cn('text-[10px] px-1.5 py-0 shrink-0', TYPE_COLORS[vehicle.type])}
          >
            {vehicle.type}
          </Badge>
        </div>
        <div className={styles.detail}>
          {vehicle.color} {vehicle.make}
        </div>
      </div>

      <div className={styles.actions}>
        <Button
          size="sm"
          className={cn(styles.cite, clicked === 'cite' && styles.clicked)}
          onClick={() => {
            if (window.confirm(`Cite vehicle ${vehicle.license_plate}?`)) {
              setClicked('cite')
              onAction(vehicle.id, 'cite')
            }
          }}
        >
          Cite
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className={cn(styles.action, clicked === 'warn' && styles.clicked)}
          onClick={() => {
            setClicked('warn')
            onAction(vehicle.id, 'warn')
          }}
        >
          Warn
        </Button>
        <Button
          size="sm"
          variant="outline"
          className={cn(styles.action, 'text-muted-foreground', clicked === 'skip' && styles.clicked)}
          onClick={() => {
            setClicked('skip')
            onAction(vehicle.id, 'skip')
          }}
        >
          Skip
        </Button>
      </div>
    </div>
  )
}
