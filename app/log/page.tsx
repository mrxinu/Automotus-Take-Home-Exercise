'use client'

import { ActivityEntryCard } from '@/components/log/activity-entry'
import { ErrorState } from '@/components/error-state'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useActivity } from '@/hooks/use-activity'
import { ClipboardList } from 'lucide-react'
import styles from './page.module.scss'

export default function LogPage() {
  const { data: activity, isLoading, isError, refetch } = useActivity()

  return (
    <main id="main-content" className={styles.main}>
      {isLoading && <LoadingSpinner label="Loading activity…" />}

      {isError && (
        <ErrorState
          message="Couldn't load your activity log."
          onRetry={() => refetch()}
        />
      )}

      {activity && activity.length === 0 && (
        <div className={styles.empty}>
          <ClipboardList size={48} className={styles['empty-icon']} aria-hidden="true" />
          <h2 className={styles['empty-title']}>No activity yet</h2>
          <p className={styles['empty-desc']}>
            Start by visiting a zone from the queue. Your actions will appear here.
          </p>
        </div>
      )}

      {activity && activity.length > 0 && (
        <div>
          {activity.map((entry) => (
            <ActivityEntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </main>
  )
}
