import { useNavigate } from 'react-router-dom'
import { IconBook, IconClock, IconChevron } from '../components/icons'

const shelves = [
  { level: 'N5', title: 'はじめての日本語', progress: 35, color: '#4EBF6D' },
  { level: 'N4', title: '生活の短文', progress: 12, color: '#3B82F6' },
  { level: 'N3', title: '仕事と旅行', progress: 0, color: '#8F7BFF' },
]

export default function Reading() {
  const nav = useNavigate()
  return (
    <div className="anim-up space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-extrabold text-gray-900">阅读</h1>
          <p className="text-[12px] text-gray-400 mt-0.5">用短文把单词放回语境</p>
        </div>
        <button className="btn-ghost px-3 py-2 text-[12px]" onClick={() => nav('/reading/test')}>测一测级别</button>
      </div>
      <div className="card p-4 bg-gradient-to-br from-[#FFF8F5] to-white">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#FF5252] text-white flex items-center justify-center"><IconBook width={23} height={23} /></div>
          <div className="flex-1"><div className="text-[12px] text-gray-400">今天继续</div><div className="font-bold text-gray-800">雨の日の駅</div><div className="text-[11px] text-gray-400 mt-0.5">N5 · 约 5 分钟</div></div>
          <button onClick={() => nav('/reading/book/demo')} className="btn-primary px-3 py-2 text-[12px]">继续阅读</button>
        </div>
      </div>
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3"><span className="font-bold text-gray-700">分级阅读</span><button onClick={() => nav('/reading/shelf')} className="text-[11px] text-gray-400">查看全部 <IconChevron width={13} height={13} className="inline" /></button></div>
        <div className="space-y-3">{shelves.map(s => <div key={s.level} className="flex items-center gap-3"><span className="w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-bold text-white" style={{ background: s.color }}>{s.level}</span><div className="flex-1"><div className="flex justify-between text-[12px] mb-1"><span className="font-medium text-gray-700">{s.title}</span><span className="text-gray-400">{s.progress}%</span></div><div className="h-1.5 rounded-full bg-gray-100 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${s.progress}%`, background: s.color }} /></div></div></div>)}</div>
      </div>
      <button onClick={() => nav('/reading/listen')} className="card w-full p-4 flex items-center gap-3 text-left hover:shadow-md transition-shadow"><div className="w-10 h-10 rounded-xl bg-[#EEF8FF] text-[#3B82F6] flex items-center justify-center"><IconClock width={21} height={21} /></div><div className="flex-1"><div className="font-bold text-gray-700">磨耳朵</div><div className="text-[11px] text-gray-400 mt-0.5">后台播放 · 倍速 · 听写模式</div></div><IconChevron width={18} height={18} className="text-gray-300" /></button>
    </div>
  )
}

export function ReadingTest() { return <SimpleReading title="阅读能力测试" description="完成一组短文和理解题，获取适合你的阅读级别。" action="开始测试" /> }
export function ReadingShelf() { return <SimpleReading title="阅读书架" description="已解锁的分级读物会出现在这里。" action="浏览 N5 读物" /> }
export function ReadingBook() { return <SimpleReading title="雨の日の駅" description="駅までの道で、雨の音を聞きながら歩きました。点击生词可收藏并加入复习。" action="开始阅读" /> }
export function Listening() { return <SimpleReading title="磨耳朵" description="选择音频后可调节倍速、定时和听写模式。" action="播放示例音频" /> }

function SimpleReading({ title, description, action }: { title: string; description: string; action: string }) {
  return <div className="anim-up"><h1 className="text-[22px] font-extrabold text-gray-900">{title}</h1><div className="card p-5 mt-4"><p className="text-[15px] leading-7 text-gray-700">{description}</p><button className="btn-primary w-full py-3 mt-5 font-bold">{action}</button></div></div>
}
