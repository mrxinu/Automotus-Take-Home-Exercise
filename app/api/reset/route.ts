import { NextResponse } from 'next/server'
import { resetState } from '@/lib/mock-data'

/** POST /api/reset — Reset all mock data to initial seed state */
export async function POST() {
  await new Promise((r) => setTimeout(r, 300 + Math.random() * 200))

  resetState()

  return NextResponse.json({ ok: true, message: 'Mock data reset to initial state' })
}
