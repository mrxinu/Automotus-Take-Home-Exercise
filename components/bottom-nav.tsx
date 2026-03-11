'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { List, Map, ClipboardList } from 'lucide-react'
import styles from './bottom-nav.module.scss'

const NAV_ITEMS = [
  { href: '/map', label: 'Map', icon: Map },
  { href: '/queue', label: 'Route', icon: List },
  { href: '/log', label: 'Log', icon: ClipboardList },
] as const

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="Main navigation" className={cn(styles.nav, 'safe-bottom')}>
      <div className={styles.inner}>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(styles.link, isActive ? styles['link-active'] : styles['link-inactive'])}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} aria-hidden="true" />
              <span className={cn(styles['link-label'], isActive && styles['link-label-active'])}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
