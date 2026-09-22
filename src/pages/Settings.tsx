import { useState } from 'react'
import { useStudyStore } from '../stores/study-store'
import type { Settings } from '../types'
import Toggle from '../components/Toggle'

export default function Settings() {
  const { settings, updateSettings } = useStudyStore()
  const [confirmedReset, setConfirmedReset] = useState(false)

  const upd = (patch: Partial<Settings>) => updateSettings(patch)

  const handleReset = () => {
    if (!confirmedReset) {
      setConfirmedReset(true)
      setTimeout(() => setConfirmedReset(false), 3000)
      return
    }
    updateSettings({
      dailyNewWords: 12,
      meaningTimer: 8,
      wordTimer: 10,
      autoPronounce: true,
      showRomaji: true,
      guessAsWrong: true,
      strictSpelling: false,
      noneOptionMinMastery: 60,
      dailyGoalMinutes: 15,
      soundEffects: true,
    })
    setConfirmedReset(false)
  }

  return (
    <div className="anim-up">
      <h1 className="text-[22px] font-extrabold text-gray-900 mb-1">功能设置</h1>
      <p className="text-[12px] text-gray-400 mb-4">调整训练参数和偏好</p>

      {/* 训练设置 */}
      <Section title="训练设置">
        <SliderRow
          label="每日新词数"
          value={settings.dailyNewWords}
          min={3} max={30} step={3}
          onChange={v => upd({ dailyNewWords: v })}
          suffix="个"
        />
        <Divider />
        <SliderRow
          label="选义训练倒计时"
          value={settings.meaningTimer}
          min={3} max={30} step={1}
          onChange={v => upd({ meaningTimer: v })}
          suffix="秒"
          desc="看到单词后倒计时选择释义"
        />
        <Divider />
        <SliderRow
          label="选词训练倒计时"
          value={settings.wordTimer}
          min={5} max={30} step={1}
          onChange={v => upd({ wordTimer: v })}
          suffix="秒"
          desc="看到释义后倒计时选择单词"
        />
      </Section>

      {/* 发音 */}
      <Section title="发音">
        <ToggleRow label="单词自动发音" checked={settings.autoPronounce} onChange={v => upd({ autoPronounce: v })} desc="进入新词时自动播放发音" />
        <Divider />
        <ToggleRow label="显示 Rōmaji 提示" checked={settings.showRomaji} onChange={v => upd({ showRomaji: v })} desc="拼写模式中显示首字母提示" />
      </Section>

      {/* 回答规则 */}
      <Section title="回答规则">
        <ToggleRow
          label="猜对也算答错"
          checked={settings.guessAsWrong}
          onChange={v => upd({ guessAsWrong: v })}
          desc="1秒内蒙对也算答错，单词重新入队"
        />
        <Divider />
        <ToggleRow
          label="严格拼写"
          checked={settings.strictSpelling}
          onChange={v => upd({ strictSpelling: v })}
          desc="要求输入完全的平假名形式"
        />
        <Divider />
        <SliderRow
          label="启动「以上都不对」掌握度"
          value={settings.noneOptionMinMastery}
          min={30} max={90} step={10}
          onChange={v => upd({ noneOptionMinMastery: v })}
          suffix="%"
          desc="掌握度达到后，第四个选项替换为「None of the above」"
        />
      </Section>

      {/* 复习规则 */}
      <Section title="复习间隔">
        <div className="flex gap-2 mt-1">
          {[1, 7, 15, 30].map(d => (
            <label key={d} className="flex items-center gap-1.5 bg-gray-50 px-3 py-2 rounded-xl text-[13px] text-gray-600 border border-gray-100 cursor-pointer">
              <input type="checkbox" className="accent-[#FF5252]" defaultChecked={true} disabled />
              <span>{d} 天</span>
            </label>
          ))}
        </div>
        <p className="text-[11px] text-gray-400 mt-2">掌握后将在 {1}/{7}/{15}/{30} 天遗忘点自动进入复习</p>
      </Section>

      {/* 重置 */}
      <Section title="其他">
        <button
          onClick={handleReset}
          className={`w-full py-3 rounded-2xl text-[14px] font-bold transition-all ${
            confirmedReset ? 'bg-[#FF5252] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          {confirmedReset ? '再次点击确认重置默认' : '恢复默认设置'}
        </button>
      </Section>

      <div className="text-center text-[10px] text-gray-300 mt-6 pb-4">
        TowordJP v0.1 — 本地版 · 参考拓词设计
      </div>
    </div>
  )
}

/* ---- helpers ---- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-4 mb-3">
      <h2 className="text-[13px] font-bold text-gray-700 mb-3">{title}</h2>
      {children}
    </div>
  )
}

function Divider() {
  return <div className="h-px bg-gray-50 my-3" />
}

function SliderRow({ label, value, min, max, step, onChange, suffix, desc }: {
  label: string; value: number; min: number; max: number; step: number
  onChange: (v: number) => void; suffix: string; desc?: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[13px] text-gray-700">{label}</span>
        <span className="text-[15px] font-bold text-[#FF5252]">{value}{suffix}</span>
      </div>
      {desc && <p className="text-[11px] text-gray-400 mb-1.5">{desc}</p>}
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(+e.target.value)}
        style={{ '--fill': `${((value - min) / (max - min)) * 100}%` } as React.CSSProperties}
      />
      <div className="flex justify-between text-[10px] text-gray-300 mt-0.5">
        <span>{min}{suffix}</span>
        <span>{max}{suffix}</span>
      </div>
    </div>
  )
}

function ToggleRow({ label, checked, onChange, desc }: {
  label: string; checked: boolean; onChange: (v: boolean) => void; desc?: string
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1 min-w-0 mr-3">
        <div className="text-[13px] text-gray-700">{label}</div>
        {desc && <div className="text-[11px] text-gray-400 mt-0.5">{desc}</div>}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  )
}
