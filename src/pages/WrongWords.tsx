import { useEffect, useState } from 'react'
import { db } from '../db/schema'
import { n5Words } from '../data/n5-words'
import type { StudyRecord, WordEntry } from '../types'

interface WrongWordItem {
  word: WordEntry
  record: StudyRecord
}

export default function WrongWords() {
  const [items, setItems] = useState<WrongWordItem[]>([])
  const [expandedId, setExpandedId] = useState<number | null>(null)

  useEffect(() => {
    loadWrongWords()
  }, [])

  const loadWrongWords = async () => {
    const records = await db.records.toArray()
    const wrongRecs = records
      .filter(r => r.status === 'learning' && r.totalWrong > 0)
      .sort((a, b) => b.totalWrong - a.totalWrong || (b.lastWrongAt || 0) - (a.lastWrongAt || 0))

    const result: WrongWordItem[] = []
    for (const rec of wrongRecs) {
      const word = n5Words.find(w => w.id === rec.wordId)
      if (word) result.push({ word, record: rec })
    }
    setItems(result)
  }

  const togglePin = async (wordId: number, current: boolean) => {
    const record = await db.records.get(wordId)
    if (record) {
      await db.records.put({ ...record, pinned: !current })
      loadWrongWords()
    }
  }

  const removeWord = async (wordId: number) => {
    const existing = await db.records.get(wordId); if (existing) { await db.records.put({ ...existing, status: 'filtered' as const }); } else { await db.records.put({ wordId, status: 'filtered' as const, masteryLevel: 0, consecutiveCorrect: 0, consecutiveWrong: 0, totalCorrect: 0, totalWrong: 0, sessionWrong: 0, sessionCorrect: 0, lastCorrectAt: null, lastWrongAt: null, nextReviewAt: null, pinned: false, isInCurrentSession: false }); }
    loadWrongWords()
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-4">❌ 錯詞本</h2>
      <p className="text-sm text-gray-400 mb-4">答錯次數多的單詞排在最前面</p>

      {items.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-4xl mb-3">🎉</div>
          <p>暫無錯詞，繼續加油！</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(({ word, record }) => (
            <div
              key={word.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <button
                onClick={() => setExpandedId(expandedId === word.id ? null : word.id)}
                className="w-full p-4 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors"
              >
                {record.pinned && <span className="text-amber-500">⭐</span>}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800">{word.kanji || word.kana}</div>
                  <div className="text-xs text-gray-400">{word.kana}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-red-400">{record.totalWrong}</div>
                  <div className="text-xs text-gray-400">錯{record.totalCorrect > 0 ? ` / 對${record.totalCorrect}` : ''}</div>
                </div>
              </button>

              {expandedId === word.id && (
                <div className="px-4 pb-4 border-t border-gray-50 pt-3">
                  <div className="text-sm text-gray-600 mb-2">📖 {word.definition}</div>
                  {word.examples.length > 0 && (
                    <div className="text-xs text-gray-400 mb-3">
                      <div>{word.examples[0].japanese}</div>
                      <div>{word.examples[0].chinese}</div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => togglePin(word.id, record.pinned)}
                      className={`px-3 py-1 text-xs rounded-lg ${record.pinned ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600 hover:bg-amber-50'}`}
                    >
                      {record.pinned ? '取消置頂' : '⭐ 置頂'}
                    </button>
                    <button
                      onClick={() => removeWord(word.id)}
                      className="px-3 py-1 text-xs rounded-lg bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500"
                    >
                      ✔ 已掌握
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
