import { useState } from 'react'

type KanaPanel = 'seion' | 'dakuon' | 'youon'

interface KanaKeyboardProps {
  onInput: (kana: string) => void
  onDelete: () => void
  onSubmit: () => void
  onSkip: () => void
  inputValue: string
  disabled?: boolean
}

const SEION_ROWS = [
  ['あ', 'い', 'う', 'え', 'お'],
  ['か', 'き', 'く', 'け', 'こ'],
  ['さ', 'し', 'す', 'せ', 'そ'],
  ['た', 'ち', 'つ', 'て', 'と'],
  ['な', 'に', 'ぬ', 'ね', 'の'],
  ['は', 'ひ', 'ふ', 'へ', 'ほ'],
  ['ま', 'み', 'む', 'め', 'も'],
  ['や', '', 'ゆ', '', 'よ'],
  ['ら', 'り', 'る', 'れ', 'ろ'],
  ['わ', 'を', 'ん', '', ''],
]

const DAKUON_ROWS = [
  ['が', 'ぎ', 'ぐ', 'げ', 'ご'],
  ['ざ', 'じ', 'ず', 'ぜ', 'ぞ'],
  ['だ', 'ぢ', 'づ', 'で', 'ど'],
  ['ば', 'び', 'ぶ', 'べ', 'ぼ'],
  ['ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ'],
]

const YOUON_LIST = [
  'きゃ', 'きゅ', 'きょ',
  'しゃ', 'しゅ', 'しょ',
  'ちゃ', 'ちゅ', 'ちょ',
  'にゃ', 'にゅ', 'にょ',
  'ひゃ', 'ひゅ', 'ひょ',
  'みゃ', 'みゅ', 'みょ',
  'りゃ', 'りゅ', 'りょ',
  'ぎゃ', 'ぎゅ', 'ぎょ',
  'じゃ', 'じゅ', 'じょ',
  'びゃ', 'びゅ', 'びょ',
  'ぴゃ', 'ぴゅ', 'ぴょ',
]

export default function KanaKeyboard({
  onInput,
  onDelete,
  onSubmit,
  onSkip,
  inputValue,
  disabled = false,
}: KanaKeyboardProps) {
  const [panel, setPanel] = useState<KanaPanel>('seion')

  const panelLabel: Record<KanaPanel, string> = {
    seion: '清音',
    dakuon: '濁音・半濁音',
    youon: '拗音',
  }

  return (
    <div className="w-full max-w-lg mx-auto select-none">
      {/* Input display */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-4 mb-3 min-h-[3rem] text-center">
        <span className="text-2xl tracking-widest text-gray-800">
          {inputValue || <span className="text-gray-300">点击下方假名输入</span>}
        </span>
      </div>

      {/* Panel tabs */}
      <div className="flex gap-1 mb-2">
        {(['seion', 'dakuon', 'youon'] as KanaPanel[]).map((p) => (
          <button
            key={p}
            onClick={() => setPanel(p)}
            disabled={disabled}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              panel === p
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {panelLabel[p]}
          </button>
        ))}
      </div>

      {/* Keys */}
      <div className="bg-gray-50 rounded-xl p-3">
        {panel === 'seion' && SEION_ROWS.map((row, ri) => (
          <div key={ri} className="flex justify-center gap-1 mb-1">
            {row.map((k, ki) => (
              <button
                key={ki}
                onClick={() => k && onInput(k)}
                disabled={disabled || !k}
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg text-lg font-medium transition-all active:scale-95 ${
                  k
                    ? 'bg-white text-gray-800 shadow-sm hover:bg-gray-100 border border-gray-200'
                    : 'bg-transparent'
                } disabled:opacity-0`}
              >
                {k || ''}
              </button>
            ))}
          </div>
        ))}

        {panel === 'dakuon' && DAKUON_ROWS.map((row, ri) => (
          <div key={ri} className="flex justify-center gap-1 mb-1">
            {row.map((k, ki) => (
              <button
                key={ki}
                onClick={() => onInput(k)}
                disabled={disabled}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg text-lg font-medium bg-white text-gray-800 shadow-sm hover:bg-gray-100 border border-gray-200 transition-all active:scale-95"
              >
                {k}
              </button>
            ))}
          </div>
        ))}

        {panel === 'youon' && (
          <div className="grid grid-cols-5 gap-1">
            {YOUON_LIST.map((k) => (
              <button
                key={k}
                onClick={() => onInput(k)}
                disabled={disabled}
                className="w-full h-10 rounded-lg text-sm font-medium bg-white text-gray-800 shadow-sm hover:bg-gray-100 border border-gray-200 transition-all active:scale-95"
              >
                {k}
              </button>
            ))}
          </div>
        )}

        {/* Bottom controls */}
        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
          <button
            onClick={() => onInput('ー')}
            disabled={disabled}
            className="px-4 h-10 rounded-lg bg-white text-gray-700 shadow-sm hover:bg-gray-100 border border-gray-200 text-sm font-medium"
          >
            長音 ー
          </button>
          <button
            onClick={onDelete}
            disabled={disabled}
            className="px-4 h-10 rounded-lg bg-amber-50 text-amber-700 shadow-sm hover:bg-amber-100 border border-amber-200 text-sm font-medium"
          >
            削除 ←
          </button>
          <button
            onClick={onSkip}
            disabled={disabled}
            className="px-4 h-10 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-200 text-sm font-medium"
          >
            跳过
          </button>
          <button
            onClick={onSubmit}
            disabled={disabled || !inputValue}
            className="flex-1 h-10 rounded-lg bg-red-500 text-white shadow-sm hover:bg-red-600 disabled:opacity-40 text-sm font-bold"
          >
            確定 ✓
          </button>
        </div>
      </div>
    </div>
  )
}
