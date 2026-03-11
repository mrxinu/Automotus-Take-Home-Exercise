import { NextRequest, NextResponse } from 'next/server'
import { getQueue } from '@/lib/mock-data'

/** GET /api/queue — Returns zones sorted by priority score descending */
export async function GET(request: NextRequest) {
  await new Promise((r) => setTimeout(r, 300 + Math.random() * 500))

  if (request.nextUrl.searchParams.get('error') === 'true') {
    return NextResponse.json(
      { error: 'Simulated server error — use ?error=true to trigger this' },
      { status: 500 }
    )
  }

  const queue = getQueue()
  return NextResponse.json(queue)
}
