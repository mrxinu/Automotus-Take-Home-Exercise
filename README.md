# Automotus Go — Parking Enforcement Officer Companion App

A mobile-first prototype that modernizes the parking enforcement officer workflow. Officers can see a priority-sorted queue of zones, view zone details with vehicle overstay timers, take actions (cite, warn, skip), and review their shift activity — all from a single app.

Built for the Automotus take-home exercise.

| Map View | Zone Queue | Zone Detail | Activity Log |
|----------|-----------|-------------|--------------|
| ![Map](docs/screenshots/map.png) | ![Queue](docs/screenshots/queue.png) | ![Drawer](docs/screenshots/drawer.png) | ![Log](docs/screenshots/log.png) |

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev

# 3. Open in browser (use mobile viewport for best experience)
# http://localhost:3000
```

> No API keys required. The Map view uses [MapLibre GL JS](https://maplibre.org/) with free [OpenFreeMap](https://openfreemap.org/) vector tiles as a fallback so you don't need a Google Maps API key. The app looks best on Google Maps, which I'll demo with live.

---

## Tech Stack

| Tool | Why |
|------|-----|
| **Next.js 16** (App Router) | API routes as mock backend, file-based routing |
| **TypeScript** (strict) | Compile-time safety across the stack |
| **SCSS Modules** | Scoped component styles with nested semantic class names |
| **shadcn/ui** | Drawer, Button, Card, Skeleton, Badge (only place Tailwind is used) |
| **TanStack React Query v5** | Fetching, caching, optimistic updates, loading/error states |
| **Google Maps** (`@vis.gl/react-google-maps`) | Primary map with AdvancedMarker pins; MapLibre GL JS fallback (no API key needed) |

---

## Features

### Zone Queue (default view)
Priority-sorted list of 16 Philadelphia zones. Each card shows zone name, violation count, occupancy, and status badge. Tap a card to open the zone detail drawer.

### Map View
Google Maps centered on the Rittenhouse Square area with color-coded zone markers (red = high priority, yellow = medium, green = clear). Tap a marker to open the same zone detail drawer. Falls back to MapLibre GL with OpenFreeMap tiles when no Google Maps API key is set.

### Zone Detail Drawer
Bottom sheet showing zone header, vehicle list with overstay timers, and per-vehicle actions (Cite / Warn / Skip). **On My Way** button claims the zone (disables after tap so no other officer overlaps). Navigate button opens turn-by-turn directions.

### Activity Log
Reverse-chronological log of all officer actions taken during the session. Each entry shows action icon, zone name, vehicle plate, and relative timestamp.

---

## API Routes

All routes live in `/app/api`. Mock backend with `globalThis` singleton state and simulated network delay (200–500ms). Each action endpoint is atomic — it mutates state and logs activity in a single call. All POST endpoints return `201 Created`.

### Read Endpoints

| Method | Path | Response | Description |
|--------|------|----------|-------------|
| GET | `/api/queue` | `QueueStop[]` | Priority-sorted zone queue |
| GET | `/api/zones/[id]` | `{ zone, vehicles }` | Zone detail with vehicles |
| GET | `/api/activity` | `ActivityEntry[]` | Activity log (newest first) |

### Zone Action Endpoints

| Method | Path | Response | Description |
|--------|------|----------|-------------|
| POST | `/api/zones/[id]/arrive` | `{ zone, activity }` | Officer claims zone (On My Way) — status becomes `on_scene` |
| POST | `/api/zones/[id]/depart` | `{ zone, activity }` | Officer departs — status becomes `idle` |

### Vehicle Enforcement Endpoints

| Method | Path | Response | Description |
|--------|------|----------|-------------|
| POST | `/api/zones/[id]/vehicles/[vid]/[action]` | `{ zone, vehicle, activity }` | Enforce a vehicle (`cite`, `warn`, or `skip`) |

A single dynamic route validates the `[action]` segment. Invalid actions return `400` with a descriptive error message.

### Utility

| Method | Path | Response | Description |
|--------|------|----------|-------------|
| POST | `/api/reset` | `{ ok, message }` | Reset all mock data to seed state |

### Response Examples

**POST /api/zones/zone-03/vehicles/veh-kyz4821/cite**
```json
{
  "zone": {
    "zone_id": "zone-03",
    "zone_name": "Chestnut & 18th (W)",
    "violation_count": 3,
    "status": "on_scene"
  },
  "vehicle": {
    "id": "veh-kyz4821",
    "license_plate": "KYZ-4821",
    "overstay_status": "violation"
  },
  "activity": {
    "id": "act-abc123",
    "action": "cite",
    "zone_name": "Chestnut & 18th (W)",
    "timestamp": "2026-03-12T14:32:00.000Z"
  }
}
```

**POST /api/zones/zone-03/arrive** (Officer taps "On My Way")
```json
{
  "zone": {
    "zone_id": "zone-03",
    "zone_name": "Chestnut & 18th (W)",
    "status": "on_scene"
  },
  "activity": {
    "id": "act-def456",
    "action": "depart",
    "zone_name": "Chestnut & 18th (W)",
    "timestamp": "2026-03-12T14:35:00.000Z"
  }
}
```

---

## Error Simulation

Append `?error=true` to the page URL to trigger 500 errors from **all** API routes. The `api-client.ts` fetch wrapper forwards the page's query string to every request automatically.

```
http://localhost:3000/queue?error=true     → all API calls return 500
http://localhost:3000/map?error=true       → map fails to load zones
http://localhost:3000/log?error=true       → activity log fails
```

The UI shows an `ErrorState` component with a "Try Again" button on any failure.

Invalid enforcement actions return 400:
```
POST /api/zones/zone-03/vehicles/veh-kyz4821/banana → 400 { error: "Invalid action..." }
```

---

## State Handling

Every screen handles all three states:

| State | Queue | Map | Log |
|-------|-------|-----|-----|
| **Loading** | Spinner + "Loading zones..." | Spinner + "Loading map..." | Spinner + "Loading activity..." |
| **Error** | ErrorState + retry button | ErrorState + retry button | ErrorState + retry button |
| **Empty** | "All zones clear" + CheckCircle | "No zones to display" | "No activity yet" + ClipboardList |

---

## Demo Walkthrough

1. **Queue page loads** with 16 zones sorted by enforcement priority
2. **Tap a high-priority zone** — drawer opens showing vehicles with overstay timers
3. **Cite a vehicle** — vehicle disappears instantly (optimistic), violation count drops, queue re-sorts
4. **Tap "On My Way"** — zone is claimed (button disables), logged as "Departed" in the activity log
6. **Switch to Activity Log** — all actions from this session appear
7. **Switch to Map** — colored markers show zone priorities, tap any marker for details
8. **Add `?error=true`** to the URL — error state with "Try Again" button

All state changes persist in memory for the duration of the dev server session.

---

## Project Structure

```
app/
  page.tsx                    # Redirects to /queue
  queue/page.tsx              # Zone queue list
  map/page.tsx                # MapLibre GL map view
  log/page.tsx                # Activity log
  api/
    queue/route.ts            # GET sorted zones
    zones/[id]/route.ts       # GET zone detail
    zones/[id]/arrive/route.ts # POST officer claims zone (On My Way)
    zones/[id]/depart/route.ts # POST officer departs
    zones/[id]/vehicles/[vid]/[action]/route.ts  # POST cite/warn/skip
    activity/route.ts         # GET activity log
    reset/route.ts            # POST reset mock data

components/
  ui/                         # shadcn primitives (Button, Skeleton, Badge, Drawer)
  queue/                      # QueueCard, EmptyQueue
  zone/                       # ZoneDetailDrawer, VehicleCard
  map/                        # MapView
  log/                        # ActivityEntryCard
  app-header.tsx              # Sticky header with reset button
  bottom-nav.tsx              # Fixed bottom nav (Map / Queue / Log)
  error-state.tsx             # Reusable error display with retry

hooks/
  use-queue.ts                # Fetch priority-sorted queue (30s refetch)
  use-zone-detail.ts          # Fetch zone + vehicles on demand
  use-activity.ts             # Fetch activity log
  use-zone-actions.ts         # Mutations with optimistic updates
  use-officer-location.ts     # Browser geolocation with Philly fallback

lib/
  api-client.ts               # Centralized fetch wrapper
  mock-data/                  # In-memory DB (seed, state, queries, actions, builders)
  priority.ts                 # Scoring formula + priority level mapping
  query-provider.tsx          # React Query config (staleTime 30s, retry 1, gcTime 0)
  utils.ts                    # Formatting helpers

types/
  shared.ts                   # Base type aliases (enums)
  api.ts                      # API response interfaces (client-facing DTOs)
  domain.ts                   # Server-only internal types
  index.ts                    # Re-exports
```
