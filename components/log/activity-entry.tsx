'use client'

import Image from 'next/image'
import type { ActivityEntry as ActivityEntryType } from '@/types'
import { FileWarning, AlertTriangle, SkipForward, CheckCircle, Navigation, MapPin } from 'lucide-react'
import styles from './activity-entry.module.scss'

const ACTION_META: Record<string, { icon: typeof FileWarning; label: string }> = {
  cite: { icon: FileWarning, label: 'Citation Issued' },
  warn: { icon: AlertTriangle, label: 'Warning Issued' },
  skip: { icon: SkipForward, label: 'Skipped' },
  clear: { icon: CheckCircle, label: 'Cleared' },
  arrive: { icon: MapPin, label: 'Arrived at Zone' },
  depart: { icon: Navigation, label: 'Departed Zone' },
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export function ActivityEntryCard({ entry }: { entry: ActivityEntryType }) {
  const meta = ACTION_META[entry.action] ?? ACTION_META.clear
  const Icon = meta.icon
  const hasVehicle = !!entry.license_plate

  return (
    <article className={styles.entry}>
      <div className={styles.leading}>
        <Icon size={16} aria-hidden="true" />
      </div>

      <div className={styles.content}>
        <div className={styles.topRow}>
          <span className={styles.label}>{meta.label}</span>
          <time className={styles.time}>{formatTimestamp(entry.timestamp)}</time>
        </div>

        <span className={styles.zone}>{entry.zone_name}</span>

        {hasVehicle && (
          <div className={styles.vehicle}>
            {entry.vehicle_image && (
              <div className={styles.thumb}>
                <Image
                  src={entry.vehicle_image}
                  alt=""
                  width={40}
                  height={28}
                  unoptimized
                />
              </div>
            )}
            <span className={styles.plate}>{entry.license_plate}</span>
          </div>
        )}

        {entry.note && <p className={styles.note}>{entry.note}</p>}
      </div>
    </article>
  )
}
