'use client'

import type { ActivityEntry as ActivityEntryType } from '@/types'
import { formatTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { FileWarning, AlertTriangle, SkipForward, CheckCircle, Navigation, MapPin } from 'lucide-react'
import styles from './activity-entry.module.scss'

const ACTION_CONFIG = {
  cite: { icon: FileWarning, label: 'Cited', color: 'cite' },
  warn: { icon: AlertTriangle, label: 'Warned', color: 'warn' },
  skip: { icon: SkipForward, label: 'Skipped', color: 'skip' },
  clear: { icon: CheckCircle, label: 'Cleared', color: 'clear' },
  arrive: { icon: MapPin, label: 'Arrived', color: 'arrive' },
  depart: { icon: Navigation, label: 'Departed', color: 'depart' },
} as const

export function ActivityEntryCard({ entry }: { entry: ActivityEntryType }) {
  const config = ACTION_CONFIG[entry.action] ?? ACTION_CONFIG.clear
  const Icon = config.icon

  return (
    <div className={cn(styles.toast, styles[config.color])}>
      <Icon size={14} className={cn(styles.icon, styles[config.color])} aria-hidden="true" />
      <span className={cn(styles.label, styles[config.color])}>
        {config.label}
      </span>
      <span className={styles.zone}>{entry.zone_name}</span>
      <span className={styles.time}>{formatTime(entry.timestamp)}</span>
    </div>
  )
}
