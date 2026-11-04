import { useNavigate } from 'react-router-dom'
import { useStudyStore } from '../stores/study-store'
import { GOAL_LABEL, IDENTITY_LABEL } from '../types'
import { IconGear, IconTrophy, IconChart, IconChevron, IconBook } from '../components/icons'

export default function Profile() {
  const nav = useNavigate()
  const { profile, plan, guest, states, books, bookId } = useStudyStore()
  const currentBook = books.find(book => book.id === bookId)
  const currentBookIds = new Set(currentBook?.wordIds ?? [])
  const bookStates = [...states.values()].filter(state => currentBookIds.size === 0 || currentBookIds.has(state.senseId))
  const learned = bookStates.filter(s => s.status !== 'new').length
  const mastered = bookStates.filter(s => s.status === 'archived').length
  const remaining = plan
    ? plan.queue.filter(id => !plan.completedIds.includes(id) && states.get(id)?.status !== 'archived').length
    : 0
  const guestLeft = Math.max(0, guest.limit - guest.answered)

  return (
    <div className="anim-up space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-extrabold text-gray-900">我的</h1>
          <p className="text-[12px] text-gray-400 mt-0.5">{profile ? '本地学习档案 · 数据保存在本机' : '游客模式 · 数据保存在本机'}</p>
        </div>
        <button onClick={() => nav('/settings')} aria-label="设置" className="w-9 h-9 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-500">
          <IconGear width={19} height={19} />
        </button>
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FF7A6E] to-[#FF5252] text-white flex items-center justify-center text-xl font-bold">
            {(profile?.nickname || '拓').slice(0, 1)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-gray-800 truncate">{profile?.nickname || '游客'}</div>
            <div className="text-[11px] text-gray-400 mt-1">
              {profile
                ? `${IDENTITY_LABEL[profile.identity]} · ${profile.level} · ${GOAL_LABEL[profile.goal]}`
                : `试学剩余 ${guestLeft} 题`}
            </div>
          </div>
          <button onClick={() => nav('/onboarding')} className="text-[11px] text-[#FF5252] font-bold shrink-0">
            {profile ? '编辑档案' : '建立档案'}
          </button>
        </div>
      </div>

      <div className="card p-4 grid grid-cols-3 divide-x divide-gray-100">
        <Metric label="累计已学" value={String(learned)} />
        <Metric label="已掌握" value={String(mastered)} />
        <Metric label="今日剩余" value={String(remaining)} />
      </div>

      <div className="card divide-y divide-gray-100">
        <Row icon={<IconBook width={18} height={18} />} title="我的词书" hint={currentBook?.title ?? 'N5 入门核心词'} onClick={() => nav('/books')} />
        <Row icon={<IconChart width={18} height={18} />} title="学习记录" onClick={() => nav('/stats')} />
        <Row icon={<IconBook width={18} height={18} />} title="收藏夹" onClick={() => nav('/favorites')} />
        <Row icon={<IconTrophy width={18} height={18} />} title="勋章与学习装备" hint="即将开放" />
        <Row icon={<span className="text-[17px]">💳</span>} title="会员中心" hint="未接入" />
        <Row icon={<IconGear width={18} height={18} />} title="设置" onClick={() => nav('/settings')} />
      </div>

      <div className="card p-4 text-[12px] text-gray-400 leading-6">
        当前版本提供本地档案、离线学习和完整训练闭环。账号、云同步、会员与社交服务将在 Provider 接入后启用，未配置时不会显示为可用。
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="text-center"><div className="text-[20px] font-extrabold text-gray-800">{value}</div><div className="text-[10px] text-gray-400 mt-1">{label}</div></div>
}

function Row({ icon, title, hint, onClick }: {
  icon: React.ReactNode; title: string; hint?: string; onClick?: () => void
}) {
  return (
    <button onClick={onClick} className="w-full p-4 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors">
      <span className="text-[#FF5252]">{icon}</span>
      <span className="flex-1 text-[13px] font-medium text-gray-700">{title}</span>
      {hint && <span className="text-[10px] text-gray-400">{hint}</span>}
      <IconChevron width={16} height={16} className="text-gray-300" />
    </button>
  )
}
