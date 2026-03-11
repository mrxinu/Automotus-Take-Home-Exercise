import type {
  ZoneStatus,
  VehicleType,
  OverstayStatus,
  ActionType,
} from './shared'

/** A zone in the officer's queue, sorted by priority */
export interface QueueStop {
  id: string
  zone_id: string
  zone_name: string
  address: string
  lat: number
  lng: number
  priority_score: number
  vehicle_count: number
  violation_count: number
  approaching_count: number
  occupancy: number
  max_capacity: number
  status: ZoneStatus
  vehicle_thumbnails: string[]
}

/** A vehicle parked in a zone (API response — no internal state) */
export interface Vehicle {
  id: string
  zone_id: string
  license_plate: string
  type: VehicleType
  make: string
  model: string
  color: string
  arrival_time: string
  time_limit_minutes: number
  overstay_minutes: number
  overstay_status: OverstayStatus
  image_url: string
}

/** A single entry in the officer's activity log */
export interface ActivityEntry {
  id: string
  zone_id: string
  zone_name: string
  action: ActionType
  timestamp: string
}

/** Zone detail response including vehicles */
export interface ZoneDetail {
  zone: QueueStop
  vehicles: Vehicle[]
}
