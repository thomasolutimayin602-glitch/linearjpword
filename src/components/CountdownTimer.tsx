import { useEffect, useRef, useState } from 'react'
import ProgressRing from './ProgressRing'

interface P {
  seconds: number
  onExpire: () => void
  running: boolean
  key?: string | number
}
export default function CountdownTimer({ seconds, onExpire, running, key }: P) {
  const [left, setLeft] = useState(seconds)
  const called = useRef(false)

  useEffect(() => { setLeft(seconds); called.current = false }, [seconds, key])

  useEffect(() => {
    if (!running) return
    const iv = setInterval(() => {
      setLeft(p => {
        if (p <= 1) {
          clearInterval(iv)
          if (!called.current) { called.current = true; onExpire() }
          return 0
        }
        return p - 1
      })
    }, 1000)
    return () => clearInterval(iv)
  }, [running, onExpire, key])

  const pct = seconds > 0 ? Math.round((left / seconds) * 100) : 0
  const color = left > seconds * 0.5 ? '#4EBF6D' : left > 3 ? '#F5A623' : '#FF5252'
  return (
    <ProgressRing progress={pct} size={44} stroke={4} color={color} trackColor="#F0F1F2">
      <span className={`text-[13px] font-bold tabular-nums ${left <= 3 ? 'text-[#FF5252]' : 'text-gray-700'}`}>{left}</span>
    </ProgressRing>
  )
}
