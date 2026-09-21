import { useEffect, useState } from 'react'
import { db } from '../db/schema'
import { n5Words } from '../data/n5-words'

export default function Stats() {
  const [stats, setStats] = useState({
    mastered: 0,
    learning: 0,
    new_: 0,
    filtered: 0,
    totalWords: 0,
    sessionCount: 0,
    totalDuration: 0,
    streak: 0,
    todayFinished: false,
  })

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    const records = await db.records.toArray()
    const sessions = await db.sessions.toArray()

    const mastered = records.filter(r => r.status === 'mastered').length
    const learning = records.filter(r => r.status === 'learning').length
    const new_ = records.filter(r => r.status === 'new').length
    const filtered = records.filter(r => r.status === 'filtered').length

    const totalDuration = sessions.reduce((sum, s) => sum + (s.studyDuration || 0), 0)

    const today = new Date().toISOString().slice(0, 10)
    const todaySession = sessions.find(s => s.date === today)
    const todayFinished = todaySession?.checkedIn || false

    let streak = 0
    for (let i = 0; i < 365; i++) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const ds = d.toISOString().slice(0, 10)
      if (sessions.find(s => s.date === ds && s.checkedIn)) streak++
      else if (i > 0) break
    }

    setStats({
      mastered, learning, new_, filtered,
      totalWords: n5Words.length,
      sessionCount: sessions.length,
      totalDuration, streak, todayFinished,
    })
  }

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return h > 0 ? `${h}時間${m}分` : `${m}分`
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-4">📊 学習統計</h2>

      {/* Mastery overview */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
        <h3 className="text-sm font-medium text-gray-500 mb-3">習得概況</h3>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 rounded-full border-4 border-red-200 flex items-center justify-center">
            <span className="text-xl font-bold text-red-500">
              {stats.totalWords > 0 ? Math.round((stats.mastered / stats.totalWords) * 100) : 0}%
            </span>
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-green-600">✅ 習得済</span>
              <span className="font-bold">{stats.mastered}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-amber-600">📖 学習中</span>
              <span className="font-bold">{stats.learning + stats.new_}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">📚 総単語</span>
              <span className="font-bold">{stats.totalWords}</span>
            </div>
          </div>
        </div>

        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-red-400 rounded-full transition-all" style={{ width: `${(stats.mastered / stats.totalWords) * 100}%` }} />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-gray-800">{stats.streak}</div>
          <div className="text-xs text-gray-400">連続日数</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-gray-800">{stats.sessionCount}</div>
          <div className="text-xs text-gray-400">学習日数</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-gray-800">{formatDuration(stats.totalDuration)}</div>
          <div className="text-xs text-gray-400">総学習時間</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-gray-800">{stats.todayFinished ? '✅' : '⬜'}</div>
          <div className="text-xs text-gray-400">今日の学習</div>
        </div>
      </div>

      {/* Level breakdown */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-medium text-gray-500 mb-3">レベル別単語数</h3>
        {['N5', 'N4', 'N3', 'N2', 'N1'].map(level => {
          const total = n5Words.filter(w => w.jlptLevel === level).length
          return (
            <div key={level} className="flex items-center gap-3 mb-2">
              <span className="w-8 text-sm font-bold text-gray-700">{level}</span>
              <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-300 rounded-full" style={{ width: `${(total / stats.totalWords) * 100}%` }} />
              </div>
              <span className="text-xs text-gray-400 w-8 text-right">{total}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
