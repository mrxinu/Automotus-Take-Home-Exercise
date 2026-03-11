import { CheckCircle } from 'lucide-react'
import styles from './empty-queue.module.scss'

export function EmptyQueue() {
  return (
    <div className={styles.container}>
      <CheckCircle size={48} className={styles.icon} aria-hidden="true" />
      <h2 className={styles.title}>All zones clear</h2>
      <p className={styles.desc}>
        No zones need attention right now. Check back shortly or pull down to refresh.
      </p>
    </div>
  )
}
