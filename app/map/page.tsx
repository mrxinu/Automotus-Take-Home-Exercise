'use client'

import { useState } from 'react'
import { ErrorState } from '@/components/error-state'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ZoneDetailDrawer } from '@/components/zone/zone-detail-drawer'
import { useQueue } from '@/hooks/use-queue'
import { useOfficerLocation } from '@/hooks/use-officer-location'
import { MapView } from '@/components/map/map-view'
import type { QueueStop } from '@/types'
import styles from './page.module.scss'

export default function MapPage() {
  const { data: queue, isLoading, isError, refetch } = useQueue()
  const { location: officerLocation } = useOfficerLocation()
  const [selectedZone, setSelectedZone] = useState<QueueStop | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const handleMarkerTap = (stop: QueueStop) => {
    setSelectedZone(stop)
    setDrawerOpen(true)
  }

  return (
    <>
      <main id="main-content" className={styles.main}>
        {isLoading && <LoadingSpinner label="Loading map…" />}

        {isError && (
          <ErrorState
            message="Couldn't load zone data for the map."
            onRetry={() => refetch()}
          />
        )}

        {queue && queue.length === 0 && (
          <div className={styles.empty}>
            <p className={styles['empty-text']}>No zones to display on the map.</p>
          </div>
        )}

        {queue && queue.length > 0 && (
          <MapView zones={queue} onMarkerTap={handleMarkerTap} officerLocation={officerLocation} />
        )}
      </main>

      <ZoneDetailDrawer
        selectedZone={selectedZone}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </>
  )
}
