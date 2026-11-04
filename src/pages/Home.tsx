import { useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useStudyStore } from '../stores/study-store'
import { db } from '../db/schema'
import { WORDS } from '../data/words'
import type { SessionRecord } from '../types'
import { GOAL_LABEL, IDENTITY_LABEL } from '../types'
import ProgressRing from '../components/ProgressRing'
import StatTile from '../components/StatTile'
import ProgressBar from '../components/ProgressBar'
import { IconFlame, IconBook, IconTrophy, IconClock } from '../components/icons'
import { dayKey, dayKeyOffset } from '../lib/date'

export default function Home() {
  const nav = useNavigate()
  const { bootstrap, startSession, states, profile, plan, guest } = useStudyStore()
  const [sessions, setSessions] = useState<SessionRecord[]>([])

  const refreshSessions = useMemo(() => async () => {
    setSessions(await db.sessions.toArray())
  }, [])

  useEffect(() => {
    void bootstrap().then(refreshSessions)
  }, [bootstrap, refreshSessions])

  const recs = [...states.values()]
  const learned = recs.filter(s => s.status !== 'new').length
  const mastered = recs.filter(s => s.status === 'archived').length
  const learning = recs.filter(s => s.status === 'learning' || s.status === 'new').length
  const total = WORDS.length

  const todayStr = dayKey()
  const todays = sessions.filter(s => s.date === todayStr)
  const checkedIn = todays.some(s => s.checkedIn)
  const todayCount = todays.length
  const todayCorrect = todays.reduce((a, s) => a + s.correct, 0)

  const streak = useMemo(() => {
    let count = 0
    for (let i = 0; i < 365; i++) {
      const ds = dayKeyOffset(i)
      if (sessions.some(s => s.date === ds && s.checkedIn)) count++
      else if (i > 0) break
    }
    return count
  }, [sessions])

  const remaining = plan
    ? plan.queue.filter(id => !plan.completedIds.includes(id) && states.get(id)?.status !== 'archived')
    : []
  const remainingNew = plan ? plan.newIds.filter(id => remaining.includes(id)).length : 0
  const remainingDue = plan ? plan.dueIds.filter(id => remaining.includes(id)).length : 0
  const planTotal = remaining.length
  const todayDone = plan !== null && planTotal === 0
  const guestBlocked = !profile && guest.answered >= guest.limit
  const guestLeft = Math.max(0, guest.limit - guest.answered)
  const pct = total > 0 ? Math.round((mastered / total) * 100) : 0
  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 5) return '夜深了'
    if (h < 11) return '早上好'
    if (h < 14) return '中午好'
    if (h < 18) return '下午好'
    return '晚上好'
  })()

  const handleStart = async () => {
    if (guestBlocked) {
      nav('/onboarding')
      return
    }
    const started = await startSession()
    if (started) nav('/study')
  }

  const handleCheckIn = async () => {
    const all = await db.sessions.toArray()
    const todaySession = all.find(s => s.date === todayStr)
    if (todaySession && !todaySession.checkedIn) {
      await db.sessions.put({ ...todaySession, checkedIn: true })
    } else if (!todaySession) {
      await db.sessions.add({
        id: `s-${Date.now()}`,
        date: todayStr,
        startedAt: Date.now(),
        finishedAt: Date.now(),
        checkedIn: true,
        newSenses: 0, reviewedSenses: 0, correct: 0, wrong: 0, durationMs: 0,
      })
    }
    await refreshSessions()
  }

  return (
    <div className="anim-up">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-[22px] font-extrabold text-gray-900">{greeting}，{profile?.nickname || '同学'}</h1>
          <p className="text-[12px] text-gray-400 mt-0.5">
            {profile
              ? `${IDENTITY_LABEL[profile.identity]} · ${profile.level} · ${GOAL_LABEL[profile.goal]}`
              : '游客试学 · 数据保存在本机'}
          </p>
        </div>
        <button
          onClick={handleCheckIn}
          disabled={checkedIn}
          className={`relative flex flex-col items-center px-4 py-2 rounded-2xl transition-all active:scale-95 ${
            checkedIn ? 'bg-[#EAF8EF] text-[#3BA65B]' : 'bg-gradient-to-br from-[#FF6A5F] to-[#F04444] text-white shadow-lg shadow-red-200'
          }`}
        >
          <IconFlame width={22} height={22} className={checkedIn ? '' : 'drop-shadow'} />
          <span className="text-[11px] font-bold mt-0.5">{checkedIn ? '已打卡' : '打卡'}</span>
        </button>
      </div>

      {!profile && (
        <div className="card p-3.5 mb-3 flex items-center gap-3 border-[#FFE3D6] bg-[#FFF8F5]">
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-bold text-gray-800">游客试学</div>
            <div className="text-[11px] text-gray-500 mt-0.5">还可作答 {guestLeft} / {guest.limit} 题，建立档案后解锁完整计划</div>
          </div>
          <button onClick={() => nav('/onboarding')} className="btn-primary px-3 py-2 text-[12px] font-bold shrink-0">
            建立档案
          </button>
        </div>
      )}

      <div className="card p-5 mb-3">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[14px] font-bold text-gray-700">今日计划</span>
          <span className="flex items-center gap-1 text-[12px] font-bold text-[#F5A623]">
            <IconFlame width={14} height={14} /> {streak} 天连续
          </span>
        </div>

        <div className="flex items-center gap-5">
          <ProgressRing progress={pct} size={104} stroke={9}>
            <div className="text-[22px] font-extrabold text-gray-900 leading-none">{pct}%</div>
            <div className="text-[9px] text-gray-400 mt-1">已掌握</div>
          </ProgressRing>

          <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-3">
            <StatTile label="学习中" value={learning} accent="#FF5252" />
            <StatTile label="已掌握" value={mastered} accent="#4EBF6D" />
            <StatTile label="已学" value={learned} accent="#3B82F6" />
            <StatTile label="总词数" value={total} accent="#8F7BFF" />
          </div>
        </div>

        <div className="mt-5">
          <div className="flex justify-between text-[11px] text-gray-400 mb-1.5">
            <span>总进度</span>
            <span className="font-bold text-gray-500">{learned}/{total}</span>
          </div>
          <ProgressBar current={learned} total={total} />
        </div>
      </div>

      <button
        onClick={handleStart}
        disabled={planTotal === 0}
        className={`btn-primary w-full py-4.5 text-[17px] font-extrabold tracking-wide ${planTotal === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {guestBlocked
          ? '试学完成 · 建立档案继续'
          : todayDone
            ? '今日任务已完成'
            : `${todayCount > 0 ? '继续背单词' : '开始背单词'} · ${planTotal} 词`}
      </button>

      {planTotal > 0 && (
        <div className="mt-2 text-center text-[11px] text-gray-400">
          新词 {remainingNew} 个 · 到期复习 {remainingDue} 个
        </div>
      )}

      {!todayDone && planTotal > 0 && (
        <div className="mt-2.5 text-center text-[11px] text-gray-400">
          {checkedIn ? '今天已打卡，完成任务保持连胜' : '完成后别忘了打卡保持连胜'}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5 mt-4">
        <QuickCard icon={<IconBook width={22} height={22} />} label="错词本" sub="按错误次数复习" onClick={() => nav('/wrong')} />
        <QuickCard icon={<span className="text-[20px]">⌕</span>} label="查词" sub="搜索汉字 / 假名 / 罗马音" onClick={() => nav('/search')} />
        <QuickCard icon={<IconTrophy width={22} height={22} />} label="学习统计" sub="进度与正确率" onClick={() => nav('/stats')} />
        <QuickCard icon={<IconClock width={22} height={22} />} label="功能设置" sub="训练参数与提示" onClick={() => nav('/settings')} />
      </div>

      <div className="card p-4 mt-3 flex justify-around">
        <StatTile label="今日训练" value={todayCount} accent="#3B82F6" />
        <StatTile label="今日答对" value={todayCorrect} accent="#4EBF6D" />
        <StatTile label="今日剩余" value={planTotal} accent="#FF5252" />
      </div>
    </div>
  )
}

function QuickCard({ icon, label, sub, onClick }: {
  icon: React.ReactNode; label: string; sub: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="card p-3.5 flex flex-col items-center text-center hover:shadow-md transition-shadow active:scale-97">
      <span className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#FFF5F5] text-[#FF5252] mb-2">{icon}</span>
      <span className="text-[13px] font-semibold text-gray-800">{label}</span>
      <span className="text-[10px] text-gray-400 mt-0.5">{sub}</span>
    </button>
  )
}
