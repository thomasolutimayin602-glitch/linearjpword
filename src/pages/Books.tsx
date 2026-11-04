import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { WORDS_BY_ID } from '../data/words'
import { useStudyStore } from '../stores/study-store'
import { IconBack, IconChevron } from '../components/icons'

export default function BookLibrary() {
  const nav = useNavigate()
  const { books, bookId } = useStudyStore()

  return (
    <div className="anim-up">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => nav(-1)} aria-label="返回" className="w-9 h-9 rounded-full bg-white border border-gray-100 flex items-center justify-center">
          <IconBack width={19} height={19} />
        </button>
        <div>
          <h1 className="text-[21px] font-extrabold text-gray-900">词书库</h1>
          <p className="text-[11px] text-gray-400 mt-0.5">选择词书后，今日计划会按所选范围重新生成</p>
        </div>
      </div>

      <div className="space-y-2.5">
        {books.map(book => {
          const active = book.id === bookId
          return (
            <button
              key={book.id}
              onClick={() => nav(`/books/${book.id}`)}
              className={`card w-full p-4 text-left hover:shadow-md transition-shadow ${active ? 'ring-2 ring-[#FFD6D6] border-[#FFB5B0]' : ''}`}
            >
              <div className="flex items-start gap-3.5">
                <span className="w-12 h-12 rounded-2xl text-white text-[20px] font-extrabold flex items-center justify-center shrink-0" style={{ backgroundColor: book.accent }}>
                  {book.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-bold text-gray-800">{book.title}</span>
                    {active && <span className="text-[9px] font-bold text-[#FF5252] bg-[#FFF0F0] px-1.5 py-0.5 rounded-full shrink-0">当前</span>}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1">{book.subtitle}</div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-[10px] text-gray-400">
                    <span>{book.level}</span>
                    <span>·</span>
                    <span>{book.wordIds.length} 词</span>
                    <span>·</span>
                    <span className="text-[#3BA65B] font-medium">已内置 · 可离线</span>
                    {book.isDevelopmentContent && <span className="text-[#B7791F] bg-[#FFF8E7] px-1.5 py-0.5 rounded-full">开发期内容</span>}
                  </div>
                </div>
                <IconChevron width={16} height={16} className="text-gray-300 shrink-0 mt-2 -rotate-90" />
              </div>
            </button>
          )
        })}
      </div>

      <div className="card p-4 mt-3 text-[11px] text-gray-400 leading-5">
        当前词书均为内置 N5 开发期种子内容，不依赖网络。N4/N3 等正式词书尚未接入，因此不会显示为可下载或已上线。
      </div>
    </div>
  )
}

export function BookDetail() {
  const nav = useNavigate()
  const { bookId } = useParams()
  const { books, bookId: currentBookId, states, setCurrentBook } = useStudyStore()
  const book = books.find(item => item.id === bookId)
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [switching, setSwitching] = useState(false)

  const words = useMemo(() => {
    if (!book) return []
    const q = query.trim().toLowerCase()
    return book.wordIds.flatMap(id => {
      const word = WORDS_BY_ID.get(id)
      if (!word) return []
      if (q && ![word.word, word.kana, word.romaji, word.meaning].some(value => value.toLowerCase().includes(q))) return []
      return [word]
    })
  }, [book, query])

  if (!book) {
    return (
      <div className="text-center py-20">
        <div className="text-[13px] text-gray-400">词书不存在</div>
        <button onClick={() => nav('/books', { replace: true })} className="text-[12px] font-bold text-[#FF5252] mt-3">返回词书库</button>
      </div>
    )
  }

  const active = book.id === currentBookId
  const learned = book.wordIds.filter(id => {
    const state = states.get(id)
    return state && state.status !== 'new'
  }).length
  const visibleWords = expanded || query ? words : words.slice(0, 30)

  const handleSwitch = async () => {
    if (active || switching) return
    setSwitching(true)
    await setCurrentBook(book.id)
    setSwitching(false)
  }

  return (
    <div className="anim-up">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => nav('/books')} aria-label="返回" className="w-9 h-9 rounded-full bg-white border border-gray-100 flex items-center justify-center">
          <IconBack width={19} height={19} />
        </button>
        <h1 className="text-[18px] font-extrabold text-gray-900">词书详情</h1>
      </div>

      <div className="card overflow-hidden">
        <div className="p-5 text-white" style={{ backgroundColor: book.accent }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[26px] font-extrabold">{book.title}</div>
              <div className="text-[12px] text-white/80 mt-1">{book.subtitle}</div>
            </div>
            <span className="text-[42px] font-extrabold leading-none text-white/25">{book.icon}</span>
          </div>
          <div className="flex gap-2 mt-4 text-[10px] font-medium">
            <span className="bg-white/20 rounded-full px-2.5 py-1">{book.level}</span>
            <span className="bg-white/20 rounded-full px-2.5 py-1">{book.wordIds.length} 词</span>
            <span className="bg-white/20 rounded-full px-2.5 py-1">内置离线</span>
            {book.isDevelopmentContent && <span className="bg-black/15 rounded-full px-2.5 py-1">开发期内容</span>}
          </div>
        </div>
        <div className="p-4">
          <p className="text-[12px] text-gray-500 leading-6">{book.description}</p>
          <div className="grid grid-cols-2 gap-2 mt-4 text-center">
            <div className="rounded-xl bg-gray-50 py-3">
              <div className="text-[20px] font-extrabold text-gray-800">{learned}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">本词书已学</div>
            </div>
            <div className="rounded-xl bg-gray-50 py-3">
              <div className="text-[20px] font-extrabold text-gray-800">{book.wordIds.length - learned}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">尚未学习</div>
            </div>
          </div>
          <button
            onClick={handleSwitch}
            disabled={active || switching}
            className={`w-full mt-4 py-3.5 rounded-2xl text-[14px] font-bold transition-all ${
              active ? 'bg-[#EAF8EF] text-[#3BA65B]' : 'btn-primary'
            }`}
          >
            {active ? '✓ 当前使用中的词书' : switching ? '正在切换…' : '使用这本词书'}
          </button>
          <div className="text-center text-[10px] text-gray-400 mt-2">切换后会按本词书重新生成今日计划，历史学习记录不会删除</div>
          <div className="text-center text-[10px] text-gray-300 mt-1">内容版本 {book.version}</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[14px] font-bold text-gray-800">词表</h2>
          <span className="text-[10px] text-gray-400">{words.length} / {book.wordIds.length} 词</span>
        </div>
        <input
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="在本书中搜索汉字、假名或释义"
          className="w-full rounded-2xl border border-gray-100 bg-white px-4 py-3 text-[12px] outline-none focus:border-[#FFB5B0] mb-2.5"
        />
        <div className="space-y-2">
          {visibleWords.map(word => {
            const state = states.get(word.id)
            return (
              <button key={word.id} onClick={() => nav(`/word/${word.id}`)} className="card w-full p-3.5 flex items-center gap-3 text-left">
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[16px] font-bold text-gray-800">{word.word}</span>
                    <span className="text-[11px] text-gray-400">{word.kana}</span>
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1 truncate">{word.meaning}</div>
                </div>
                <span className={`text-[9px] px-2 py-1 rounded-full shrink-0 ${
                  state?.status === 'archived'
                    ? 'bg-[#EAF8EF] text-[#3BA65B]'
                    : state?.status === 'learning'
                      ? 'bg-[#FFF8E7] text-[#B7791F]'
                      : 'bg-gray-100 text-gray-400'
                }`}>
                  {state?.status === 'archived' ? '已掌握' : state?.status === 'learning' ? '学习中' : '未学习'}
                </span>
              </button>
            )
          })}
          {words.length === 0 && <div className="text-center py-12 text-[12px] text-gray-400">没有找到匹配词条</div>}
        </div>
        {!expanded && !query && words.length > 30 && (
          <button onClick={() => setExpanded(true)} className="btn-ghost w-full py-3 mt-2.5 text-[12px] font-bold">
            显示全部 {words.length} 个词条
          </button>
        )}
      </div>
    </div>
  )
}
