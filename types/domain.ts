import type { Vehicle, QueueStop, ActivityEntry } from './api'
import type { ActionType } from './shared'

/** Server-side vehicle with internal enforcement state */
export interface InternalVehicle extends Vehicle {
  actioned?: ActionType
}

/** In-memory mock database state */
export interface MockState {
  vehicles: InternalVehicle[]
  zones: QueueStop[]
  activityLog: ActivityEntry[]
}
