'use client'

import Image from 'next/image'
import type { Vehicle, EnforcementAction } from '@/types'
import { Button } from '@/components/ui/button'
import { formatDuration } from '@/lib/utils'
import styles from './vehicle-card.module.scss'

interface VehicleCardProps {
  vehicle: Vehicle
  onAction: (vehicleId: string, action: EnforcementAction) => void
  isActioning?: boolean
}

export function VehicleCard({ vehicle, onAction, isActioning }: VehicleCardProps) {
  if (vehicle.actioned) return null

  const isViolation = vehicle.overstay_status === 'violation'
  const isApproaching = vehicle.overstay_status === 'approaching'

  const timeLabel = isViolation
    ? `+${formatDuration(vehicle.overstay_minutes)} over`
    : isApproaching
      ? `${formatDuration(vehicle.time_limit_minutes - vehicle.overstay_minutes)} left`
      : `${formatDuration(vehicle.time_limit_minutes - vehicle.overstay_minutes)} remaining`

  return (
    <div className={styles.card} data-status={vehicle.overstay_status}>
      <div className={styles.top}>
        {vehicle.image_url && (
          <div className={styles.photo}>
            <Image
              src={vehicle.image_url}
              alt={`${vehicle.color} ${vehicle.make}`}
              fill
              unoptimized
            />
          </div>
        )}

        <div className={styles.details}>
          <span className={styles.plate}>{vehicle.license_plate}</span>
          <span className={styles.desc}>
            {vehicle.color} {vehicle.make} {vehicle.model}
          </span>
          <span className={styles.meta}>
            {vehicle.type} · Spot {vehicle.spot_label}
          </span>
          <span className={styles.timer} data-status={vehicle.overstay_status}>
            {timeLabel}
          </span>
        </div>
      </div>

      <div className={styles.actions}>
        <Button
          className={styles.cite}
          onClick={() => {
            if (window.confirm(`Cite vehicle ${vehicle.license_plate}?`)) {
              onAction(vehicle.id, 'cite')
            }
          }}
          disabled={isActioning}
        >
          Cite
        </Button>
        <Button
          variant="secondary"
          className={styles.warn}
          onClick={() => onAction(vehicle.id, 'warn')}
          disabled={isActioning}
        >
          Warn
        </Button>
        <Button
          variant="ghost"
          className={styles.skip}
          onClick={() => onAction(vehicle.id, 'skip')}
          disabled={isActioning}
        >
          Skip
        </Button>
      </div>
    </div>
  )
}
