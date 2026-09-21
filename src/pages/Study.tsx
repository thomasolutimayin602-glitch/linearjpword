import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStudyStore } from '../stores/study-store'
import { useSettingsStore } from '../stores/settings-store'
import CountdownTimer from '../components/CountdownTimer'
import AudioPlayer from '../components/AudioPlayer'
import KanaKeyboard from '../components/KanaKeyboard'
import ProgressBar from '../components/ProgressBar'
import type { TrainingMode } from '../types'

export default function Study() {
  const navigate = useNavigate()
  const {
    isActive, sessionWords, quiz,
    currentMode, completedWords, wrongWords,
    answerQuiz, markUnsure, nextWord, setMode,
  } = useStudyStore()
  const { settings } = useSettingsStore()

  const [feedbackClass, setFeedbackClass] = useState('')
  const [feedbackText, setFeedbackText] = useState('')
  const [, setShowContext] = useState(false)
  const [spellInput, setSpellInput] = useState('')
  const [timerKey, setTimerKey] = useState(0)

  const totalWords = sessionWords.length
  const completed = completedWords.length

  // Redirect if not active
  useEffect(() => {
    if (!isActive) {
      navigate('/')
    }
  }, [isActive, navigate])

  const handleExpire = useCallback(() => {
    if (quiz && !quiz.showAnswer) {
      markUnsure()
      setFeedbackClass('bg-red-50 border-red-200')
      setFeedbackText('⏰ 時間切れ')
    }
  }, [quiz, markUnsure])

  const handleAnswer = (index: number) => {
    if (quiz?.showAnswer) return
    answerQuiz(index)
    const isCorrect = index === quiz?.correctIndex
    setFeedbackClass(isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200')
    setFeedbackText(isCorrect ? '✅ 正解！' : '❌ 不正解')
    if (!isCorrect) {
      setTimerKey(k => k + 1)
    }
  }

  const handleNext = () => {
    setFeedbackClass('')
    setFeedbackText('')
    setShowContext(false)
    setSpellInput('')
    setTimerKey(k => k + 1)
    nextWord()
  }

  const handleSpellingSubmit = () => {
    if (!quiz || !spellInput) return
    const isCorrect = spellInput === quiz.word.kana
    if (isCorrect) {
      answerQuiz(0)
    } else {
      answerQuiz(-1)
    }
    setFeedbackClass(isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200')
    setFeedbackText(isCorrect ? '✅ 正解！' : `❌ 不正解: ${quiz.word.kana}`)
  }

  const handleSpellingSkip = () => {
    if (!quiz) return
    markUnsure()
    setFeedbackClass('bg-red-50 border-red-200')
    setFeedbackText(`正解: ${quiz.word.kana}`)
    setTimerKey(k => k + 1)
  }

  const switchMode = (mode: TrainingMode) => {
    setMode(mode)
    setFeedbackClass('')
    setFeedbackText('')
    setShowContext(false)
    setSpellInput('')
    setTimerKey(k => k + 1)
    // Re-queue all session words for the new mode
    const newQueue = [...sessionWords].sort(() => Math.random() - 0.5)
    useStudyStore.setState({ sessionQueue: newQueue, currentIndex: 0, quiz: null })
    setTimeout(() => nextWord(), 100)
  }

  if (!quiz) {
    const allDone = sessionWords.length > 0 && completedWords.length >= sessionWords.length
    return (
      <div className="p-4 max-w-lg mx-auto">
        <div className="text-center py-20">
          {allDone ? (
            <>
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">おめでとう！</h2>
              <p className="text-gray-500 mb-6">今日の学習が完了しました</p>
              <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
                <div className="text-sm text-gray-400 mb-2">学習結果</div>
                <div className="flex justify-around">
                  <div><span className="text-green-500 font-bold">{completedWords.length - wrongWords.length}</span><span className="text-gray-400 text-xs"> 正解</span></div>
                  <div><span className="text-red-500 font-bold">{wrongWords.length}</span><span className="text-gray-400 text-xs"> 要復習</span></div>
                  <div><span className="text-gray-600 font-bold">{sessionWords.length}</span><span className="text-gray-400 text-xs"> 完了</span></div>
                </div>
              </div>
              <button onClick={() => navigate('/')} className="px-8 py-3 bg-red-500 text-white rounded-xl font-bold">
                完了
              </button>
            </>
          ) : (
            <p className="text-gray-400">準備中...</p>
          )}
        </div>
      </div>
    )
  }

  const timerDuration = currentMode === 'select-meaning' ? settings.selectMeaningTimer : settings.selectWordTimer

  return (
    <div className="p-4 max-w-lg mx-auto">
      {/* Progress & mode info */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-500">
            {currentMode === 'listen' && '🎤 聴読訓練'}
            {currentMode === 'select-meaning' && '📝 選義訓練'}
            {currentMode === 'select-word' && '🔍 選詞訓練'}
            {currentMode === 'spelling' && '✏️ 書取訓練'}
          </span>
          <span className="text-xs text-gray-400">{completed + 1}/{totalWords}</span>
        </div>
        <ProgressBar current={completed} total={totalWords} />
      </div>

      {/* Mode switcher */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {(['listen', 'select-meaning', 'select-word', 'spelling'] as TrainingMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => switchMode(mode)}
            className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors ${
              currentMode === mode
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {mode === 'listen' && '🎤 聴読'}
            {mode === 'select-meaning' && '📝 選義'}
            {mode === 'select-word' && '🔍 選詞'}
            {mode === 'spelling' && '✏️ 書取'}
          </button>
        ))}
      </div>

      {/* Word display */}
      <div className={`bg-white rounded-2xl p-6 shadow-sm border-2 transition-all ${feedbackClass || 'border-gray-100'}`}>
        {/* Timer - only for selection modes */}
        {(currentMode === 'select-meaning' || currentMode === 'select-word') && (
          <div className="flex justify-center mb-3">
            <CountdownTimer
              seconds={timerDuration}
              onExpire={handleExpire}
              running={!quiz.showAnswer}
              key={timerKey}
            />
          </div>
        )}

        {/* Listening mode */}
        {currentMode === 'listen' && (
          <div className="text-center">
            <div className="text-3xl mb-2">{quiz.word.kanji || quiz.word.kana}</div>
            {quiz.word.kanji && <div className="text-lg text-gray-400 mb-3">{quiz.word.kana}</div>}
            <div className="flex justify-center gap-4 mb-4">
              <AudioPlayer text={quiz.word.kana} lang="ja-JP" />
            </div>
            {quiz.word.examples.length > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-xl text-left">
                <div className="text-sm text-gray-700">{quiz.word.examples[0].japanese}</div>
                <div className="text-xs text-gray-400 mt-1">{quiz.word.examples[0].chinese}</div>
              </div>
            )}
            <button onClick={handleNext} className="mt-4 px-8 py-2 bg-red-500 text-white rounded-xl font-medium text-sm">
              次へ →
            </button>
          </div>
        )}

        {/* Select Meaning mode */}
        {currentMode === 'select-meaning' && (
          <div>
            <div className="text-center mb-6">
              <div className="text-3xl mb-1">{quiz.word.kanji || quiz.word.kana}</div>
              <div className="text-md text-gray-400">正しい意味を選んでください</div>
            </div>
            <div className="space-y-2">
              {quiz.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={quiz.showAnswer}
                  className={`w-full p-3 rounded-xl text-left text-sm font-medium transition-all border-2 ${
                    quiz.showAnswer
                      ? i === quiz.correctIndex
                        ? 'border-green-400 bg-green-50 text-green-700'
                        : 'border-gray-100 bg-gray-50 text-gray-400'
                      : 'border-gray-100 bg-white hover:border-red-200 hover:bg-red-50 text-gray-700'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Select Word mode */}
        {currentMode === 'select-word' && (
          <div>
            <div className="text-center mb-6">
              <div className="text-3xl mb-1">{quiz.word.definition}</div>
              <div className="text-md text-gray-400">正しい仮名を選んでください</div>
            </div>
            <div className="space-y-2">
              {quiz.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={quiz.showAnswer}
                  className={`w-full p-3 rounded-xl text-left text-lg font-medium transition-all border-2 ${
                    quiz.showAnswer
                      ? i === quiz.correctIndex
                        ? 'border-green-400 bg-green-50 text-green-700'
                        : 'border-gray-100 bg-gray-50 text-gray-400'
                      : 'border-gray-100 bg-white hover:border-red-200 hover:bg-red-50 text-gray-700'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Spelling mode */}
        {currentMode === 'spelling' && (
          <div>
            <div className="text-center mb-4">
              <div className="text-xl mb-1">{quiz.word.definition}</div>
              {quiz.word.kanji && <div className="text-sm text-gray-400 mb-2">({quiz.word.kanji})</div>}
              <div className="flex justify-center gap-4 mb-3">
                <AudioPlayer text={quiz.word.kana} lang="ja-JP" />
              </div>
            </div>
            <KanaKeyboard
              inputValue={spellInput}
              onInput={(k) => setSpellInput(prev => prev + k)}
              onDelete={() => setSpellInput(prev => prev.slice(0, -1))}
              onSubmit={handleSpellingSubmit}
              onSkip={handleSpellingSkip}
              disabled={quiz.showAnswer}
            />
          </div>
        )}

        {/* Feedback bar */}
        {feedbackText && (
          <div className={`mt-4 p-3 rounded-xl text-center text-sm font-medium ${feedbackClass || 'bg-gray-50'}`}>
            {feedbackText}
          </div>
        )}

        {/* Context button */}
        {quiz.showContext && (
          <div className="mt-3 p-3 bg-amber-50 rounded-xl text-sm">
            <div className="font-medium text-amber-800">📖 {quiz.word.definition}</div>
            <div className="text-gray-600 mt-1">{quiz.word.kana}</div>
            {quiz.word.examples.length > 0 && (
              <div className="mt-2 text-xs text-gray-500">
                <div>{quiz.word.examples[0].japanese}</div>
                <div>{quiz.word.examples[0].chinese}</div>
              </div>
            )}
          </div>
        )}

        {/* Action buttons (after answer) */}
        {quiz.showAnswer && (
          <div className="mt-4 flex gap-2">
            {!quiz.isCorrect && (
              <button
                onClick={() => setShowContext(true)}
                className="flex-1 py-2 text-sm bg-amber-50 text-amber-700 rounded-xl font-medium hover:bg-amber-100"
              >
                📖 見る
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-1 py-2 text-sm bg-red-500 text-white rounded-xl font-bold hover:bg-red-600"
            >
              次へ →
            </button>
          </div>
        )}

        {/* Bottom buttons (before answer) */}
        {!quiz.showAnswer && currentMode !== 'spelling' && currentMode !== 'listen' && (
          <div className="mt-4 flex gap-2">
            <button
              onClick={markUnsure}
              className="flex-1 py-2 text-sm bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200"
            >
              ❓ わからない
            </button>
            <button
              onClick={handleNext}
              className="flex-1 py-2 text-sm bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200"
            >
              スキップ
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
