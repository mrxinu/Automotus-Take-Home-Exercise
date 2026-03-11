'use client'

import { useState, useEffect } from 'react'

interface LatLng {
  lat: number
  lng: number
}

// Spoofed location: Philadelphia Parking Authority office on S Juniper St
const FALLBACK_LOCATION: LatLng = { lat: 39.9515, lng: -75.1635 }

/**
 * Tries the browser Geolocation API, falls back to a spoofed location
 * near the enforcement zone cluster for demo purposes.
 */
export function useOfficerLocation() {
  const [location, setLocation] = useState<LatLng>(FALLBACK_LOCATION)
  const [isReal, setIsReal] = useState(false)

  useEffect(() => {
    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setIsReal(true)
      },
      () => {
        // Permission denied or error — keep fallback
      },
      { enableHighAccuracy: true, timeout: 5000 }
    )
  }, [])

  return { location, isReal }
}
