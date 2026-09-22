import { useEffect, useState } from 'react'
import { db } from '../db/schema'
import { WORDS } from '../data/words'
import type { SenseState, SessionRecord } from '../types'
import ProgressBar from '../components/ProgressBar'
import { IconFlame, IconTrophy, IconBook, IconChart } from '../components/icons'

export default function Stats() {
  const [states, setStates] = useState<SenseState[]>([])
  const [sessions, setSessions] = useState<SessionRecord[]>([])

  useEffect(() => {
    Promise.all([
      db.states.toArray(),
      db.sessions.toArray(),
    ]).then(([s, ses]) => { setStates(s); setSessions(ses) })
  }, [])

  const learned = states.filter(s => s.status !== 'new').length
  const mastered = states.filter(s => s.status === 'archived').length
  const learning = states.filter(s => s.status === 'learning' || s.status === 'new').length
    const totalCorrect = states.reduce((a, s) => a + s.totalCorrect, 0)
  const totalWrong = states.reduce((a, s) => a + s.totalWrong, 0)
  const accuracy = totalCorrect + totalWrong > 0 ? Math.round((totalCorrect / (totalCorrect + totalWrong)) * 100) : 0

  let streak = 0
  for (let i = 0; i < 365; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (sessions.find(s => s.date === ds && s.checkedIn)) streak++
    else if (i > 0) break
  }

  const today = new Date().toISOString().slice(0, 10)
  const todaySessions = sessions.filter(s => s.date === today)
  const todayCorrect = todaySessions.reduce((a, s) => a + s.correct, 0)
  const todayWrong = todaySessions.reduce((a, s) => a + s.wrong, 0)

  return (
    <div className="anim-up">
      <h1 className="text-[22px] font-extrabold text-gray-900 mb-1">学习统计</h1>
      <p className="text-[12px] text-gray-400 mb-4">查看你的学习进度与积累</p>

      {/* streak */}
      <div className="card p-4 mb-3 flex items-center justify-between">
        <span className="flex items-center gap-2 text-[14px] font-bold text-gray-700">
          <IconFlame width={20} height={20} className="text-[#F5A623]" />
          连续打卡
        </span>
        <span className="text-[28px] font-extrabold text-[#F5A623]">{streak}<span className="text-[14px] font-normal text-gray-400"> 天</span></span>
      </div>

      {/* big stats */}
      <div className="card p-5 mb-3">
        <div className="flex justify-around mb-5">
          <div className="text-center">
            <div className="text-[36px] font-extrabold text-[#3B82F6]">{learned}</div>
            <div className="text-[11px] text-gray-400 mt-0.5">已学单词</div>
          </div>
          <div className="w-px bg-gray-100" />
          <div className="text-center">
            <div className="text-[36px] font-extrabold text-[#4EBF6D]">{mastered}</div>
            <div className="text-[11px] text-gray-400 mt-0.5">已掌握</div>
          </div>
          <div className="w-px bg-gray-100" />
          <div className="text-center">
            <div className="text-[36px] font-extrabold text-[#FF5252]">{learning}</div>
            <div className="text-[11px] text-gray-400 mt-0.5">学习中</div>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[11px] text-gray-400 mb-1.5">
            <span>总正确率</span>
            <span className="font-bold text-gray-600">{accuracy}%</span>
          </div>
          <ProgressBar current={accuracy} total={100} color="#4EBF6D" />
        </div>
      </div>

      {/* today */}
      <div className="card p-4 mb-3">
        <div className="text-[13px] font-bold text-gray-700 mb-4">
          <IconBook width={16} height={16} className="inline -mt-0.5 mr-1.5" />
          今日训练记录
        </div>
        <div className="flex justify-around">
          <div className="text-center">
            <div className="text-[22px] font-extrabold text-[#4EBF6D]">{todayCorrect}</div>
            <div className="text-[10px] text-gray-400">答对</div>
          </div>
          <div className="text-center">
            <div className="text-[22px] font-extrabold text-[#FF5252]">{todayWrong}</div>
            <div className="text-[10px] text-gray-400">答错</div>
          </div>
          <div className="text-center">
            <div className="text-[22px] font-extrabold text-gray-600">{todaySessions.length}</div>
            <div className="text-[10px] text-gray-400">训练次数</div>
          </div>
        </div>
      </div>

      {/* JLPT levels */}
      <div className="card p-4 mb-3">
        <div className="text-[13px] font-bold text-gray-700 mb-4">
          <IconChart width={16} height={16} className="inline -mt-0.5 mr-1.5" />
          JLPT Level 分布
        </div>
        {['N5', 'N4', 'N3', 'N2', 'N1'].map(l => {
          const totalForLevel = WORDS.filter(w => w.level === l).length
          const masteredForLevel = states.filter(s => WORDS.find(w => w.id === s.senseId)?.level === l && s.status === 'archived').length
          return (
            <div key={l} className="flex items-center gap-3 mb-2 last:mb-0">
              <span className="w-7 text-[11px] font-bold text-gray-500">{l}</span>
              <div className="flex-1">
                <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                  <span>{masteredForLevel}/{totalForLevel}</span>
                  <span>{totalForLevel > 0 ? Math.round(masteredForLevel / totalForLevel * 100) : 0}%</span>
                </div>
                <ProgressBar current={masteredForLevel} total={totalForLevel} color="#8F7BFF" />
              </div>
            </div>
          )
        })}
      </div>

      {/* cumulative */}
      <div className="card p-4">
        <div className="text-[13px] font-bold text-gray-700 mb-4">
          <IconTrophy width={16} height={16} className="inline -mt-0.5 mr-1.5" />
          累计拓词
        </div>
        <div className="flex justify-around">
          <div className="text-center">
            <div className="text-[20px] font-extrabold text-gray-800">{totalCorrect}</div>
            <div className="text-[10px] text-gray-400">累计答对</div>
          </div>
          <div className="text-center">
            <div className="text-[20px] font-extrabold text-gray-800">{totalWrong}</div>
            <div className="text-[10px] text-gray-400">累计答错</div>
          </div>
          <div className="text-center">
            <div className="text-[20px] font-extrabold text-gray-800">{sessions.length}</div>
            <div className="text-[10px] text-gray-400">训练次数</div>
          </div>
        </div>
      </div>
    </div>
  )
}
