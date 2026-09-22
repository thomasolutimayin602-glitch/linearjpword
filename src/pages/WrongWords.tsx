import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../db/schema'
import { WORDS_BY_ID } from '../data/words'
import type { SenseState } from '../types'
import { useStudyStore } from '../stores/study-store'
import { IconPin, IconChevron, IconTrash } from '../components/icons'

interface Row extends SenseState { word: string }

export default function WrongWords() {
  const nav = useNavigate()
  const { togglePin, archiveSense } = useStudyStore()
  const [items, setItems] = useState<Row[]>([])
  const [expanded, setExpanded] = useState<number | null>(null)

  const load = async () => {
    const rows = await db.states.where('status').equals('learning').and(r => r.totalWrong > 0 || r.pinned).toArray()
    // pinned first, then by wrong count desc, then recency
    rows.sort((a, b) =>
      (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) ||
      b.totalWrong - a.totalWrong ||
      (b.lastWrongAt ?? 0) - (a.lastWrongAt ?? 0)
    )
    setItems(rows.map(r => ({ ...r, word: WORDS_BY_ID.get(r.senseId)?.word || WORDS_BY_ID.get(r.senseId)?.kana || '' })))
  }

  useEffect(() => { load() }, [])

  const handlePin = async (id: number) => { await togglePin(id); await load() }
  const handleDelete = async (id: number) => { await archiveSense(id); await load() }

  const pinnedCount = items.filter(i => i.pinned).length

  return (
    <div className="anim-up">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-[22px] font-extrabold text-gray-900">错词本</h1>
        <span className="text-[11px] text-gray-400">
          <IconPin width={12} height={12} className="inline -mt-0.5 mr-0.5 text-[#FF5252]" />
          {pinnedCount} pinned
        </span>
      </div>
      <p className="text-[12px] text-gray-400 mb-4">根据答错次数排序，折叠卡片设计，适合你自己开小灶</p>

      {items.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-[48px] mb-3 anim-bounce">🎉</div>
          <div className="text-[15px] font-bold text-gray-600">暂无错词</div>
          <div className="text-[12px] text-gray-400 mt-1">答错的单词会自动出现在这里</div>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((row, idx) => {
            const w = WORDS_BY_ID.get(row.senseId)
            if (!w) return null
            const isOpen = expanded === row.senseId
            return (
              <div key={row.senseId} className="anim-up" style={{ animationDelay: `${Math.min(idx * 30, 300)}ms` }}>
                {/* folded top card */}
                <button
                  onClick={() => setExpanded(isOpen ? null : row.senseId)}
                  className={`w-full text-left rounded-t-2xl ${isOpen ? '' : 'rounded-b-2xl shadow-sm'} px-4 py-3.5 border transition-all ${row.pinned ? 'bg-[#FFF8F5] border-[#FFE3D6]' : 'bg-white border-gray-100'} ${row.pinned ? '' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex items-center gap-3">
                    {row.pinned && <IconPin width={15} height={15} className="text-[#FF5252] shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className={`text-[17px] font-bold ${row.pinned ? 'text-[#FF5252]' : 'text-gray-900'}`}>{w.word || w.kana}</span>
                        <span className="text-[12px] text-gray-400">{w.kana}</span>
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5 truncate">{w.meaning}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${row.totalWrong >= 5 ? 'bg-[#FFF0F0] text-[#FF5252]' : row.totalWrong >= 2 ? 'bg-[#FFF7ED] text-[#F5A623]' : 'bg-[#F3F4F6] text-gray-500'}`}>
                        错 {row.totalWrong} 次
                      </span>
                      <span className="text-[10px] text-gray-300">{row.mastery}%</span>
                    </div>
                    <IconChevron width={16} height={16} className={`text-gray-300 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* folded detail (peek below) */}
                {isOpen && (
                  <div className="bg-[#FFFDF8] rounded-b-2xl border border-t-0 border-gray-100 px-4 pt-2 pb-4 anim-pop relative">
                    {/* fold shadow */}
                    <div className="absolute top-0 left-6 right-6 h-2 bg-[#F1ECE4] rounded-b-sm" style={{ transform: 'translateY(2px)' }} aria-hidden />
                    <div className="pt-3">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12px]">
                        <InfoLine label="读音" value={w.romaji} />
                        <InfoLine label="释义" value={w.meaning} />
                        <InfoLine label="词性" value={w.pos} />
                        <InfoLine label="等级" value={w.level} />
                      </div>
                      {w.examples[0] && (
                        <div className="mt-3 rounded-xl bg-white border border-gray-100 p-3 text-[12px]">
                          <div className="text-gray-800 font-medium">{w.examples[0].ja}</div>
                          <div className="text-gray-400 mt-0.5">{w.examples[0].en}</div>
                        </div>
                      )}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={e => { e.stopPropagation(); handlePin(row.senseId) }}
                          className={`flex-1 py-2 rounded-xl text-[12px] font-bold border transition-colors ${row.pinned ? 'bg-[#FF5252] text-white border-[#FF5252]' : 'bg-white text-[#FF5252] border-[#FFD6D6] hover:bg-[#FFF8F8]'}`}
                        >
                          {row.pinned ? '取消置顶' : '置顶 ⭐'}
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); nav('/study', { state: { from: 'wrong', senseId: row.senseId } }) }}
                          className="flex-1 py-2 rounded-xl text-[12px] font-bold bg-white text-[#3B82F6] border border-[#CFE0FF] hover:bg-[#F5F9FF]"
                        >
                          再练一次
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); handleDelete(row.senseId) }}
                          aria-label="Delete"
                          className="w-9 py-2 rounded-xl flex items-center justify-center bg-white text-gray-400 border border-gray-100 hover:text-[#FF5252] hover:border-[#FFD6D6]"
                        >
                          <IconTrash width={15} height={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1.5">
      <span className="text-gray-400 w-8 shrink-0">{label}</span>
      <span className="text-gray-700 font-medium">{value}</span>
    </div>
  )
}
