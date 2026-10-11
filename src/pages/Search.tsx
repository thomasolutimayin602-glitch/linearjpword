import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { WORDS } from '../data/words'
import { db } from '../db/schema'
import { IconBack, IconSound, IconChevron } from '../components/icons'
import AudioPlayer from '../components/AudioPlayer'

export default function Search() {
  const nav = useNavigate()
  const [query, setQuery] = useState('')
  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return WORDS.slice(0, 8)
    return WORDS.filter(w => [w.word, w.kana, w.romaji, w.meaning].some(v => v.toLowerCase().includes(q))).slice(0, 30)
  }, [query])
  return <div className="anim-up"><div className="flex items-center gap-2 mb-4"><button onClick={() => nav('/')} aria-label="返回" className="w-9 h-9 rounded-full bg-white border border-gray-100 flex items-center justify-center"><IconBack width={19} height={19}/></button><div className="flex-1 relative"><input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="输入日语、中文、假名或罗马音" className="w-full rounded-2xl border border-gray-100 bg-white px-4 py-3 text-[13px] outline-none focus:border-[#FFB5B0]"/><span className="absolute right-3 top-2.5 text-gray-300">⌕</span></div></div><div className="text-[11px] text-gray-400 mb-2">{query ? `找到 ${results.length} 个词条` : '最近与推荐词条'}</div><div className="space-y-2">{results.map(w => <button key={w.id} onClick={() => nav(`/word/${w.id}`)} className="card w-full p-3.5 flex items-center gap-3 text-left hover:shadow-md transition-shadow"><div className="flex-1 min-w-0"><div className="flex items-baseline gap-2"><span className="font-bold text-[16px] text-gray-800">{w.word}</span><span className="text-[12px] text-gray-400">{w.kana}</span></div><div className="text-[11px] text-gray-400 mt-1 truncate">{w.meaning} · {w.pos}</div></div><IconChevron width={16} height={16} className="text-gray-300"/></button>)}</div></div>
}

export function WordDetail() {
  const nav = useNavigate(); const { wordId } = useParams(); const w = WORDS.find(x => String(x.id) === wordId); const [favorite, setFavorite] = useState(false)
  if (!w) return <div className="text-center py-20 text-gray-400">词条不存在</div>
  const toggle = async () => { const id = `fav-${w.id}`; if (favorite) await db.favorites.delete(id); else await db.favorites.put({ id, senseId: w.id, createdAt: Date.now() }); setFavorite(!favorite) }
  return <div className="anim-up"><div className="flex items-center gap-3 mb-4"><button onClick={() => nav(-1)} aria-label="返回" className="w-9 h-9 rounded-full bg-white border border-gray-100 flex items-center justify-center"><IconBack width={19} height={19}/></button><h1 className="text-[18px] font-extrabold text-gray-900">单词详情</h1></div><div className="card p-5"><div className="flex items-start justify-between"><div><div className="text-[34px] font-extrabold text-gray-900">{w.word}</div><div className="text-[19px] text-gray-400 mt-1">{w.kana}</div><div className="text-[12px] text-gray-400 mt-1">{w.romaji} · {w.accent} · {w.pos}</div></div><button onClick={toggle} aria-label="收藏" className={`text-2xl ${favorite ? 'text-[#FF5252]' : 'text-gray-300'}`}>{favorite ? '★' : '☆'}</button></div><div className="flex items-center gap-3 mt-4"><AudioPlayer text={w.kana} size={42}/><span className="text-[12px] text-gray-400">播放标准音</span></div><div className="mt-5 pt-4 border-t border-gray-100"><div className="text-[12px] text-gray-400 mb-1">中文释义</div><div className="text-[20px] font-bold text-gray-800">{w.meaning}</div></div>{w.examples[0] && <div className="mt-4 rounded-2xl bg-[#FFF8F5] p-3.5"><div className="text-[14px] font-medium text-gray-800">{w.examples[0].ja}</div><div className="text-[12px] text-gray-500 mt-1">{w.examples[0].en}</div></div>}<div className="grid grid-cols-2 gap-2 mt-4"><button className="btn-primary py-3 text-[13px] font-bold" onClick={() => nav('/study')}>加入训练</button><button className="btn-ghost py-3 text-[13px] font-bold" onClick={toggle}>{favorite ? '已收藏' : '收藏单词'}</button></div></div></div>
}

export function Favorites() {
  const [items, setItems] = useState<number[]>([])
  useEffect(() => { db.favorites.toArray().then(rows => setItems(rows.map(r => r.senseId))) }, [])
  return <div className="anim-up"><h1 className="text-[22px] font-extrabold text-gray-900 mb-1">收藏夹</h1><p className="text-[12px] text-gray-400 mb-4">收藏的单词会在这里，随时可以重新训练</p><div className="space-y-2">{items.length ? items.map(id => { const w = WORDS.find(x => x.id === id); return w ? <div key={id} className="card p-3.5 flex items-center gap-3"><div className="flex-1"><div className="font-bold text-gray-800">{w.word} <span className="text-[12px] text-gray-400 font-normal">{w.kana}</span></div><div className="text-[11px] text-gray-400 mt-1">{w.meaning}</div></div><IconSound width={18} height={18} className="text-[#FF5252]"/></div> : null }) : <div className="text-center py-20 text-[13px] text-gray-400">还没有收藏词，去查词并收藏</div>}</div></div>
}
