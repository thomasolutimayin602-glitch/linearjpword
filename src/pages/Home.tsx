import { useNavigate } from 'react-router-dom'
import { useStudyStore } from '../stores/study-store'
import { useEffect, useMemo, useState } from 'react'
import { db } from '../db/schema'
import { WORDS } from '../data/words'
import ProgressRing from '../components/ProgressRing'
import StatTile from '../components/StatTile'
import ProgressBar from '../components/ProgressBar'
import { IconFlame, IconBook, IconTrophy, IconClock } from '../components/icons'

export default function Home() {
  const nav = useNavigate()
  const { hydrate, startSession } = useStudyStore()
  const [learned, setLearned] = useState(0)
  const [mastered, setMastered] = useState(0)
  const [learning, setLearning] = useState(0)
  const [streak, setStreak] = useState(0)
  const [todayDone, setTodayDone] = useState(false)
  const [checkedIn, setCheckedIn] = useState(false)
  const [todayCount, setTodayCount] = useState(0)
  const [todayCorrect, setTodayCorrect] = useState(0)

  const load = useMemo(() => async () => {
    await hydrate()
    const states = await db.states.toArray()
    const sessions = await db.sessions.toArray()
    setLearned(states.filter(s => s.status !== 'new').length)
    setMastered(states.filter(s => s.status === 'archived').length)
    setLearning(states.filter(s => s.status === 'learning' || s.status === 'new').length)
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const todays = sessions.filter(s => s.date === todayStr)
    setTodayDone(todays.some(s => s.finishedAt !== null && s.checkedIn))
    setCheckedIn(todays.some(s => s.checkedIn))
    setTodayCount(todays.length)
    setTodayCorrect(todays.reduce((a, s) => a + s.correct, 0))
    let st = 0
    for (let i = 0; i < 365; i++) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      if (sessions.find(s => s.date === ds && s.checkedIn)) st++
      else if (i > 0) break
    }
    setStreak(st)
  }, [hydrate])

  useEffect(() => { load() }, [load])

  const handleStart = async () => {
    await startSession()
    nav('/study')
  }

  const handleCheckIn = async () => {
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const sessions = await db.sessions.toArray()
    const todaySession = sessions.find(s => s.date === todayStr)
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
    setCheckedIn(true)
    await load()
  }

  const total = WORDS.length
  const pct = total > 0 ? Math.round((mastered / total) * 100) : 0
  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 5) return 'Good night'
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  })()

  return (
    <div className="anim-up">
      {/* header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-[22px] font-extrabold text-gray-900">{greeting}!</h1>
          <p className="text-[12px] text-gray-400 mt-0.5">Let's learn Japanese today</p>
        </div>
        <button
          onClick={handleCheckIn}
          disabled={checkedIn}
          className={`relative flex flex-col items-center px-4 py-2 rounded-2xl transition-all active:scale-95 ${
            checkedIn ? 'bg-[#EAF8EF] text-[#3BA65B]' : 'bg-gradient-to-br from-[#FF6A5F] to-[#F04444] text-white shadow-lg shadow-red-200'
          }`}
        >
          <IconFlame width={22} height={22} className={checkedIn ? '' : 'drop-shadow'} />
          <span className="text-[11px] font-bold mt-0.5">{checkedIn ? 'Checked in' : 'Check in'}</span>
        </button>
      </div>

      {/* today plan card */}
      <div className="card p-5 mb-3">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[14px] font-bold text-gray-700">Today's Plan</span>
          <span className="flex items-center gap-1 text-[12px] font-bold text-[#F5A623]">
            <IconFlame width={14} height={14} /> {streak}-day streak
          </span>
        </div>

        <div className="flex items-center gap-5">
          <ProgressRing progress={pct} size={104} stroke={9}>
            <div className="text-[22px] font-extrabold text-gray-900 leading-none">{pct}%</div>
            <div className="text-[9px] text-gray-400 mt-1">MASTERED</div>
          </ProgressRing>

          <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-3">
            <StatTile label="Learning" value={learning} accent="#FF5252" />
            <StatTile label="Mastered" value={mastered} accent="#4EBF6D" />
            <StatTile label="Studied" value={learned} accent="#3B82F6" />
            <StatTile label="Total words" value={total} accent="#8F7BFF" />
          </div>
        </div>

        <div className="mt-5">
          <div className="flex justify-between text-[11px] text-gray-400 mb-1.5">
            <span>Overall progress</span>
            <span className="font-bold text-gray-500">{learned}/{total}</span>
          </div>
          <ProgressBar current={learned} total={total} />
        </div>
      </div>

      {/* start button */}
      <button
        onClick={handleStart}
        className="btn-primary w-full py-4.5 text-[17px] font-extrabold tracking-wide"
      >
        {todayDone ? '继续背单词' : '开始背单词'}
      </button>

      {!todayDone && (
        <div className="mt-2.5 text-center text-[11px] text-gray-400">
          {checkedIn ? '今天已打卡，完成任务保持连胜' : '完成后别忘了打卡保持连胜'}
        </div>
      )}

      {/* quick actions */}
      <div className="grid grid-cols-3 gap-2.5 mt-4">
        <QuickCard icon={<IconBook width={22} height={22} />} label="Wrong Words" sub="错词本" onClick={() => nav('/wrong')} />
        <QuickCard icon={<IconTrophy width={22} height={22} />} label="Stats" sub="学习统计" onClick={() => nav('/stats')} />
        <QuickCard icon={<IconClock width={22} height={22} />} label="Settings" sub="功能设置" onClick={() => nav('/settings')} />
      </div>

      {/* today stats */}
      <div className="card p-4 mt-3 flex justify-around">
        <StatTile label="Sessions today" value={todayCount} accent="#3B82F6" />
        <StatTile label="Correct today" value={todayCorrect} accent="#4EBF6D" />
        <StatTile label="Words in bank" value={learning} accent="#FF5252" />
      </div>
    </div>
  )
}

function QuickCard({ icon, label, sub, onClick }: {
  to?: string; icon: React.ReactNode; label: string; sub: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="card p-3.5 flex flex-col items-center text-center hover:shadow-md transition-shadow active:scale-97">
      <span className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#FFF5F5] text-[#FF5252] mb-2">{icon}</span>
      <span className="text-[13px] font-semibold text-gray-800">{label}</span>
      <span className="text-[10px] text-gray-400 mt-0.5">{sub}</span>
    </button>
  )
}
