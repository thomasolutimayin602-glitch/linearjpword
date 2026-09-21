import { useState, useCallback } from 'react'

interface AudioPlayerProps {
  text: string      // 要朗读的文本
  lang?: string     // 'ja-JP' | 'zh-CN'
  onPlayingChange?: (playing: boolean) => void
}

export default function AudioPlayer({ text, lang = 'ja-JP', onPlayingChange }: AudioPlayerProps) {
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState(false)

  const speak = useCallback(() => {
    if (!text || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = lang
    utter.rate = 0.9
    utter.onstart = () => {
      setPlaying(true)
      setError(false)
      onPlayingChange?.(true)
    }
    utter.onend = () => {
      setPlaying(false)
      onPlayingChange?.(false)
    }
    utter.onerror = () => {
      setError(true)
      setPlaying(false)
      onPlayingChange?.(false)
    }
    window.speechSynthesis.speak(utter)
  }, [text, lang, onPlayingChange])

  if (!window.speechSynthesis) {
    return (
      <button className="p-2 rounded-full bg-gray-100 text-gray-400 cursor-not-allowed" title="浏览器不支持语音合成">
        🔊
      </button>
    )
  }

  return (
    <button
      onClick={speak}
      disabled={playing}
      className={`p-3 rounded-full transition-all active:scale-95 ${
        playing
          ? 'bg-red-100 text-red-500 animate-pulse'
          : error
            ? 'bg-amber-50 text-amber-500'
            : 'bg-red-50 text-red-500 hover:bg-red-100'
      }`}
      title="播放发音"
    >
      <span className="text-xl">{playing ? '🔊' : '🔈'}</span>
    </button>
  )
}
