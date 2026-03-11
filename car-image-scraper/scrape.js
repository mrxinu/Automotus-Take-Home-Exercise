/**
 * Vehicle Image Scraper for ParkPatrol
 *
 * Fetches side-view images of the 40 vehicle types used in mock data.
 * Images are scraped from Bing Image Search and saved locally so the
 * app can display realistic vehicle photos without an external API.
 *
 * Usage:  npm run scrape
 * Output: ./images/<make>-<model>-<color>.jpg  →  copied to ../public/cars/
 *         Generates ../lib/car-image.ts with a lookup map
 */

import { chromium } from 'playwright'
import { writeFile, mkdir, readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

// ── Fleet definition ────────────────────────────────────────────────
// Each entry matches a vehicle that can appear in the mock database.
// Color is baked in so we get consistent, recognizable thumbnails.

const FLEET = [
  { make: 'Honda',      model: 'Civic',      color: 'Silver' },
  { make: 'Ford',       model: 'Transit',    color: 'White'  },
  { make: 'Toyota',     model: 'Camry',      color: 'Blue'   },
  { make: 'Hyundai',    model: 'Elantra',    color: 'Black'  },
  { make: 'Chevrolet',  model: 'Express',    color: 'White'  },
  { make: 'Nissan',     model: 'Altima',     color: 'Red'    },
  { make: 'Mercedes',   model: 'Sprinter',   color: 'White'  },
  { make: 'Subaru',     model: 'Outback',    color: 'Green'  },
  { make: 'BMW',        model: '3 Series',   color: 'Black'  },
  { make: 'Ram',        model: 'ProMaster',  color: 'White'  },
  { make: 'Ford',       model: 'Focus',      color: 'Blue'   },
  { make: 'Kia',        model: 'Forte',      color: 'Silver' },
  { make: 'Honda',      model: 'Accord',     color: 'White'  },
  { make: 'Mazda',      model: '3',          color: 'Red'    },
  { make: 'Volkswagen', model: 'Jetta',      color: 'Gray'   },
  { make: 'Audi',       model: 'A4',         color: 'Black'  },
  { make: 'Toyota',     model: 'Corolla',    color: 'White'  },
  { make: 'Lexus',      model: 'ES',         color: 'Silver' },
  { make: 'Honda',      model: 'CR-V',       color: 'Blue'   },
  { make: 'Chevrolet',  model: 'Malibu',     color: 'Black'  },
  { make: 'Tesla',      model: 'Model 3',    color: 'White'  },
  { make: 'Hyundai',    model: 'Sonata',     color: 'Silver' },
  { make: 'Dodge',      model: 'Charger',    color: 'Black'  },
  { make: 'Toyota',     model: 'RAV4',       color: 'Silver' },
  { make: 'Subaru',     model: 'Impreza',    color: 'Blue'   },
  { make: 'Jeep',       model: 'Cherokee',   color: 'White'  },
  { make: 'GMC',        model: 'Sierra',     color: 'Black'  },
  { make: 'Ford',       model: 'Escape',     color: 'Silver' },
  { make: 'Chevrolet',  model: 'Equinox',    color: 'Gray'   },
  { make: 'Nissan',     model: 'Sentra',     color: 'White'  },
  { make: 'Kia',        model: 'Optima',     color: 'Blue'   },
  { make: 'Toyota',     model: 'Highlander', color: 'Black'  },
  { make: 'Honda',      model: 'Fit',        color: 'Red'    },
  { make: 'Mazda',      model: 'CX-5',       color: 'White'  },
  { make: 'Volkswagen', model: 'Passat',     color: 'Silver' },
  { make: 'Hyundai',    model: 'Tucson',     color: 'Gray'   },
  { make: 'Ford',       model: 'F-150',      color: 'Red'    },
  { make: 'Chevrolet',  model: 'Silverado',  color: 'White'  },
  { make: 'BMW',        model: 'X3',         color: 'Blue'   },
  { make: 'Audi',       model: 'Q5',         color: 'Gray'   },
]

// ── Paths ───────────────────────────────────────────────────────────

const IMG_DIR  = path.resolve('images')
const DEST_DIR = path.resolve('../public/cars')

// ── Helpers ─────────────────────────────────────────────────────────

/** Build a URL-safe slug from vehicle attributes */
function toSlug(make, model, color) {
  return `${make}-${model}-${color}`.toLowerCase().replace(/\s+/g, '-')
}

/** Random integer between min (inclusive) and max (exclusive) */
function rand(min, max) {
  return Math.floor(Math.random() * (max - min) + min)
}

/** Attempt to download a full-res image from a Bing thumbnail element */
async function tryDownload(page, element, minBytes = 10_000) {
  const raw = await element.getAttribute('m')
  if (!raw) return null

  const { murl } = JSON.parse(raw)
  if (!murl) return null

  const res = await page.request.get(murl, { timeout: 15_000 })
  if (!res.ok()) return null

  const type = res.headers()['content-type'] ?? ''
  if (!type.includes('image')) return null

  const buf = await res.body()
  return buf.length >= minBytes ? buf : null
}

// ── Core scraping logic ─────────────────────────────────────────────

async function fetchImage(page, { make, model, color }) {
  const file = `${toSlug(make, model, color)}.jpg`
  const dest = path.join(IMG_DIR, file)

  // Skip if we already have this image
  if (existsSync(dest)) {
    console.log(`  skip  ${color} ${make} ${model} (exists)`)
    return file
  }

  const q = `${color} ${make} ${model} car side view white background facing left`
  const url = `https://www.bing.com/images/search?q=${encodeURIComponent(q)}&qft=+filterui:imagesize-medium`

  console.log(`  search  ${color} ${make} ${model}`)
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(rand(2000, 4000))

  // Try the top result first
  const thumbs = page.locator('.iusc')
  const first = thumbs.first()

  if (await first.count()) {
    try {
      const buf = await tryDownload(page, first)
      if (buf) {
        await writeFile(dest, buf)
        console.log(`  saved  ${color} ${make} ${model} (${(buf.length / 1024).toFixed(0)} KB)`)
        return file
      }
    } catch { /* fall through */ }
  }

  // Fallback — try next few results
  const total = Math.min(await thumbs.count(), 5)
  for (let i = 1; i < total; i++) {
    try {
      const buf = await tryDownload(page, thumbs.nth(i))
      if (buf) {
        await writeFile(dest, buf)
        console.log(`  saved  ${color} ${make} ${model} [fallback] (${(buf.length / 1024).toFixed(0)} KB)`)
        return file
      }
    } catch { /* try next */ }
  }

  console.log(`  FAIL  ${color} ${make} ${model}`)
  return null
}

// ── Main ────────────────────────────────────────────────────────────

async function run() {
  await mkdir(IMG_DIR, { recursive: true })
  await mkdir(DEST_DIR, { recursive: true })

  console.log(`\nScraping ${FLEET.length} vehicle images...\n`)

  const browser = await chromium.launch({ headless: false })
  const ctx = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
    locale: 'en-US',
  })
  const page = await ctx.newPage()

  const results = []

  for (const car of FLEET) {
    const file = await fetchImage(page, car)
    results.push({ ...car, file })
    await page.waitForTimeout(rand(1500, 3500))
  }

  await browser.close()

  // ── Copy to public dir ──────────────────────────────────────────

  const ok = results.filter((r) => r.file)
  console.log(`\n${ok.length}/${FLEET.length} images downloaded\n`)

  for (const { file } of ok) {
    const src = path.join(IMG_DIR, file)
    const dst = path.join(DEST_DIR, file)
    await writeFile(dst, await readFile(src))
  }

  console.log(`Copied to ${DEST_DIR}`)

  // ── Generate TypeScript mapping ─────────────────────────────────

  const map = {}
  for (const { make, model, color, file } of ok) {
    map[toSlug(make, model, color)] = `/cars/${file}`
  }

  const ts = `// Vehicle image mapping — generated by car-image-scraper
// Re-run \`npm run scrape\` in car-image-scraper/ to regenerate

const CAR_IMAGES: Record<string, string> = ${JSON.stringify(map, null, 2)}

export function getCarImageUrl(make: string, model: string, color: string): string {
  const key = \`\${make}-\${model}-\${color}\`.toLowerCase().replace(/\\s+/g, '-')
  return CAR_IMAGES[key] ?? '/cars/honda-civic-silver.jpg'
}
`

  const tsPath = path.resolve('../lib/car-image.ts')
  await writeFile(tsPath, ts)
  console.log(`Generated ${tsPath}`)
}

run().catch(console.error)
