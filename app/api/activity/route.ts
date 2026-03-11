import { NextRequest, NextResponse } from 'next/server'
import { getActivity } from '@/lib/mock-data'

/** GET /api/activity — Returns activity log, most recent first */
export async function GET(request: NextRequest) {
  await new Promise((r) => setTimeout(r, 200 + Math.random() * 400))

  if (request.nextUrl.searchParams.get('error') === 'true') {
    return NextResponse.json(
      { error: 'Simulated server error' },
      { status: 500 }
    )
  }

  return NextResponse.json(getActivity())
}
