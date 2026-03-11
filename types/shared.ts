/** Zone lifecycle status as an officer interacts with it */
export type ZoneStatus = 'idle' | 'on_scene'

/** Vehicle classification */
export type VehicleType = 'personal' | 'rideshare' | 'delivery' | 'commercial'

/** How close a vehicle is to exceeding its time limit */
export type OverstayStatus = 'ok' | 'approaching' | 'violation'

/** Vehicle enforcement actions */
export type EnforcementAction = 'cite' | 'warn' | 'skip'

/** Zone lifecycle actions */
export type ZoneAction = 'arrive' | 'depart'

/** All actions an officer can take (enforcement + zone + legacy) */
export type ActionType = EnforcementAction | ZoneAction | 'clear'
