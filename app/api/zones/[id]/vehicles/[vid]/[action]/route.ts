import { NextRequest, NextResponse } from 'next/server'
import { enforceVehicle } from '@/lib/mock-data'

const VALID_ACTIONS = new Set(['cite', 'warn', 'skip'] as const)

/** POST /api/zones/[id]/vehicles/[vid]/[action] — Enforce a vehicle (cite, warn, skip) */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; vid: string; action: string }> }
) {
  await new Promise((r) => setTimeout(r, 200 + Math.random() * 300))

  if (request.nextUrl.searchParams.get('error') === 'true') {
    return NextResponse.json(
      { error: 'Simulated server error' },
      { status: 500 }
    )
  }

  const { id, vid, action } = await params

  if (!VALID_ACTIONS.has(action as 'cite' | 'warn' | 'skip')) {
    return NextResponse.json(
      { error: `Invalid action "${action}". Must be one of: cite, warn, skip` },
      { status: 400 }
    )
  }

  const result = enforceVehicle(id, vid, action as 'cite' | 'warn' | 'skip')

  if (!result) {
    return NextResponse.json({ error: 'Zone or vehicle not found' }, { status: 404 })
  }

  return NextResponse.json(result, { status: 201 })
}
