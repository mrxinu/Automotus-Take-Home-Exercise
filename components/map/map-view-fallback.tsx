'use client'

import { useRef, useCallback } from 'react'
import MapGL, { Marker, NavigationControl } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { QueueStop } from '@/types'

interface MapViewFallbackProps {
  zones: QueueStop[]
  onMarkerTap: (zone: QueueStop) => void
  officerLocation?: { lat: number; lng: number }
}

const PRIORITY_COLORS = {
  high: '#ea492e',
  medium: '#F59E0B',
  clear: '#22C55E',
} as const

const DEFAULT_CENTER = { lat: 39.9500, lng: -75.1680 }
const DEFAULT_ZOOM = 16
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty'

export function MapViewFallback({ zones, onMarkerTap, officerLocation }: MapViewFallbackProps) {
  const mapRef = useRef(null)

  const getColor = useCallback((zone: QueueStop) => {
    if (zone.violation_count > 0) return PRIORITY_COLORS.high
    if (zone.approaching_count > 0) return PRIORITY_COLORS.medium
    return PRIORITY_COLORS.clear
  }, [])

  return (
    <MapGL
      ref={mapRef}
      initialViewState={{
        latitude: DEFAULT_CENTER.lat,
        longitude: DEFAULT_CENTER.lng,
        zoom: DEFAULT_ZOOM,
      }}
      style={{ width: '100%', height: '100%' }}
      mapStyle={MAP_STYLE}
    >
      <NavigationControl position="bottom-right" showCompass={false} />

      {zones.map((zone) => {
        const color = getColor(zone)
        const hasViolations = zone.violation_count > 0
        const size = hasViolations ? 30 : 22
        return (
          <Marker
            key={zone.zone_id}
            latitude={zone.lat}
            longitude={zone.lng}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation()
              onMarkerTap(zone)
            }}
          >
            <svg
              aria-hidden="true"
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              style={{ cursor: 'pointer' }}
            >
              <circle cx={size / 2} cy={size / 2} r={size / 2} fill={color} />
              {hasViolations && (
                <text
                  x={size / 2}
                  y={size / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="white"
                  fontSize="12"
                  fontWeight="700"
                  fontFamily="system-ui, sans-serif"
                >
                  {zone.violation_count}
                </text>
              )}
            </svg>
          </Marker>
        )
      })}

      {officerLocation && (
        <Marker
          latitude={officerLocation.lat}
          longitude={officerLocation.lng}
          anchor="center"
        >
          <svg width="16" height="16" viewBox="0 0 16 16">
            <circle cx="8" cy="8" r="6" fill="#4285F4" stroke="white" strokeWidth="3" />
          </svg>
        </Marker>
      )}
    </MapGL>
  )
}
