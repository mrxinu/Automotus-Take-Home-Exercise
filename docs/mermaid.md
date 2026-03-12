# Automotus Go: End-to-End Architecture & Communication Flow

## API Endpoints

```mermaid
graph LR
    subgraph "GET (Read)"
        Q["GET /api/queue"] -->|"QueueStop[]"| R1["getQueue()<br/>Priority-sorted zones"]
        Z["GET /api/zones/:id"] -->|"{ zone, vehicles }"| R2["getZone() + getZoneVehicles()<br/>Zone + unactioned vehicles"]
        A["GET /api/activity"] -->|"ActivityEntry[]"| R3["getActivity()<br/>All actions, newest first"]
    end

    subgraph "POST (Write)"
        AR["POST /api/zones/:id/arrive"] -->|"{ zone, activity }"| R4["arriveAtZone()<br/>status → on_scene"]
        DE["POST /api/zones/:id/depart"] -->|"{ zone, activity }"| R5["departZone()<br/>status → idle"]
        EN["POST /api/zones/:id/vehicles/:vid/:action"] -->|"{ zone, vehicle, activity }"| R6["enforceVehicle()<br/>cite / warn / skip"]
        RE["POST /api/reset"] -->|"{ ok }"| R7["resetState()<br/>Reseed all data"]
    end
```

Every write endpoint is **atomic**: it mutates state + prepends an `ActivityEntry` to the log in a single call. The client never coordinates multiple requests per action.

All routes simulate 200–800ms network latency. Appending `?error=true` to any route returns a 500.

---

## High-Level System Overview

```mermaid
graph TB
    subgraph Browser ["Browser (Client)"]
        UI["UI Pages<br/>/map, /queue, /log"]
        RQ["TanStack React Query<br/>Cache + Mutations"]
        API_CLIENT["api-client.ts<br/>fetch wrapper"]
    end

    subgraph NextServer ["Next.js Server (Same Process)"]
        ROUTES["API Route Handlers<br/>app/api/**/route.ts"]
        STATE["mock-data/state.ts<br/>globalThis Singleton"]
        QUERIES["mock-data/queries.ts<br/>getQueue, getZone, getActivity"]
        ACTIONS["mock-data/actions.ts<br/>arriveAtZone, departZone, enforceVehicle"]
        PRIORITY["priority.ts<br/>computePriorityScore"]
    end

    UI -->|"useQuery / useMutation"| RQ
    RQ -->|"queryFn / mutationFn"| API_CLIENT
    API_CLIENT -->|"fetch(/api/...)"| ROUTES
    ROUTES -->|"read"| QUERIES
    ROUTES -->|"write"| ACTIONS
    QUERIES --> STATE
    ACTIONS --> STATE
    ACTIONS -->|"recompute scores"| PRIORITY
    ROUTES -->|"JSON Response"| API_CLIENT
    API_CLIENT -->|"Promise resolves"| RQ
    RQ -->|"re-render with data"| UI
```

---

## Mutation Flow (Optimistic Updates)

```mermaid
sequenceDiagram
    participant UI as VehicleCard
    participant Hook as useEnforceVehicle()
    participant RQ as React Query Cache
    participant Fetch as api-client.ts
    participant Route as API Route
    participant Actions as mock-data/actions.ts

    UI->>Hook: cite(zoneId, vehicleId)
    Hook->>RQ: onMutate — cancel zone queries, snapshot cache
    RQ->>RQ: optimistically filter vehicle from zone.vehicles
    RQ-->>UI: re-render (vehicle gone instantly)

    Hook->>Fetch: POST /zones/:id/vehicles/:vid/cite
    Fetch->>Route: fetch(...)
    Route->>Actions: enforceVehicle(zoneId, vid, 'cite')
    Actions->>Actions: mark vehicle.actioned = 'cite'
    Actions->>Actions: recount zone stats (vehicle_count, violation_count, approaching_count)
    Actions->>Actions: computePriorityScore() → update zone.priority_score
    Actions->>Actions: prepend ActivityEntry to log
    Actions-->>Route: { zone, vehicle, activity }
    Route-->>Fetch: 201 Created

    alt Success
        Fetch-->>Hook: resolved
        Hook->>RQ: onSettled → invalidate ['queue'], ['zone'], ['activity']
        RQ->>Fetch: refetch all three
    else Failure
        Fetch-->>Hook: rejected
        Hook->>RQ: onError — restore snapshot
        RQ-->>UI: re-render (vehicle reappears)
    end
```

---

## Data Layer: In-Memory Mock Store

```mermaid
classDiagram
    class MockState {
        InternalVehicle[] vehicles
        QueueStop[] zones
        ActivityEntry[] activityLog
    }
    class QueueStop {
        string id
        string zone_id
        string zone_name
        string address
        number lat, lng
        number priority_score
        number vehicle_count
        number violation_count
        number approaching_count
        number occupancy
        number max_capacity
        ZoneStatus status
        string[] vehicle_thumbnails
    }
    class InternalVehicle {
        string id
        string zone_id
        string license_plate
        VehicleType type
        string make, model, color
        string arrival_time
        number time_limit_minutes
        number overstay_minutes
        OverstayStatus overstay_status
        string image_url
        ActionType actioned
    }
    class ActivityEntry {
        string id
        string zone_id
        string zone_name
        ActionType action
        string timestamp
    }

    MockState "1" *-- "*" QueueStop
    MockState "1" *-- "*" InternalVehicle
    MockState "1" *-- "*" ActivityEntry
    QueueStop "1" o-- "*" InternalVehicle : zone_id
```

The entire store lives on `globalThis.__automotus_go_mock_state__` so it survives HMR in dev. `resetState()` replaces it with fresh seed data from `mock-data/seed.ts`.

### Type Enums

| Type | Values |
|------|--------|
| `ZoneStatus` | `idle`, `on_scene` |
| `VehicleType` | `personal`, `rideshare`, `delivery`, `commercial` |
| `OverstayStatus` | `ok`, `approaching`, `violation` |
| `EnforcementAction` | `cite`, `warn`, `skip` |
| `ZoneAction` | `arrive`, `depart` |
| `ActionType` | `EnforcementAction \| ZoneAction \| 'clear'` |

---

## Priority Scoring Pipeline

```mermaid
graph TD
    subgraph "Per Zone (on query + after every mutation)"
        V["Count unactioned vehicles by overstay_status"]
        OC["overstay_count<br/>(status = 'violation')"]
        VC["violation_count<br/>(status = 'approaching')"]
        OCC["occupancy<br/>(unactioned vehicle count)"]
        CAP["max_capacity<br/>(from zone seed data)"]
    end

    V --> OC
    V --> VC
    V --> OCC

    OC -->|"× 3"| SUM["priority_score =<br/>OC×3 + VC×2 + (OCC/CAP × 100) ÷ 100"]
    VC -->|"× 2"| SUM
    OCC --> PCT["occupancy_pct =<br/>OCC / CAP × 100"]
    CAP --> PCT
    PCT -->|"÷ 100"| SUM

    SUM --> LEVEL{Score threshold}
    LEVEL -->|"≥ 4.0"| HIGH["HIGH priority<br/>(red marker on map)"]
    LEVEL -->|"≥ 1.0"| MED["MEDIUM priority<br/>(amber marker on map)"]
    LEVEL -->|"< 1.0"| CLEAR["CLEAR<br/>(green marker on map)"]
```

The score is recomputed in `enforceVehicle()` after every cite/warn/skip — removing a violation vehicle drops the zone's score and re-sorts the queue.

---

## Component → Hook → API Mapping

```mermaid
graph LR
    subgraph Pages
        MAP["/map page"]
        QUEUE["/queue page"]
        LOG["/log page"]
    end

    subgraph Hooks
        UQ["useQueue()"]
        UZD["useZoneDetail(id)"]
        UA["useActivity()"]
        UAR["useArriveAtZone()"]
        UDE["useDepartZone()"]
        UEN["useEnforceVehicle()"]
        UOL["useOfficerLocation()"]
    end

    subgraph "API Routes"
        AQ["/api/queue"]
        AZ["/api/zones/:id"]
        AA["/api/activity"]
        AAR["/api/zones/:id/arrive"]
        ADE["/api/zones/:id/depart"]
        AEN["/api/zones/:id/vehicles/:vid/:action"]
    end

    MAP --> UQ
    MAP --> UZD
    MAP --> UAR
    MAP --> UDE
    MAP --> UEN
    MAP --> UOL
    QUEUE --> UQ
    QUEUE --> UZD
    QUEUE --> UAR
    QUEUE --> UDE
    QUEUE --> UEN
    QUEUE --> UOL
    LOG --> UA

    UQ --> AQ
    UZD --> AZ
    UA --> AA
    UAR --> AAR
    UDE --> ADE
    UEN --> AEN
```

---

## Request/Response Lifecycle

```mermaid
sequenceDiagram
    participant Page as React Page
    participant Hook as useQueue()
    participant RQ as React Query
    participant Fetch as api-client.ts
    participant Route as API Route Handler
    participant Queries as mock-data/queries.ts
    participant State as mock-data/state.ts

    Page->>Hook: render
    Hook->>RQ: useQuery({ queryKey: ['queue'], refetchInterval: 30_000 })
    RQ->>Fetch: queryFn → fetchQueue()
    Fetch->>Route: fetch('/api/queue')
    Route->>Queries: getQueue()
    Queries->>State: getState().zones
    State-->>Queries: QueueStop[]
    Queries-->>Route: sorted by priority_score DESC
    Route-->>Fetch: Response 200, JSON body
    Fetch-->>RQ: parsed data
    RQ-->>Hook: { data, isLoading, error }
    Hook-->>Page: render with data
```

---

## Error Simulation Flow

```mermaid
sequenceDiagram
    participant UI as Page Component
    participant RQ as React Query
    participant Fetch as api-client.ts
    participant Route as API Route

    Note over UI: User appends ?error=true to URL
    UI->>RQ: useQuery('queue')
    RQ->>Fetch: fetchQueue()
    Note over Fetch: Appends window.location.search to request
    Fetch->>Route: fetch('/api/queue?error=true')
    Route->>Route: if (error param) return 500
    Route-->>Fetch: 500 { error: "Simulated server error" }
    Fetch-->>RQ: throw Error
    RQ->>RQ: retry once (retry: 1)
    RQ-->>UI: { error, isError: true }
    UI->>UI: render ErrorState component
    Note over UI: "Try Again" button → queryClient.refetchQueries()
```

---

## Mock Data Architecture

```mermaid
graph TD
    subgraph "lib/mock-data/"
        SEED["seed.ts<br/>16 zones, ~50 vehicles<br/>Philadelphia / Rittenhouse Sq"]
        BUILDERS["builders.ts<br/>buildInitialState()<br/>computeOverstay()"]
        STATE["state.ts<br/>getState() / resetState()<br/>globalThis singleton"]
        QUERIES["queries.ts<br/>getQueue() getZone()<br/>getZoneVehicles() getActivity()"]
        ACTIONS["actions.ts<br/>arriveAtZone() departZone()<br/>enforceVehicle()"]
    end

    SEED -->|"zone + vehicle definitions"| BUILDERS
    BUILDERS -->|"MockState"| STATE
    STATE -->|"reads"| QUERIES
    STATE -->|"reads + writes"| ACTIONS
    ACTIONS -->|"recompute"| PRIORITY["priority.ts<br/>computePriorityScore()"]
```

- **seed.ts**: Raw zone/vehicle definitions for 16 Philadelphia intersections around Rittenhouse Square
- **builders.ts**: Constructs initial `MockState`, computes overstay status from arrival times
- **state.ts**: Singleton on `globalThis.__automotus_go_mock_state__` — survives HMR
- **queries.ts**: Pure reads — `getZoneVehicles()` filters out actioned vehicles before returning
- **actions.ts**: Mutations — each action marks vehicles, recounts zone stats, recomputes priority, logs activity
