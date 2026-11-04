import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStudyStore } from '../stores/study-store'

const FEATURES = [
  ['五步学习链', '听读 → 选义 → 选词 → 假名拼写 → 例句'],
  ['本地优先', '学习记录保存在设备上，离线也能继续'],
  ['按记忆曲线复习', '1 / 7 / 15 / 30 天自动安排复习'],
]

export default function Welcome() {
  const nav = useNavigate()
  const acceptPolicy = useStudyStore(s => s.acceptPolicy)
  const policyAccepted = useStudyStore(s => s.policyAccepted)
  const [privacy, setPrivacy] = useState(policyAccepted)
  const [terms, setTerms] = useState(policyAccepted)
  const [busy, setBusy] = useState(false)
  const canStart = privacy && terms && !busy

  const start = async (path: string) => {
    if (!canStart) return
    setBusy(true)
    if (!policyAccepted) await acceptPolicy()
    nav(path, { replace: true })
  }

  return (
    <div className="min-h-dvh bg-[#F5F6F7] flex flex-col">
      <div className="flex-1 max-w-lg w-full mx-auto px-5 pt-14 pb-8 flex flex-col">
        <div className="anim-up">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#FF7A6E] to-[#F04444] text-white flex items-center justify-center text-[30px] font-extrabold shadow-lg shadow-red-200">拓</div>
          <h1 className="text-[30px] font-extrabold text-gray-900 mt-6 leading-tight">学日语，<br />从今天的一个词开始</h1>
          <p className="text-[14px] text-gray-500 mt-3 leading-6">移动优先的日语背单词应用。先试学 10 题，再建立你的学习档案。</p>
        </div>

        <div className="space-y-2.5 mt-8">
          {FEATURES.map(([title, desc]) => (
            <div key={title} className="card p-4 flex items-start gap-3 anim-up">
              <span className="w-2 h-2 rounded-full bg-[#FF5252] mt-2 shrink-0" />
              <div>
                <div className="text-[14px] font-bold text-gray-800">{title}</div>
                <div className="text-[12px] text-gray-400 mt-1">{desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-auto pt-8">
          <label className="flex items-start gap-2.5 text-[12px] text-gray-500 leading-5">
            <input type="checkbox" checked={privacy} onChange={e => setPrivacy(e.target.checked)} className="mt-1 accent-[#FF5252]" />
            <span>我已阅读并同意 <Link to="/policy/privacy" className="text-[#FF5252] font-semibold">隐私政策</Link></span>
          </label>
          <label className="flex items-start gap-2.5 text-[12px] text-gray-500 leading-5 mt-2">
            <input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)} className="mt-1 accent-[#FF5252]" />
            <span>我同意 <Link to="/policy/terms" className="text-[#FF5252] font-semibold">用户协议</Link>，并了解当前内容为开发期种子数据</span>
          </label>

          <button
            onClick={() => start('/onboarding')}
            disabled={!canStart}
            className="btn-primary w-full py-4 text-[16px] font-extrabold mt-5 disabled:opacity-40"
          >
            建立学习档案
          </button>
          <button
            onClick={() => start('/')}
            disabled={!canStart}
            className="btn-ghost w-full py-3.5 text-[14px] font-bold mt-2.5 disabled:opacity-40"
          >
            先游客试学 10 题
          </button>
        </div>
      </div>
    </div>
  )
}
