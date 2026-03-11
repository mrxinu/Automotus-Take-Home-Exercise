'use client'

import { useState } from 'react'
import { QueueCard } from '@/components/queue/queue-card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EmptyQueue } from '@/components/queue/empty-queue'
import { ErrorState } from '@/components/error-state'
import { ZoneDetailDrawer } from '@/components/zone/zone-detail-drawer'
import { useQueue } from '@/hooks/use-queue'
import { useOfficerLocation } from '@/hooks/use-officer-location'
import { Button } from '@/components/ui/button'
import { Navigation } from 'lucide-react'
import type { QueueStop } from '@/types'
import styles from './page.module.scss'

export default function QueuePage() {
  const { data: queue, isLoading, isError, refetch } = useQueue()
  const { location: officerLocation } = useOfficerLocation()
  const [selectedZone, setSelectedZone] = useState<QueueStop | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const handleTapZone = (stop: QueueStop) => {
    setSelectedZone(stop)
    setDrawerOpen(true)
  }

  const handleNavigateQueue = () => {
    if (!queue || queue.length === 0) return

    const violationStops = queue.filter((z) => z.violation_count > 0).slice(0, 25)
    if (violationStops.length === 0) return

    const origin = `${officerLocation.lat},${officerLocation.lng}`
    const destination = `${violationStops[violationStops.length - 1].lat},${violationStops[violationStops.length - 1].lng}`
    const waypoints = violationStops
      .slice(0, -1)
      .map((z) => `${z.lat},${z.lng}`)
      .join('|')

    let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=walking`
    if (waypoints) url += `&waypoints=${waypoints}`

    window.open(url, '_blank')
  }

  return (
    <main id="main-content" className={styles.main}>
      {isLoading && <LoadingSpinner label="Loading zones…" />}

      {isError && (
        <ErrorState
          message="Couldn't load the zone queue. Check your connection."
          onRetry={() => refetch()}
        />
      )}

      {queue && queue.length === 0 && <EmptyQueue />}

      {queue && queue.length > 0 && (
        <div className={styles.list}>
          <Button className={styles['route-btn']} onClick={handleNavigateQueue}>
            <Navigation size={18} aria-hidden="true" />
            Start Route
          </Button>

          <div className={styles['route-list']}>
            {queue.map((stop, i) => {
              const isLast = i === queue.length - 1
              const isFirst = i === 0
              const color = stop.violation_count > 0
                ? 'var(--status-violation)'
                : stop.approaching_count > 0
                  ? 'var(--status-approaching)'
                  : 'var(--status-clear)'

              return (
                <div key={stop.id} className={styles.stop}>
                  <div className={styles.rail}>
                    <div
                      className={styles.pip}
                      style={{
                        background: isFirst ? color : 'var(--card)',
                        border: `2.5px solid ${color}`,
                        color: isFirst ? '#fff' : color,
                      }}
                    >
                      {i + 1}
                    </div>
                    {!isLast && (
                      <div className={styles.connector} style={{ background: color }} />
                    )}
                  </div>

                  <div className={styles.content}>
                    <QueueCard stop={stop} onTap={handleTapZone} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <ZoneDetailDrawer
        selectedZone={selectedZone}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </main>
  )
}
