import { IconTrophy, IconChevron } from '../components/icons'

const ranks = [
  ['小拓', 32], ['你', 28], ['山田', 25],
]

export default function Community() {
  return <div className="anim-up space-y-3"><div className="flex items-center justify-between"><div><h1 className="text-[22px] font-extrabold text-gray-900">拓友</h1><p className="text-[12px] text-gray-400 mt-0.5">一起学习，保持节奏</p></div><button className="btn-ghost px-3 py-2 text-[12px]">消息(0)</button></div><div className="card p-4"><div className="flex items-center gap-2 mb-4"><IconTrophy width={18} height={18} className="text-[#F5A623]"/><span className="font-bold text-gray-700">今日学习榜</span><span className="ml-auto text-[11px] text-gray-400">世界榜 <IconChevron width={13} height={13} className="inline"/></span></div><div className="space-y-3">{ranks.map(([name, count], i) => <div key={name} className="flex items-center gap-3"><span className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${i === 0 ? 'bg-[#FFF2C7] text-[#B87900]' : 'bg-gray-100 text-gray-500'}`}>{i + 1}</span><span className="flex-1 text-[13px] font-medium text-gray-700">{name}</span><span className="text-[12px] text-gray-400">{count} 词</span></div>)}</div></div><div className="grid grid-cols-2 gap-3"><Action title="找好友" detail="搜索并关注拓友"/><Action title="拓团" detail="加入学习小组"/><Action title="同桌" detail="互相监督打卡"/><Action title="心得" detail="分享学习记录"/></div><div className="card p-4"><div className="text-[13px] font-bold text-gray-700 mb-2">社区功能状态</div><div className="text-[12px] leading-6 text-gray-400">当前为本地演示环境。举报、屏蔽、消息和同步接口已预留，登录后开启云端社交。</div></div></div>
}

function Action({ title, detail }: { title: string; detail: string }) { return <button className="card p-4 text-left hover:shadow-md transition-shadow"><div className="font-bold text-[13px] text-gray-700">{title}</div><div className="text-[11px] text-gray-400 mt-1">{detail}</div></button> }
