import { Clock } from 'lucide-react'
import { getTimeSemaphore, SEMAPHORE_CLASSES, formatDuration, minutesSince } from '../utils/statusConfig'

interface Props {
  sinceIso: string | null
  paused?: boolean
}

export function TimerBadge({ sinceIso, paused }: Props) {
  if (!sinceIso) return null

  const minutes = minutesSince(sinceIso)
  const hours   = minutes / 60
  const signal  = paused ? 'yellow' : getTimeSemaphore(hours)
  const cls     = SEMAPHORE_CLASSES[signal]

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${cls.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cls.dot}`} />
      <Clock className="h-3 w-3" />
      {paused ? 'Pausado' : formatDuration(minutes)}
    </span>
  )
}
