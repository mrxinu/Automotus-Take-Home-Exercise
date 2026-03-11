import type {
  QueueStop,
  Vehicle,
  ActivityEntry,
  ZoneStatus,
  VehicleType,
  OverstayStatus,
} from '@/types'
import { computePriorityScore, getPriorityLevel } from './priority'
import { generateId } from './utils'
import { getCarImageUrl } from './car-image'

// ---------------------------------------------------------------------------
// Seed zone definitions (28 zones from Philadelphia map)
// ---------------------------------------------------------------------------

interface ZoneSeed {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  maxCapacity: number
  vehicles: VehicleSeed[]
}

interface VehicleSeed {
  plate: string
  type: VehicleType
  make: string
  model: string
  color: string
  spot: string
  arrivalMinutesAgo: number
  timeLimitMinutes: number
}

const now = () => new Date().toISOString()

function minutesAgo(min: number): string {
  return new Date(Date.now() - min * 60000).toISOString()
}

function computeOverstay(arrivalMinutesAgo: number, timeLimitMinutes: number) {
  const overstay = arrivalMinutesAgo - timeLimitMinutes
  let status: OverstayStatus = 'ok'
  if (overstay > 0) status = 'violation'
  else if (overstay > -5) status = 'approaching'
  return { overstay_minutes: Math.max(0, overstay), overstay_status: status }
}

const ZONE_SEEDS: ZoneSeed[] = [
  // --- HIGH PRIORITY ZONES ---
  {
    id: 'zone-03', name: 'Chestnut & 18th (W)', address: '1800 Chestnut St (West)',
    lat: 39.9521, lng: -75.1718, maxCapacity: 10,
    vehicles: [
      { plate: 'KYZ-4821', type: 'personal', make: 'Kia', model: 'Forte', color: 'Silver', spot: 'A1', arrivalMinutesAgo: 95, timeLimitMinutes: 60 },
      { plate: 'MBR-7733', type: 'delivery', make: 'Mercedes', model: 'Sprinter', color: 'White', spot: 'A2', arrivalMinutesAgo: 80, timeLimitMinutes: 30 },
      { plate: 'LNP-5519', type: 'personal', make: 'Honda', model: 'CR-V', color: 'Blue', spot: 'A3', arrivalMinutesAgo: 70, timeLimitMinutes: 60 },
      { plate: 'RTX-9982', type: 'rideshare', make: 'Hyundai', model: 'Elantra', color: 'Black', spot: 'A4', arrivalMinutesAgo: 25, timeLimitMinutes: 15 },
    ],
  },
  {
    id: 'zone-04', name: 'Chestnut & 18th (E)', address: '1800 Chestnut St (East)',
    lat: 39.9520, lng: -75.1708, maxCapacity: 12,
    vehicles: [
      { plate: 'JWK-3301', type: 'commercial', make: 'Chevrolet', model: 'Express', color: 'White', spot: 'B1', arrivalMinutesAgo: 120, timeLimitMinutes: 45 },
      { plate: 'DFG-8842', type: 'personal', make: 'Nissan', model: 'Altima', color: 'Red', spot: 'B2', arrivalMinutesAgo: 85, timeLimitMinutes: 60 },
      { plate: 'VBN-2210', type: 'delivery', make: 'Mercedes', model: 'Sprinter', color: 'White', spot: 'B3', arrivalMinutesAgo: 50, timeLimitMinutes: 30 },
      { plate: 'PLK-6677', type: 'personal', make: 'Volkswagen', model: 'Jetta', color: 'Gray', spot: 'B4', arrivalMinutesAgo: 40, timeLimitMinutes: 60 },
      { plate: 'QRS-1148', type: 'rideshare', make: 'Toyota', model: 'Corolla', color: 'White', spot: 'B5', arrivalMinutesAgo: 22, timeLimitMinutes: 15 },
    ],
  },
  {
    id: 'zone-07', name: 'Sansom & 17th (W)', address: '1700 Sansom St (West)',
    lat: 39.9508, lng: -75.1698, maxCapacity: 10,
    vehicles: [
      { plate: 'TYU-5543', type: 'personal', make: 'BMW', model: '3 Series', color: 'Black', spot: 'C1', arrivalMinutesAgo: 100, timeLimitMinutes: 60 },
      { plate: 'WER-8891', type: 'delivery', make: 'Hyundai', model: 'Elantra', color: 'Black', spot: 'C2', arrivalMinutesAgo: 65, timeLimitMinutes: 30 },
      { plate: 'ASD-3320', type: 'personal', make: 'Ford', model: 'Focus', color: 'Blue', spot: 'C3', arrivalMinutesAgo: 55, timeLimitMinutes: 60 },
    ],
  },
  {
    id: 'zone-13', name: 'Sansom & 15th', address: '1500 Sansom St',
    lat: 39.9506, lng: -75.1658, maxCapacity: 10,
    vehicles: [
      { plate: 'HJK-2237', type: 'personal', make: 'Mazda', model: '3', color: 'Red', spot: 'E1', arrivalMinutesAgo: 88, timeLimitMinutes: 60 },
      { plate: 'NMB-6651', type: 'delivery', make: 'Honda', model: 'CR-V', color: 'Blue', spot: 'E2', arrivalMinutesAgo: 42, timeLimitMinutes: 30 },
      { plate: 'OIU-3384', type: 'personal', make: 'Volkswagen', model: 'Jetta', color: 'Gray', spot: 'E3', arrivalMinutesAgo: 68, timeLimitMinutes: 60 },
      { plate: 'YTR-7790', type: 'commercial', make: 'Audi', model: 'A4', color: 'Black', spot: 'E4', arrivalMinutesAgo: 55, timeLimitMinutes: 45 },
    ],
  },
  {
    id: 'zone-15', name: 'Rittenhouse NE', address: 'S 17th & Walnut (NE of Square)',
    lat: 39.9496, lng: -75.1700, maxCapacity: 12,
    vehicles: [
      { plate: 'EWQ-1123', type: 'personal', make: 'Audi', model: 'A4', color: 'Black', spot: 'F1', arrivalMinutesAgo: 92, timeLimitMinutes: 60 },
      { plate: 'POI-8845', type: 'rideshare', make: 'Toyota', model: 'Corolla', color: 'White', spot: 'F2', arrivalMinutesAgo: 25, timeLimitMinutes: 15 },
      { plate: 'ZXC-5567', type: 'delivery', make: 'Chevrolet', model: 'Express', color: 'White', spot: 'F3', arrivalMinutesAgo: 48, timeLimitMinutes: 30 },
      { plate: 'MNB-9903', type: 'personal', make: 'Lexus', model: 'ES', color: 'Silver', spot: 'F4', arrivalMinutesAgo: 70, timeLimitMinutes: 60 },
    ],
  },
  {
    id: 'zone-18', name: 'Broad & Sansom', address: 'S Broad St & Sansom St',
    lat: 39.9506, lng: -75.1648, maxCapacity: 14,
    vehicles: [
      { plate: 'GHJ-4478', type: 'commercial', make: 'Mazda', model: '3', color: 'Red', spot: 'G1', arrivalMinutesAgo: 110, timeLimitMinutes: 45 },
      { plate: 'KLM-2256', type: 'personal', make: 'Honda', model: 'CR-V', color: 'Blue', spot: 'G2', arrivalMinutesAgo: 78, timeLimitMinutes: 60 },
      { plate: 'BVC-7712', type: 'delivery', make: 'Mercedes', model: 'Sprinter', color: 'White', spot: 'G3', arrivalMinutesAgo: 55, timeLimitMinutes: 30 },
      { plate: 'XSW-3390', type: 'personal', make: 'BMW', model: '3 Series', color: 'Black', spot: 'G4', arrivalMinutesAgo: 35, timeLimitMinutes: 60 },
    ],
  },
  {
    id: 'zone-19', name: 'Broad & Walnut', address: 'S Broad St & Walnut St',
    lat: 39.9490, lng: -75.1648, maxCapacity: 15,
    vehicles: [
      { plate: 'QAZ-5534', type: 'personal', make: 'Lexus', model: 'ES', color: 'Silver', spot: 'H1', arrivalMinutesAgo: 105, timeLimitMinutes: 60 },
      { plate: 'WSX-8867', type: 'rideshare', make: 'Hyundai', model: 'Elantra', color: 'Black', spot: 'H2', arrivalMinutesAgo: 28, timeLimitMinutes: 15 },
      { plate: 'EDC-1143', type: 'delivery', make: 'Mazda', model: '3', color: 'Red', spot: 'H3', arrivalMinutesAgo: 62, timeLimitMinutes: 30 },
      { plate: 'RFV-6679', type: 'commercial', make: 'Nissan', model: 'Altima', color: 'Red', spot: 'H4', arrivalMinutesAgo: 58, timeLimitMinutes: 45 },
      { plate: 'TGB-2201', type: 'personal', make: 'Volkswagen', model: 'Jetta', color: 'Gray', spot: 'H5', arrivalMinutesAgo: 72, timeLimitMinutes: 60 },
    ],
  },
  // --- MEDIUM PRIORITY ZONES ---
  {
    id: 'zone-02', name: 'Chestnut & 19th (S)', address: '1900 Chestnut St (South)',
    lat: 39.9518, lng: -75.1728, maxCapacity: 8,
    vehicles: [
      { plate: 'BGT-3345', type: 'personal', make: 'BMW', model: '3 Series', color: 'Black', spot: 'K1', arrivalMinutesAgo: 57, timeLimitMinutes: 60 },
      { plate: 'FRD-7718', type: 'delivery', make: 'Honda', model: 'CR-V', color: 'Blue', spot: 'K2', arrivalMinutesAgo: 27, timeLimitMinutes: 30 },
      { plate: 'VHJ-2290', type: 'personal', make: 'Mazda', model: '3', color: 'Red', spot: 'K3', arrivalMinutesAgo: 48, timeLimitMinutes: 60 },
    ],
  },
  {
    id: 'zone-06', name: 'Sansom & 18th', address: '1800 Sansom St',
    lat: 39.9509, lng: -75.1712, maxCapacity: 8,
    vehicles: [
      { plate: 'KHG-6634', type: 'personal', make: 'Nissan', model: 'Altima', color: 'Red', spot: 'L1', arrivalMinutesAgo: 58, timeLimitMinutes: 60 },
      { plate: 'PLO-1187', type: 'rideshare', make: 'Kia', model: 'Forte', color: 'Silver', spot: 'L2', arrivalMinutesAgo: 13, timeLimitMinutes: 15 },
      { plate: 'WQE-5540', type: 'commercial', make: 'BMW', model: '3 Series', color: 'Black', spot: 'L3', arrivalMinutesAgo: 42, timeLimitMinutes: 45 },
    ],
  },
  {
    id: 'zone-09', name: 'Chestnut & 17th', address: '1700 Chestnut St',
    lat: 39.9520, lng: -75.1695, maxCapacity: 10,
    vehicles: [
      { plate: 'RST-8873', type: 'personal', make: 'Volkswagen', model: 'Jetta', color: 'Gray', spot: 'M1', arrivalMinutesAgo: 56, timeLimitMinutes: 60 },
      { plate: 'UVW-4406', type: 'delivery', make: 'Mazda', model: '3', color: 'Red', spot: 'M2', arrivalMinutesAgo: 28, timeLimitMinutes: 30 },
      { plate: 'XYZ-1139', type: 'personal', make: 'Kia', model: 'Forte', color: 'Silver', spot: 'M3', arrivalMinutesAgo: 50, timeLimitMinutes: 60 },
    ],
  },
  {
    id: 'zone-12', name: 'Sansom & 16th', address: '1600 Sansom St',
    lat: 39.9507, lng: -75.1675, maxCapacity: 8,
    vehicles: [
      { plate: 'ABC-6672', type: 'personal', make: 'Lexus', model: 'ES', color: 'Silver', spot: 'N1', arrivalMinutesAgo: 57, timeLimitMinutes: 60 },
      { plate: 'DEF-3305', type: 'commercial', make: 'Hyundai', model: 'Elantra', color: 'Black', spot: 'N2', arrivalMinutesAgo: 43, timeLimitMinutes: 45 },
    ],
  },
  {
    id: 'zone-14', name: 'Rittenhouse NW', address: 'S 18th & Walnut (NW of Square)',
    lat: 39.9496, lng: -75.1718, maxCapacity: 8,
    vehicles: [
      { plate: 'GHI-9938', type: 'personal', make: 'Lexus', model: 'ES', color: 'Silver', spot: 'O1', arrivalMinutesAgo: 56, timeLimitMinutes: 60 },
      { plate: 'JKL-2261', type: 'delivery', make: 'Mercedes', model: 'Sprinter', color: 'White', spot: 'O2', arrivalMinutesAgo: 26, timeLimitMinutes: 30 },
      { plate: 'MNO-5594', type: 'rideshare', make: 'Honda', model: 'CR-V', color: 'Blue', spot: 'O3', arrivalMinutesAgo: 12, timeLimitMinutes: 15 },
    ],
  },
  {
    id: 'zone-16', name: '17th & Walnut', address: 'S 17th St & Walnut St',
    lat: 39.9492, lng: -75.1695, maxCapacity: 10,
    vehicles: [
      { plate: 'PQR-8827', type: 'personal', make: 'Volkswagen', model: 'Jetta', color: 'Gray', spot: 'P1', arrivalMinutesAgo: 55, timeLimitMinutes: 60 },
      { plate: 'STU-1160', type: 'delivery', make: 'Ford', model: 'Focus', color: 'Blue', spot: 'P2', arrivalMinutesAgo: 27, timeLimitMinutes: 30 },
      { plate: 'VWX-4493', type: 'personal', make: 'Honda', model: 'CR-V', color: 'Blue', spot: 'P3', arrivalMinutesAgo: 45, timeLimitMinutes: 60 },
    ],
  },
  // --- CLEAR ZONES ---
  {
    id: 'zone-01', name: 'Chestnut & 19th (N)', address: '1900 Chestnut St (North)',
    lat: 39.9522, lng: -75.1730, maxCapacity: 6,
    vehicles: [
      { plate: 'WXY-4490', type: 'personal', make: 'Mazda', model: '3', color: 'Red', spot: 'T1', arrivalMinutesAgo: 15, timeLimitMinutes: 60 },
      { plate: 'ZAB-7723', type: 'delivery', make: 'Lexus', model: 'ES', color: 'Silver', spot: 'T2', arrivalMinutesAgo: 10, timeLimitMinutes: 30 },
    ],
  },
  {
    id: 'zone-05', name: 'Sansom & 19th', address: '1900 Sansom St',
    lat: 39.9510, lng: -75.1728, maxCapacity: 6,
    vehicles: [
      { plate: 'CDE-1156', type: 'personal', make: 'Audi', model: 'A4', color: 'Black', spot: 'U1', arrivalMinutesAgo: 20, timeLimitMinutes: 60 },
      { plate: 'FGH-4489', type: 'rideshare', make: 'Toyota', model: 'Corolla', color: 'White', spot: 'U2', arrivalMinutesAgo: 5, timeLimitMinutes: 15 },
    ],
  },
]

// ---------------------------------------------------------------------------
// Mutable in-memory state (reset on server restart)
// Attached to globalThis so state survives HMR / module re-evaluation in dev
// ---------------------------------------------------------------------------

interface MockState {
  vehicles: Vehicle[]
  zones: QueueStop[]
  activityLog: ActivityEntry[]
}

const GLOBAL_KEY = '__parkpatrol_mock_state__' as const

function buildVehicles(): Vehicle[] {
  const result: Vehicle[] = []
  for (const zone of ZONE_SEEDS) {
    for (const v of zone.vehicles) {
      const { overstay_minutes, overstay_status } = computeOverstay(v.arrivalMinutesAgo, v.timeLimitMinutes)
      result.push({
        id: `veh-${v.plate.toLowerCase().replace(/-/g, '')}`,
        zone_id: zone.id,
        license_plate: v.plate,
        type: v.type,
        make: v.make,
        model: v.model,
        color: v.color,
        arrival_time: minutesAgo(v.arrivalMinutesAgo),
        time_limit_minutes: v.timeLimitMinutes,
        overstay_minutes,
        overstay_status,
        spot_label: v.spot,
        image_url: getCarImageUrl(v.make, v.model, v.color),
      })
    }
  }
  return result
}

function buildZones(vehicleList: Vehicle[]): QueueStop[] {
  return ZONE_SEEDS.map((zone) => {
    const zoneVehicles = vehicleList.filter((v) => v.zone_id === zone.id)
    const overstayCount = zoneVehicles.filter((v) => v.overstay_status === 'violation').length
    const approachingCount = zoneVehicles.filter((v) => v.overstay_status === 'approaching').length
    const violationCount = overstayCount
    const occupancy = zoneVehicles.length
    const score = computePriorityScore(overstayCount, violationCount, occupancy, zone.maxCapacity)
    return {
      id: zone.id,
      zone_id: zone.id,
      zone_name: zone.name,
      address: zone.address,
      lat: zone.lat,
      lng: zone.lng,
      priority_score: Math.round(score * 100) / 100,
      priority_level: getPriorityLevel(score),
      vehicle_count: occupancy,
      overstay_count: overstayCount,
      violation_count: violationCount,
      approaching_count: approachingCount,
      occupancy,
      max_capacity: zone.maxCapacity,
      status: 'idle' as ZoneStatus,
      vehicle_thumbnails: zoneVehicles
        .filter((v) => v.overstay_status === 'violation')
        .map((v) => v.image_url)
        .filter(Boolean),
    }
  })
}

function createFreshState(): MockState {
  const vehicles = buildVehicles()
  return {
    vehicles,
    zones: buildZones(vehicles),
    activityLog: [],
  }
}

/** Returns the singleton mock state, creating it on first access */
function getState(): MockState {
  const g = globalThis as unknown as Record<string, MockState | undefined>
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = createFreshState()
  }
  return g[GLOBAL_KEY]!
}

// ---------------------------------------------------------------------------
// Public API for route handlers
// ---------------------------------------------------------------------------

/** Get all zones sorted by priority score descending */
export function getQueue(): QueueStop[] {
  const { zones } = getState()
  return [...zones].sort((a, b) => b.priority_score - a.priority_score)
}

/** Get a single zone by ID */
export function getZone(zoneId: string): QueueStop | undefined {
  const { zones } = getState()
  return zones.find((z) => z.zone_id === zoneId)
}

/** Get vehicles for a zone */
export function getZoneVehicles(zoneId: string): Vehicle[] {
  const { vehicles } = getState()
  return vehicles.filter((v) => v.zone_id === zoneId && !v.actioned)
}

/** Arrive at a zone — sets status to on_scene, logs activity */
export function arriveAtZone(zoneId: string): { zone: QueueStop; activity: ActivityEntry } | undefined {
  const { zones, activityLog } = getState()
  const zone = zones.find((z) => z.zone_id === zoneId)
  if (!zone) return undefined
  zone.status = 'on_scene'
  const entry: ActivityEntry = {
    id: generateId(),
    zone_id: zoneId,
    zone_name: zone.zone_name,
    action: 'arrive',
    timestamp: now(),
  }
  activityLog.unshift(entry)
  return { zone, activity: entry }
}

/** Depart from a zone — sets status back to idle, logs activity */
export function departZone(zoneId: string): { zone: QueueStop; activity: ActivityEntry } | undefined {
  const { zones, activityLog } = getState()
  const zone = zones.find((z) => z.zone_id === zoneId)
  if (!zone) return undefined
  zone.status = 'idle'
  const entry: ActivityEntry = {
    id: generateId(),
    zone_id: zoneId,
    zone_name: zone.zone_name,
    action: 'depart',
    timestamp: now(),
  }
  activityLog.unshift(entry)
  return { zone, activity: entry }
}

/** Take enforcement action on a vehicle — marks vehicle, recalculates zone, logs activity */
export function enforceVehicle(
  zoneId: string,
  vehicleId: string,
  action: 'cite' | 'warn' | 'skip',
  note?: string
): { zone: QueueStop; vehicle: Vehicle; activity: ActivityEntry } | undefined {
  const { zones, vehicles, activityLog } = getState()
  const zone = zones.find((z) => z.zone_id === zoneId)
  if (!zone) return undefined
  const vehicle = vehicles.find((v) => v.id === vehicleId && v.zone_id === zoneId)
  if (!vehicle) return undefined

  vehicle.actioned = action

  // Recompute zone stats
  const zoneVehicles = vehicles.filter((v) => v.zone_id === zoneId && !v.actioned)
  zone.vehicle_count = zoneVehicles.length
  zone.overstay_count = zoneVehicles.filter((v) => v.overstay_status === 'violation').length
  zone.violation_count = zone.overstay_count
  zone.approaching_count = zoneVehicles.filter((v) => v.overstay_status === 'approaching').length
  zone.occupancy = zoneVehicles.length
  zone.priority_score = Math.round(
    computePriorityScore(zone.overstay_count, zone.violation_count, zone.occupancy, zone.max_capacity) * 100
  ) / 100
  zone.priority_level = getPriorityLevel(zone.priority_score)
  zone.vehicle_thumbnails = zoneVehicles
    .filter((v) => v.overstay_status === 'violation')
    .map((v) => v.image_url)
    .filter(Boolean)

  const entry: ActivityEntry = {
    id: generateId(),
    zone_id: zoneId,
    zone_name: zone.zone_name,
    vehicle_id: vehicleId,
    license_plate: vehicle.license_plate,
    vehicle_image: vehicle.image_url,
    action,
    note,
    timestamp: now(),
  }
  activityLog.unshift(entry)

  const { actioned: _, ...publicVehicle } = vehicle
  return { zone, vehicle: publicVehicle as Vehicle, activity: entry }
}

/** Get all activity entries, most recent first */
export function getActivity(): ActivityEntry[] {
  const { activityLog } = getState()
  return [...activityLog]
}

/** Reset state to initial seed data (useful for testing) */
export function resetState(): void {
  const g = globalThis as unknown as Record<string, MockState | undefined>
  g[GLOBAL_KEY] = createFreshState()
}
