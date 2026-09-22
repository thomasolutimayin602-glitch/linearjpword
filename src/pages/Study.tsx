import { useNavigate, useLocation } from 'react-router-dom'
import { useStudyStore, speak } from '../stores/study-store'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { WORDS_BY_ID } from '../data/words'
import { DRILL_LABEL, DRILL_ORDER } from '../types'
import type { SenseState } from '../types'
import CountdownTimer from '../components/CountdownTimer'
import AudioPlayer from '../components/AudioPlayer'
import ProgressBar from '../components/ProgressBar'
import { IconBack, IconRefresh } from '../components/icons'

const LETTERS = ['A', 'B', 'C', 'D']

export default function Study() {
  const nav = useNavigate()
  const location = useLocation()
  const store = useStudyStore()
  const r = store.runtime

  const [input, setInput] = useState('')


  useEffect(() => {
    if (r.state === 'idle') {
      if (location.state?.from !== 'wrong') nav('/', { replace: true })
    }
  }, [r.state, nav, location.state])

  const w = r.current != null ? WORDS_BY_ID.get(r.current) : undefined
  const rec: SenseState | undefined = r.current != null ? store.states.get(r.current) : undefined
  const mode = DRILL_ORDER[Math.min(r.modePos, DRILL_ORDER.length - 1)]
  const queueLen = r.queue.length + (r.current != null ? 1 : 0)

  const isFeedback = r.feedback !== null
  const isListen = mode === 'listen'
  const isSpell = mode === 'spell'
    const isWordMode = mode === 'word'

  const timerSeconds = mode === 'meaning' ? store.settings.meaningTimer : store.settings.wordTimer

  const handleAnswer = useCallback((index: number) => {
    if (isFeedback) return
    store.answerMeaningWord(index)
  }, [isFeedback, store])

  const handleSpellSubmit = useCallback(() => {
    if (isFeedback) return
    store.answerSpelling(input)
  }, [isFeedback, input, store])

  const handleExpire = useCallback(() => {
    if (isFeedback) return
    store.notSure()
  }, [isFeedback, store])

  const handleNext = useCallback(() => {
    store.proceed()
    setInput('')
  }, [store])

  // Auto-pronounce on a fresh listen question
  const canSpeak = useMemo(() => isListen && !isFeedback, [isListen, isFeedback])
  useEffect(() => {
    if (canSpeak && store.settings.autoPronounce && w) {
      const t = setTimeout(() => speak(w.kana), 200)
      return () => clearTimeout(t)
    }
  }, [r.current, r.modePos, canSpeak, store.settings.autoPronounce])

  // Spelling input auto-focus
  useEffect(() => {
    if (isSpell && !isFeedback) {
      const el = document.getElementById('spell-input')
      const t = setTimeout(() => el?.focus(), 60)
      return () => clearTimeout(t)
    }
  }, [r.current, r.modePos, isSpell, isFeedback])

  // ===== Summary =====
  if (r.state === 'summary') {
    return <Summary store={store} onDone={() => { store.quit(); nav('/') }} />
  }

  if (!w || !rec || r.state !== 'drill') return null

  const opts = r.question?.options ?? []
  const correctIdx = r.question?.correct ?? -1
  const fb = r.feedback

  return (
    <div className="anim-up">
      {/* ===== Header ===== */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => nav('/')} aria-label="Back" className="w-9 h-9 flex items-center justify-center rounded-full bg-white text-gray-500 border border-gray-100 shadow-sm active:scale-90 transition-all">
          <IconBack width={20} height={20} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h1 className="text-[15px] font-bold text-gray-800">{DRILL_LABEL[mode]}</h1>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gray-400 tabular-nums">
                {r.done.sensePasses + 1} / {queueLen}
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${rec.mastery >= 90 ? 'bg-[#EAF8EF] text-[#3BA65B]' : 'bg-[#FFF0F0] text-[#FF5252]'}`}>
                {rec.mastery}%
              </span>
            </div>
          </div>
          <ProgressBar current={r.done.sensePasses + 1} total={queueLen} className="mt-1.5" />
        </div>
      </div>

      {/* ===== Question card ===== */}
      <div key={`${r.current}-${r.modePos}`} className="card p-5 anim-pop">
        {/* ===== LISTEN ===== */}
        {isListen && (
          <div className="text-center py-2">
            <div className="mb-2 text-[12px] text-gray-400">Read the new word aloud</div>
            <div className="text-[40px] font-bold tracking-wide text-gray-900 leading-tight">{w.word || w.kana}</div>
            {w.word !== w.kana && <div className="text-[20px] text-gray-400 mt-1">{w.kana}</div>}
            <div className="text-[13px] text-gray-500 mt-1.5">{w.romaji}</div>
            <div className="flex items-center justify-center gap-3 mt-4">
              <AudioPlayer text={w.kana} size={56} />
            </div>
            <div className="text-[12px] text-gray-400 mt-3">👂 Listen, then say it out loud</div>
            <button
              onClick={handleNext}
              className="btn-primary w-full py-4 text-[16px] font-bold mt-5"
            >
              跟读完成，继续 →
            </button>
          </div>
        )}

        {/* ===== MEANING (选义) ===== */}
        {mode === 'meaning' && (
          <div>
            <div className="flex items-start justify-between mb-1">
              <div className="text-center flex-1">
                <div className="text-[34px] font-bold text-gray-900 tracking-wide">{w.kana}</div>
                {w.word !== w.kana && <div className="text-[14px] text-gray-400">{w.word}</div>}
                <div className="flex items-center justify-center gap-2 mt-1">
                  <AudioPlayer text={w.kana} size={36} />
                  <span className="text-[11px] text-gray-400">{w.pos}</span>
                </div>
              </div>
              <div className="mt-1">
                <CountdownTimer seconds={timerSeconds} onExpire={handleExpire} running={!isFeedback} key={`${r.current}-${r.modePos}`} />
              </div>
            </div>
            <div className="text-[12px] text-gray-500 mt-2 mb-3">Choose the correct meaning</div>
            <ChoiceOptions
              opts={opts} correctIdx={correctIdx} isFeedback={isFeedback} fb={fb!}
              onPick={handleAnswer}
            />
            {isFeedback && <FeedbackPanel w={w} fb={fb!} correctText={w.meaning} />}
            {!isFeedback && <NotSureButton onNotSure={() => store.notSure()} />}
          </div>
        )}

        {/* ===== WORD (选词) ===== */}
        {isWordMode && (
          <div>
            <div className="flex items-start justify-between mb-1">
              <div className="text-center flex-1">
                <div className="text-[22px] font-bold text-gray-800 leading-tight">{w.meaning}</div>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <AudioPlayer text={w.kana} size={36} />
                  <span className="text-[11px] text-gray-400">{w.pos}</span>
                </div>
              </div>
              <div className="mt-1">
                <CountdownTimer seconds={timerSeconds} onExpire={handleExpire} running={!isFeedback} key={`${r.current}-${r.modePos}`} />
              </div>
            </div>
            <div className="text-[12px] text-gray-500 mt-2 mb-3">Choose the correct word</div>
            <ChoiceOptions
              opts={opts} correctIdx={correctIdx} isFeedback={isFeedback} fb={fb!}
              onPick={handleAnswer}
            />
            {isFeedback && <FeedbackPanel w={w} fb={fb!} correctText={`${w.word || w.kana} ・ ${w.kana}`} />}
            {!isFeedback && <NotSureButton onNotSure={() => store.notSure()} />}
          </div>
        )}

        {/* ===== SPELLING (拼写) ===== */}
        {isSpell && (
          <div>
            <div className="flex items-start justify-between mb-1">
              <div className="text-center flex-1">
                <div className="text-[22px] font-bold text-gray-800 leading-tight">{w.meaning}</div>
                {w.word && <div className="text-[13px] text-gray-400 mt-0.5">{w.word}</div>}
                <div className="flex items-center justify-center mt-2">
                  <AudioPlayer text={w.kana} size={36} />
                </div>
              </div>
              <div className="mt-1 w-[44px] text-right text-gray-200" aria-hidden />
            </div>
            <div className="text-[12px] text-gray-500 mt-2 mb-3">Type the rōmaji</div>

            <div className={`rounded-2xl p-4 mb-3 ${isFeedback ? (fb?.correct ? 'bg-[#EAF8EF] border border-[#C8EACF]' : 'bg-[#FFF0F0] border border-[#FFD9D9]') : 'bg-gray-50 border border-gray-100'}`}>
              <input
                id="spell-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSpellSubmit() }}
                disabled={isFeedback}
                placeholder="type romaji…"
                autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false}
                className="w-full text-center text-[30px] font-bold tracking-[0.08em] bg-transparent border-none outline-none text-gray-800 placeholder-gray-200 disabled:text-gray-500"
              />
              <SpellHint w={w} revealed={isFeedback} show={store.settings.showRomaji} />
            </div>

            {!isFeedback ? (
              <button
                onClick={handleSpellSubmit}
                disabled={!input.trim()}
                className="btn-primary w-full py-4 text-[16px] font-bold"
              >
                Check ✓
              </button>
            ) : (
              <FeedbackPanel w={w} fb={fb!} correctText={`${w.romaji} ・ ${w.kana}`} />
            )}
          </div>
        )}
      </div>

      {/* ===== Mode chain ===== */}
      <div className="flex items-center justify-center gap-1.5 mt-4 mb-2">
        {DRILL_ORDER.map((m, i) => (
          <div key={m} className="flex items-center gap-1.5">
            <div
              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors ${
                i < r.modePos
                  ? 'bg-[#EAF8EF] text-[#3BA65B]'
                  : i === r.modePos
                    ? 'bg-[#FF5252] text-white shadow-sm shadow-red-200'
                    : 'bg-white text-gray-300 border border-gray-100'
              }`}
            >
              {i < r.modePos ? `✓ ${DRILL_LABEL[m]}` : i === r.modePos ? DRILL_LABEL[m] : DRILL_LABEL[m]}
            </div>
            {i < DRILL_ORDER.length - 1 && <span className="w-1 h-1 rounded-full bg-gray-300" />}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ============ sub-components ============ */

function ChoiceOptions({ opts, correctIdx, isFeedback, fb, onPick }: {
  opts: string[]
  correctIdx: number
  isFeedback: boolean
  fb: { correct: boolean; guessed?: boolean; picked?: number } | null
  onPick: (i: number) => void
}) {
  return (
    <div className="space-y-2.5">
      {opts.map((opt, i) => {
        const isCorrect = i === correctIdx
        const isPicked = fb?.picked === i
        let cls = 'border-gray-150 bg-white text-gray-800 hover:border-[#FF5252]/50 hover:bg-[#FFF8F8]'
        if (isFeedback) {
          if (isCorrect) cls = 'border-[#4EBF6D] bg-[#EAF8EF] text-[#2C8A48]'
          else if (isPicked) cls = 'border-[#FF5252] bg-[#FFF0F0] text-[#E53935]'
          else cls = 'border-gray-100 bg-gray-50 text-gray-400'
        }
        return (
          <button
            key={i}
            onClick={() => onPick(i)}
            disabled={isFeedback}
            className={`flex items-center w-full p-3.5 rounded-2xl border-2 text-left transition-all active:scale-[0.985] ${cls}`}
          >
            <span className={`w-7 h-7 flex items-center justify-center rounded-full text-[12px] font-bold mr-3 shrink-0 ${
              isFeedback && isCorrect ? 'bg-[#4EBF6D] text-white'
              : isFeedback ? 'bg-gray-200 text-gray-400'
              : 'bg-gray-100 text-gray-500'
            }`}>
              {isFeedback && isCorrect ? '✓' : LETTERS[i]}
            </span>
            <span className="text-[16px] font-medium leading-snug">{opt}</span>
          </button>
        )
      })}
    </div>
  )
}

function NotSureButton({ onNotSure }: { onNotSure: () => void }) {
  return (
    <button onClick={onNotSure} className="w-full mt-3 py-2.5 text-[13px] text-gray-400 hover:text-gray-600 transition-colors">
      ❓ I'm not sure — show the answer
    </button>
  )
}

function FeedbackPanel({ w, fb, correctText }: {
  w: NonNullable<ReturnType<typeof WORDS_BY_ID.get>>
  fb: { correct: boolean; guessed?: boolean; picked?: number } | null
  correctText: string
}) {
  const { correct, guessed } = fb ?? { correct: false, guessed: false }
  return (
    <div className="mt-4">
      <div
        className={`text-center py-3.5 rounded-2xl font-bold text-[15px] anim-pop ${
          correct ? 'bg-[#EAF8EF] text-[#2C8A48]' : 'bg-[#FFF0F0] text-[#E53935]'
        }`}
      >
        {correct ? '✓ 答对了！' : guessed ? '🤔 蒙对也算答错' : '✗ 答错了'}
      </div>
      {!correct && (
        <div className="mt-2.5 text-center">
          <div className="text-[13px] text-gray-400 mb-0.5">正确答案</div>
          <div className="text-[17px] font-bold text-gray-800">{correctText}</div>
          {w.examples[0] && (
            <div className="mt-2 text-[12px] text-gray-500">
              <div>{w.examples[0].ja}</div>
              <div className="text-gray-400">{w.examples[0].en}</div>
            </div>
          )}
        </div>
      )}
      <div className="flex gap-2.5 mt-3.5">
        <button onClick={() => useStudyStore.getState().undo()} className="btn-ghost flex-1 py-3 text-[14px] font-semibold">
          <IconRefresh width={15} height={15} className="inline -mt-0.5 mr-1" /> 反悔
        </button>
        <button onClick={() => { store_next() }} className="btn-primary flex-[2] py-3 text-[15px] font-bold">
          继续 →
        </button>
      </div>
    </div>
  )
}

function store_next() {
  const s = useStudyStore.getState()
  s.proceed()
}

function SpellHint({ w, revealed, show }: { w: NonNullable<ReturnType<typeof WORDS_BY_ID.get>>; revealed: boolean; show: boolean }) {
  if (revealed) {
    return <div className="text-center text-[15px] font-bold text-[#2C8A48] mt-2">{w.romaji} ・ {w.kana}</div>
  }
  if (!show) return null
  const hintLen = Math.max(1, Math.ceil(w.romaji.length / 3))
  return <div className="text-center text-[12px] text-[#F5A623] mt-2">hint: {w.romaji.slice(0, hintLen)}…</div>
}

function Summary({ store, onDone }: { store: ReturnType<typeof useStudyStore.getState>; onDone: () => void }) {
  const d = store.runtime.done ?? { correct: 0, wrong: 0, sensePasses: 0 }
  const correct = d.correct
  const wrong = d.wrong
  const words = d.sensePasses
  const accuracy = correct + wrong > 0 ? Math.round((correct / (correct + wrong)) * 100) : 0

  return (
    <div className="relative text-center anim-up">
      {/* confetti */}
      <div className="pointer-events-none absolute inset-x-0 top-10 overflow-hidden h-32" aria-hidden>
        {['#FF5252', '#4EBF6D', '#F5A623', '#3EC6AD', '#8F7BFF'].flatMap((c, ci) =>
          Array.from({ length: 3 }).map((_, i) => (
            <span
              key={`${ci}-${i}`}
              className="absolute w-2 h-3 rounded-sm"
              style={{
                background: c,
                left: `${14 + ci * 19 + i * 6}%`,
                top: 10,
                animation: `confetti-fall 1.1s ${i * 0.15 + ci * 0.07}s ease-in both`,
              }}
            />
          )),
        )}
      </div>

      <div className="text-[56px] mt-8 mb-2 anim-bounce">🎉</div>
      <h2 className="text-[24px] font-extrabold text-gray-900">学习完成！</h2>
      <p className="text-[13px] text-gray-400 mt-1.5">保持节奏，每一个单词都让你更接近目标</p>

      <div className="card p-5 mt-6 flex justify-around">
        <div>
          <div className="text-[30px] font-extrabold text-[#4EBF6D]">{correct}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">答对</div>
        </div>
        <div className="w-px bg-gray-100" />
        <div>
          <div className="text-[30px] font-extrabold text-[#FF5252]">{wrong}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">答错</div>
        </div>
        <div className="w-px bg-gray-100" />
        <div>
          <div className="text-[30px] font-extrabold text-gray-800">{words}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">学习词数</div>
        </div>
      </div>

      <div className="card p-4 mt-3 flex items-center gap-3">
        <div className="w-full">
          <div className="flex justify-between text-[11px] text-gray-400 mb-1.5">
            <span>本次正确率</span><span className="font-bold text-gray-600">{accuracy}%</span>
          </div>
          <ProgressBar current={accuracy} total={100} color="#4EBF6D" />
        </div>
      </div>

      {wrong > 0 && (
        <div className="mt-3 text-[12px] text-gray-400">
          💡 答错的单词已自动加入「错词本」，并会在今天稍后再次出现
        </div>
      )}

      <button onClick={onDone} className="btn-primary w-full py-4 text-[16px] font-bold mt-7">
        完成 ✓
      </button>
    </div>
  )
}
