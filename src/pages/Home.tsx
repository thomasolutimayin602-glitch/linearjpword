import { useNavigate } from 'react-router-dom'
import { useStudyStore } from '../stores/study-store'
import { useEffect, useState } from 'react'
import { db } from '../db/schema'

export default function Home() {
  const navigate = useNavigate()
  const { isActive, startSession, loadRecords } = useStudyStore()
  const [stats, setStats] = useState({ mastered: 0, learning: 0, total: 0, streak: 0 })

  useEffect(() => {
    loadRecords()
    loadStats()
  }, [])

  const loadStats = async () => {
    const allRecords = await db.records.toArray()
    const sessions = await db.sessions.toArray()
    const mastered = allRecords.filter(r => r.status === 'mastered').length
    const learning = allRecords.filter(r => r.status === 'learning' || r.status === 'new').length
    // Count streak from recent sessions
    let streak = 0
    const today = new Date()
    for (let i = 0; i < 365; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)
      const session = sessions.find(s => s.date === dateStr && s.checkedIn)
      if (session) streak++
      else if (i > 0) break
    }
    setStats({ mastered, learning, total: allRecords.length, streak })
  }

  const handleStart = async () => {
    if (!isActive) {
      await startSession()
    }
    navigate('/study')
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      {/* Greeting */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">
          おはようございます！
        </h2>
        <p className="text-gray-400 text-sm">今日も頑張りましょう</p>
      </div>

      {/* Stats card */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-500">今日の計画</span>
          <span className="text-xs text-gray-400">
            連続 {stats.streak} 日
          </span>
        </div>

        <div className="flex gap-4 mb-4">
          <div className="flex-1 text-center">
            <div className="text-2xl font-bold text-red-500">{stats.learning}</div>
            <div className="text-xs text-gray-400">学習中</div>
          </div>
          <div className="flex-1 text-center">
            <div className="text-2xl font-bold text-green-500">{stats.mastered}</div>
            <div className="text-xs text-gray-400">習得済</div>
          </div>
          <div className="flex-1 text-center">
            <div className="text-2xl font-bold text-gray-600">{stats.total}</div>
            <div className="text-xs text-gray-400">累計</div>
          </div>
        </div>

        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-red-400 rounded-full transition-all"
            style={{ width: `${stats.total > 0 ? (stats.mastered / stats.total) * 100 : 0}%` }}
          />
        </div>
        <div className="text-right text-xs text-gray-400 mt-1">
          {stats.total > 0 ? Math.round((stats.mastered / stats.total) * 100) : 0}% 完成
        </div>
      </div>

      {/* Start button */}
      <button
        onClick={handleStart}
        className="w-full py-4 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-bold text-lg rounded-2xl shadow-lg shadow-red-200 transition-all active:scale-[0.98] mb-4"
      >
        {isActive ? '続きを勉強する' : '勉強を始める'}
      </button>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate('/wrong')}
          className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm text-left hover:bg-gray-50 transition-colors"
        >
          <div className="text-lg mb-1">❌</div>
          <div className="font-medium text-gray-800 text-sm">錯詞本</div>
          <div className="text-xs text-gray-400">復習が必要な単語</div>
        </button>
        <button
          onClick={() => navigate('/stats')}
          className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm text-left hover:bg-gray-50 transition-colors"
        >
          <div className="text-lg mb-1">📊</div>
          <div className="font-medium text-gray-800 text-sm">学習統計</div>
          <div className="text-xs text-gray-400">進捗を確認</div>
        </button>
      </div>
    </div>
  )
}
