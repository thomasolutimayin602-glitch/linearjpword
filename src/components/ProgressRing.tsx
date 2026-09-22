interface P {
  progress: number       // 0..100
  size?: number
  stroke?: number
  color?: string
  trackColor?: string
  children?: React.ReactNode
}
export default function ProgressRing({
  progress, size = 96, stroke = 8,
  color = '#FF5252', trackColor = '#F0E9E7', children,
}: P) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, progress))
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)}
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  )
}
