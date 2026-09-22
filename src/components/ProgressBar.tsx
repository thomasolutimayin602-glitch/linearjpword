interface P {
  current: number
  total: number
  color?: string
  className?: string
}
export default function ProgressBar({ current, total, color = '#FF5252', className = '' }: P) {
  const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0
  return (
    <div className={`w-full h-2 bg-[#F0F1F2] rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  )
}
