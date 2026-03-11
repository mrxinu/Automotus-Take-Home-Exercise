'use client'

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { VehicleCard } from './vehicle-card'
import { ErrorState } from '@/components/error-state'
import { useZoneDetail } from '@/hooks/use-zone-detail'
import { useArriveAtZone, useDepartZone, useEnforceVehicle } from '@/hooks/use-zone-actions'
import { useOfficerLocation } from '@/hooks/use-officer-location'
import type { QueueStop, EnforcementAction } from '@/types'
import { Navigation, MapPin, AlertTriangle, Car } from 'lucide-react'
import styles from './zone-detail-drawer.module.scss'

interface ZoneDetailDrawerProps {
  selectedZone: QueueStop | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const STATUS_LABELS: Record<string, string> = {
  idle: 'On My Way',
  on_scene: 'Depart Zone',
}

export function ZoneDetailDrawer({ selectedZone, open, onOpenChange }: ZoneDetailDrawerProps) {
  const { data, isLoading, isError, refetch } = useZoneDetail(
    open ? selectedZone?.zone_id ?? null : null
  )
  const arrive = useArriveAtZone()
  const depart = useDepartZone()
  const enforce = useEnforceVehicle()
  const { location: officerLocation } = useOfficerLocation()

  const handleStatusChange = () => {
    if (!selectedZone) return
    if (selectedZone.status === 'idle') {
      arrive.mutate(selectedZone.zone_id)
    } else {
      depart.mutate(selectedZone.zone_id)
    }
  }

  const handleVehicleAction = (vehicleId: string, action: EnforcementAction) => {
    if (!selectedZone) return
    enforce.mutate({
      zoneId: selectedZone.zone_id,
      vehicleId,
      action,
    })
  }

  const handleNavigate = () => {
    if (!selectedZone) return
    window.open(
      `https://www.google.com/maps/dir/?api=1&origin=${officerLocation.lat},${officerLocation.lng}&destination=${selectedZone.lat},${selectedZone.lng}&travelmode=walking`,
      '_blank'
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className={styles.content}>
        <div className={styles.wrapper}>
          <DrawerHeader className={styles.header}>
            <div className={styles.titleRow}>
              <DrawerTitle className={styles.title}>
                {selectedZone?.zone_name ?? 'Zone Detail'}
              </DrawerTitle>
              {selectedZone && selectedZone.violation_count > 0 && (
                <Badge variant="destructive" className={styles.badge}>
                  <AlertTriangle size={10} aria-hidden="true" />
                  {selectedZone.violation_count}
                </Badge>
              )}
            </div>

            <DrawerDescription className={styles.description}>
              <MapPin size={11} className={styles.descIcon} aria-hidden="true" />
              {selectedZone?.address}
              <span className={styles.occupancy}>
                <Car size={11} aria-hidden="true" />
                {selectedZone?.occupancy}/{selectedZone?.max_capacity}
              </span>
            </DrawerDescription>

            {selectedZone && (
              <div className={styles.actionRow}>
                <Button
                  variant="secondary"
                  className={styles.statusBtn}
                  onClick={handleStatusChange}
                  disabled={arrive.isPending || depart.isPending}
                >
                  {STATUS_LABELS[selectedZone.status] ?? 'On My Way'}
                </Button>
                <Button
                  size="icon"
                  className={styles.navBtn}
                  onClick={handleNavigate}
                  aria-label="Navigate to zone"
                >
                  <Navigation size={18} aria-hidden="true" />
                </Button>
              </div>
            )}
          </DrawerHeader>

          <div className={styles.divider} />

          <div className={styles.vehicles}>
            {isLoading && <LoadingSpinner label="Loading vehicles…" />}

            {isError && (
              <ErrorState
                message="Couldn't load vehicles for this zone."
                onRetry={() => refetch()}
              />
            )}

            {data && data.vehicles.length === 0 && (
              <div className={styles.empty}>No vehicles in this zone right now.</div>
            )}

            {data?.vehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                onAction={handleVehicleAction}
                isActioning={enforce.isPending}
              />
            ))}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
