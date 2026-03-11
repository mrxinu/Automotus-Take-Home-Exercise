'use client'

import { useRef, useCallback, useState } from 'react'
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
} from '@vis.gl/react-google-maps'
import type { QueueStop } from '@/types'
import { MapViewFallback } from './map-view-fallback'

interface MapViewProps {
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

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''
const GOOGLE_MAPS_MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? ''

function ZonePin({ color, count }: { color: string; count: number }) {
  const size = count > 0 ? 30 : 22
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ cursor: 'pointer' }}
    >
      <circle cx={size / 2} cy={size / 2} r={size / 2} fill={color} />
      {count > 0 && (
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
          {count}
        </text>
      )}
    </svg>
  )
}

function OfficerDot() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="6" fill="#4285F4" stroke="white" strokeWidth="3" />
    </svg>
  )
}

function GoogleMapView({ zones, onMarkerTap, officerLocation }: MapViewProps) {
  const getColor = useCallback((zone: QueueStop) => {
    if (zone.violation_count > 0) return PRIORITY_COLORS.high
    if (zone.approaching_count > 0) return PRIORITY_COLORS.medium
    return PRIORITY_COLORS.clear
  }, [])

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <GoogleMap
        defaultCenter={DEFAULT_CENTER}
        defaultZoom={DEFAULT_ZOOM}
        mapId={GOOGLE_MAPS_MAP_ID}
        gestureHandling="greedy"
        disableDefaultUI
        style={{ width: '100%', height: '100%' }}
      >
        {zones.map((zone) => (
          <AdvancedMarker
            key={zone.zone_id}
            position={{ lat: zone.lat, lng: zone.lng }}
            onClick={() => onMarkerTap(zone)}
          >
            <ZonePin color={getColor(zone)} count={zone.violation_count} />
          </AdvancedMarker>
        ))}

        {officerLocation && (
          <AdvancedMarker position={officerLocation}>
            <OfficerDot />
          </AdvancedMarker>
        )}
      </GoogleMap>
    </APIProvider>
  )
}

export function MapView(props: MapViewProps) {
  const [googleFailed, setGoogleFailed] = useState(!GOOGLE_MAPS_API_KEY)

  if (googleFailed) {
    return <MapViewFallback {...props} />
  }

  return (
    <ErrorBoundaryWrapper onError={() => setGoogleFailed(true)}>
      <GoogleMapView {...props} />
    </ErrorBoundaryWrapper>
  )
}

// Minimal error boundary to catch Google Maps load failures
import React from 'react'

class ErrorBoundaryWrapper extends React.Component<
  { children: React.ReactNode; onError: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onError: () => void }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch() {
    this.props.onError()
  }

  render() {
    if (this.state.hasError) return null
    return this.props.children
  }
}
