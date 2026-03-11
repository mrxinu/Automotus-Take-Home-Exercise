'use client'

import type { QueueStop } from '@/types'
import { AlertTriangle } from 'lucide-react'
import styles from './queue-card.module.scss'

interface QueueCardProps {
  stop: QueueStop
  onTap: (stop: QueueStop) => void
}

export function QueueCard({ stop, onTap }: QueueCardProps) {
  return (
    <button
      className={styles.card}
      onClick={() => onTap(stop)}
      type="button"
    >
      <div className={styles.body}>
        <span className={styles.name}>{stop.zone_name}</span>
        <span className={styles.address}>{stop.address}</span>
      </div>

      <div className={styles.stats}>
        {stop.violation_count > 0 && (
          <span className={styles.violation}>
            <AlertTriangle size={14} aria-hidden="true" />
            {stop.violation_count}
          </span>
        )}
        <span className={styles.occupancy}>
          {stop.occupancy}/{stop.max_capacity}
        </span>
      </div>
    </button>
  )
}
