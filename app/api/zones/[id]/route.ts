import { NextRequest, NextResponse } from 'next/server'
import { getZone, getZoneVehicles } from '@/lib/mock-data'

/** GET /api/zones/[id] — Returns zone detail with vehicles */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await new Promise((r) => setTimeout(r, 200 + Math.random() * 400))

  if (request.nextUrl.searchParams.get('error') === 'true') {
    return NextResponse.json(
      { error: 'Simulated server error' },
      { status: 500 }
    )
  }

  const { id } = await params
  const zone = getZone(id)

  if (!zone) {
    return NextResponse.json({ error: 'Zone not found' }, { status: 404 })
  }

  const vehicles = getZoneVehicles(id)

  return NextResponse.json({ zone, vehicles })
}
