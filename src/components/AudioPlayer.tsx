import { useState } from 'react'
import { IconSound } from './icons'

interface P {
  text: string
  lang?: string
  size?: number
  rate?: number
}
export default function AudioPlayer({ text, lang = 'ja-JP', size = 52, rate = 0.9 }: P) {
  const [on, setOn] = useState(false)
  const play = () => {
    try {
      const sy = window.speechSynthesis
      if (!sy) return
      sy.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.lang = lang
      u.rate = rate
      setOn(true)
      u.onend = () => setOn(false)
      u.onerror = () => setOn(false)
      sy.speak(u)
      sy.resume()
    } catch { setOn(false) }
  }
  return (
    <button
      onClick={play}
      aria-label="Play pronunciation"
      className={`flex items-center justify-center rounded-full transition-all active:scale-90 ${
        on ? 'bg-[#FF5252] text-white' : 'bg-[#FFF0F0] text-[#FF5252]'
      }`}
      style={{ width: size, height: size }}
    >
      <IconSound width={size * 0.5} height={size * 0.5} />
      {on && <span className="absolute opacity-0" />}
    </button>
  )
}
