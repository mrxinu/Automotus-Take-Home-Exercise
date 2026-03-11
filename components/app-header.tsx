'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { resetData } from '@/lib/api-client'
import { Shield, RotateCcw } from 'lucide-react'
import styles from './app-header.module.scss'

export function AppHeader({ title }: { title: string }) {
  const queryClient = useQueryClient()

  const reset = useMutation({
    mutationFn: resetData,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue'] })
      queryClient.invalidateQueries({ queryKey: ['zone'] })
      queryClient.invalidateQueries({ queryKey: ['activity'] })
    },
  })

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Shield size={24} className={styles.icon} aria-hidden="true" />
        <div className={styles.text}>
          <h1 className={styles.title}>{title}</h1>
        </div>
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Reset all mock data? This will undo all actions.')) {
              reset.mutate()
            }
          }}
          disabled={reset.isPending}
          className={styles['reset-btn']}
          title="Reset all mock data"
        >
          <RotateCcw size={16} aria-hidden="true" />
          Reset
        </button>
      </div>
    </header>
  )
}
