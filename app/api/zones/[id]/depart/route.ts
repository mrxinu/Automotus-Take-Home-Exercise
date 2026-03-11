import { NextRequest, NextResponse } from 'next/server'
import { departZone } from '@/lib/mock-data'

/** POST /api/zones/[id]/depart — Officer departs zone */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await new Promise((r) => setTimeout(r, 200 + Math.random() * 300))

  if (request.nextUrl.searchParams.get('error') === 'true') {
    return NextResponse.json(
      { error: 'Simulated server error' },
      { status: 500 }
    )
  }

  const { id } = await params
  const result = departZone(id)

  if (!result) {
    return NextResponse.json({ error: 'Zone not found' }, { status: 404 })
  }

  return NextResponse.json(result, { status: 201 })
}
