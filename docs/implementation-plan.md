# Parking Enforcement Officer Companion App

## Overview

Mobile-first companion app for parking enforcement officers in Rittenhouse Square, Philadelphia. Three screens: **Map**, **Route**, **Log**. Officers see zones on a map, follow a priority-sorted route, tap into zones to view vehicles, take actions (Cite/Warn/Skip), and review their activity log.

**Location**: Rittenhouse Square area, Philadelphia — 16 real zones along Walnut, Sansom, Locust, Spruce, and cross streets 15th–19th.

---

## Viewport Strategy

**Mobile-first, 375px target.** This is an officer's phone app. No responsive breakpoints needed. Touch targets ≥ 44px, bottom navigation, bottom drawer — optimized for one-handed phone use.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS v4 (`@tailwindcss/postcss`) + SCSS Modules for layout |
| UI | shadcn/ui `base-nova` style |
| Maps | @vis.gl/react-google-maps (AdvancedMarker) |
| Server State | TanStack React Query v5 |
| Mock API | Next.js Route Handlers + in-memory DB (globalThis for HMR safety) |
| Car Images | Free car image API with local fallbacks |
| Font | DM Sans |
| Branding | Color palette derived from [automotus.ai](https://www.automotus.ai) |
| Zones | 15 real Philadelphia zones around Rittenhouse Square |

---

### Dependencies

```
@base-ui/react, @tanstack/react-query, @vis.gl/react-google-maps,
class-variance-authority, clsx, lucide-react, next@16, react@19, react-dom@19,
sass, shadcn, tailwind-merge, tw-animate-css, vaul
```

Dev: `@tailwindcss/postcss@4, tailwindcss@4, typescript@5, eslint, eslint-config-next`

---

## Folder Structure

```
app/
  layout.tsx            # DM Sans font, QueryProvider, Toaster
  page.tsx              # Redirect → /map
  globals.css           # (above)
  map/page.tsx          # Map screen
  queue/page.tsx        # Route screen
  log/page.tsx          # Log screen
  api/
    queue/route.ts
    activity/route.ts
    reset/route.ts
    zones/[id]/
      route.ts
      arrive/route.ts
      depart/route.ts
      vehicles/[vid]/[action]/route.ts

components/
  ui/                   # shadcn primitives (badge, button, card, drawer, skeleton)
  app-header.tsx        # Sticky dark header (all pages)
  bottom-nav.tsx        # Fixed bottom tab bar (all pages)
  error-state.tsx       # Error + retry
  map/map-view.tsx      # Google Maps + zone markers
  queue/queue-card.tsx  # Zone card in timeline
  queue/empty-queue.tsx
  zone/zone-detail-drawer.tsx  # Bottom sheet with vehicles
  zone/vehicle-card.tsx        # Vehicle card with actions
  log/activity-entry.tsx       # Single log entry

hooks/
  use-queue.ts          # useQuery → /api/queue
  use-zone-detail.ts    # useQuery → /api/zones/[id]
  use-activity.ts       # useQuery → /api/activity
  use-zone-actions.ts   # useMutation → arrive/depart/enforce
  use-officer-location.ts

lib/
  api-client.ts         # Centralized fetch (forwards ?error=true)
  mock-data.ts          # In-memory DB with seed data
  priority.ts           # Priority scoring
  car-image.ts          # Image URL builder
  utils.ts              # cn(), generateId, formatDuration, haversine
  query-provider.tsx    # QueryClient (staleTime 30s, retry 1)

types/index.ts          # All interfaces
```

---

## Types

```typescript
type ZoneStatus = 'idle' | 'on_scene'
type VehicleType = 'personal' | 'rideshare' | 'delivery' | 'commercial'
type OverstayStatus = 'ok' | 'approaching' | 'violation'
type EnforcementAction = 'cite' | 'warn' | 'skip'
type PriorityLevel = 'high' | 'medium' | 'clear'

interface QueueStop {
  id, zone_id, zone_name, address, lat, lng,
  priority_score, priority_level, vehicle_count,
  violation_count, approaching_count, occupancy, max_capacity,
  status: ZoneStatus, vehicle_thumbnails: string[]
}

interface Vehicle {
  id, zone_id, license_plate, type: VehicleType,
  make, model, color, arrival_time, time_limit_minutes,
  overstay_minutes, overstay_status: OverstayStatus,
  spot_label, image_url, actioned?: ActionType
}

interface ActivityEntry {
  id, zone_id, zone_name, vehicle_id?, license_plate?,
  vehicle_image?, action: ActionType, note?, timestamp
}

interface ZoneDetail { zone: QueueStop; vehicles: Vehicle[] }
```

---

## API Routes

All routes: 200–500ms simulated delay.

**Error simulation:** Append `?error=true` to any route for a 500 response.

| Route | Method | Response |
|-------|--------|----------|
| `/api/queue` | GET | `QueueStop[]` — sorted by priority_score desc |
| `/api/zones/[id]` | GET | `ZoneDetail { zone, vehicles }` |
| `/api/activity` | GET | `ActivityEntry[]` — newest first |
| `/api/zones/[id]/arrive` | POST | `{ zone, activity }` |
| `/api/zones/[id]/depart` | POST | `{ zone, activity }` |
| `/api/zones/[id]/vehicles/[vid]/[action]` | POST | `{ zone, vehicle, activity }` |
| `/api/reset` | POST | `{ ok, message }` |

---

## Mock Data

- 15 zones around Rittenhouse Square (real Philadelphia intersections)
- 2–6 vehicles per zone, randomized make/model/color/plate/overstay
- Priority score computed server-side:
  ```
  overstay_count * 3 + violation_count * 2 + (occupancy_pct / 100)
  ```

---

## Screen Designs (for frontend-design skill reference)

- Use `/frontend-design` and `/web-interface-guidelines` skills during implementation

### All Screens — Shared Layout

- **AppHeader**: Nav top bar, `#080808` dark background, white text. 
- **BottomNav**: Fixed bottom, white background, border-top. 3 tabs: MAP / ROUTE / LOG

### Screen 1: Map (`/map`)

- Google Maps fills the space between header and bottom nav
- Centered on Rittenhouse Square (39.9496, -75.1718), zoom 16
- Zone markers: colored pin SVGs — red (violations), amber (approaching), green (clear) — with white violation count number
- Officer location: blue pulsing dot at center of Rittenhouse Square
- Tap a marker → opens Zone Detail Drawer

### Screen 2: Route (`/queue`)

- **"Start Route" button**: Full-width, primary blue, Navigation icon + "Start Route" text. Opens Google Maps multi-stop directions.
- Vertical timeline UI with numbered stops, walk times, violation/warning counts

### Screen 3: Zone Detail Drawer (bottom sheet)

- Opens from Map or Route when tapping a zone
- Should present all the information an officer needs to make an enforcement decision at a glance: zone context (name, address, how full it is), and for each vehicle — what it looks like, its plate, how long it's been parked, whether it's in violation, and what type of vehicle it is
- **Action row**: Officer can mark arrival/departure at the zone, and navigate to it
- **Vehicle cards**: Each card gives the officer enough context to act — vehicle photo, plate, overstay duration, vehicle type — with clear Cite/Warn/Skip action buttons
- The drawer should feel like a field tool, not a dashboard — prioritize scannability and quick action over information density
- Empty state: "No vehicles in this zone right now."

### Screen 4: Log (`/log`)

- Reverse-chronological list of activity entries
- Each entry is a card/row containing all information relevant to an enforcement log: action taken (cite/warn/skip/arrive/depart), zone name, license plate, vehicle description, timestamp, and any officer notes
- Entries should read like a real enforcement log — an officer or supervisor reviewing the log should have full context for each action without needing to cross-reference other screens
- Empty state: ClipboardList icon + "No activity yet" + description text

### Error & Loading States

- `?error=true` query param triggers 500 errors from all API routes
- ErrorState component: AlertTriangle icon + message + "Try Again" button
- Loading: spinner component centered
- Empty: contextual message per screen

---

## Implementation Phases

1. **Scaffold**: Next.js project, install deps, `components.json`, `globals.css`, `postcss.config.mjs`, fonts, shadcn components, folder structure, QueryProvider
2. **Data Layer**: types, mock-data.ts, api-client.ts, all API routes, all React Query hooks
3. **Layout Shell**: AppHeader, BottomNav, page shells with nav working
4. **Route Screen**: timeline with QueueCards, Start Route button, thumbnails
5. **Map Screen**: Google Maps, zone pins, ZoneDetailDrawer, VehicleCard
6. **Log Screen**: activity entries, empty state
7. **Polish**: error/loading/empty states, `?error=true` support, reset button
