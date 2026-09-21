import { useEffect, useRef, useState } from 'react'

interface CountdownTimerProps {
  seconds: number
  onExpire: () => void
  running: boolean
  key?: string | number
}

export default function CountdownTimer({ seconds, onExpire, running, key }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(seconds)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const calledRef = useRef(false)

  useEffect(() => {
    setRemaining(seconds)
    calledRef.current = false
  }, [seconds, key])

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          if (!calledRef.current) {
            calledRef.current = true
            onExpire()
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [running, onExpire, key])

  const pct = (remaining / seconds) * 100
  const color = remaining > 3 ? 'bg-green-500' : remaining > 1 ? 'bg-amber-500' : 'bg-red-500'

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-sm font-mono font-bold ${remaining <= 3 ? 'text-red-500' : 'text-gray-500'}`}>
        {remaining}s
      </span>
    </div>
  )
}
