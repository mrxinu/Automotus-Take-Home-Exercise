import styles from './loading-spinner.module.scss'

interface LoadingSpinnerProps {
  size?: number
  label?: string
}

export function LoadingSpinner({ size = 48, label }: LoadingSpinnerProps) {
  return (
    <div className={styles.container}>
      <div className={styles.spinner} style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 64 72"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={styles.logo}
          aria-hidden="true"
        >
          <defs>
            <clipPath id="top-clip">
              <rect x="0" y="0" width="64" height="72" />
            </clipPath>
          </defs>
          <g clipPath="url(#top-clip)">
            <polygon points="32,-14 4,72 18,72" fill="currentColor" />
            <polygon points="32,-14 46,72 60,72" fill="currentColor" />
            <rect x="29" y="-2" width="6" height="6" fill="currentColor" />
          </g>
          <line x1="32" y1="6" x2="32" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="butt" />
          <line x1="32" y1="26" x2="32" y2="42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="butt" />
          <line x1="32" y1="50" x2="32" y2="68" stroke="currentColor" strokeWidth="3" strokeLinecap="butt" />
        </svg>
      </div>
      {label ? <p className={styles.label}>{label}</p> : null}
    </div>
  )
}
