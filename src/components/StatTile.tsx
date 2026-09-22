interface P { label: string; value: string | number; accent?: string; sub?: string }
export default function StatTile({ label, value, accent = '#2B2F36', sub }: P) {
  return (
    <div className="text-center">
      <div className="text-[26px] font-extrabold leading-tight" style={{ color: accent }}>{value}</div>
      <div className="text-[11px] text-gray-400 mt-0.5">{label}</div>
      {sub && <div className="text-[10px] text-gray-300 mt-0.5">{sub}</div>}
    </div>
  )
}
