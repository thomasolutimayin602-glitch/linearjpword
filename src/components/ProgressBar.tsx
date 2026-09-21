interface ProgressBarProps {
  current: number
  total: number
  label?: string
  color?: string
}

export default function ProgressBar({ current, total, label, color = 'bg-red-500' }: ProgressBarProps) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-sm text-gray-500 mb-1">
          <span>{label}</span>
          <span>{current}/{total}</span>
        </div>
      )}
      <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
