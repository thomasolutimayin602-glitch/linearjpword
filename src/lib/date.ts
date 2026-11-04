/** Local-calendar day key (YYYY-MM-DD). Never use UTC for learning days. */
export function dayKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/** Day key for N days before `from` (local calendar). */
export function dayKeyOffset(days: number, from: Date = new Date()): string {
  const d = new Date(from)
  d.setDate(d.getDate() - days)
  return dayKey(d)
}
