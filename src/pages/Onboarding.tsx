import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStudyStore, type ProfileDraft } from '../stores/study-store'
import { GOAL_LABEL, IDENTITY_LABEL, type JLPTLevel, type LearningGoal, type LearningIdentity } from '../types'
import { buildStudyPlan } from '../engine/review-scheduler'
import ProgressBar from '../components/ProgressBar'
import { IconBack } from '../components/icons'

const STEPS = ['身份', '水平', '目标', '计划']
const IDENTITIES: LearningIdentity[] = ['student', 'adult', 'exam']
const LEVELS: { value: JLPTLevel; title: string; desc: string }[] = [
  { value: 'N5', title: 'N5 · 入门', desc: '刚开始学，五十音还不熟也可以' },
  { value: 'N4', title: 'N4 · 基础', desc: '能读懂简单句子和日常表达' },
  { value: 'N3', title: 'N3 · 进阶', desc: '能应对日常场景和短文阅读' },
  { value: 'N2', title: 'N2 · 中高级', desc: '准备考试或工作使用' },
  { value: 'N1', title: 'N1 · 高级', desc: '希望精进词汇深度与辨析' },
]
const GOALS: LearningGoal[] = ['jlpt', 'travel', 'anime', 'work', 'habit']
const MINUTES = [10, 15, 20, 30]

function newWordsFor(minutes: number): number {
  return Math.max(3, Math.min(30, Math.round((minutes * 0.6) / 3) * 3))
}

export default function Onboarding() {
  const nav = useNavigate()
  const { profile, states, saveProfile } = useStudyStore()
  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)
  const [draft, setDraft] = useState<ProfileDraft>({
    nickname: profile?.nickname ?? '同学',
    identity: profile?.identity ?? 'adult',
    level: profile?.level ?? 'N5',
    goal: profile?.goal ?? 'jlpt',
    examDate: profile?.examDate ?? null,
    dailyMinutes: profile?.dailyMinutes ?? 15,
    dailyNewWords: profile?.dailyNewWords ?? newWordsFor(profile?.dailyMinutes ?? 15),
  })

  const preview = useMemo(
    () => buildStudyPlan(states, newWordsFor(draft.dailyMinutes)),
    [states, draft.dailyMinutes],
  )
  const patch = (part: Partial<ProfileDraft>) => setDraft(d => ({ ...d, ...part }))
  const next = () => setStep(s => Math.min(STEPS.length - 1, s + 1))
  const back = () => (step === 0 ? nav(-1) : setStep(s => s - 1))

  const finish = async () => {
    if (busy || !draft.nickname.trim()) return
    setBusy(true)
    await saveProfile({ ...draft, nickname: draft.nickname.trim(), dailyNewWords: newWordsFor(draft.dailyMinutes) })
    nav('/', { replace: true })
  }

  return (
    <div className="min-h-dvh bg-[#F5F6F7]">
      <div className="max-w-lg mx-auto px-5 py-6 pb-28">
        <div className="flex items-center gap-3">
          <button onClick={back} aria-label="返回" className="w-9 h-9 rounded-full bg-white border border-gray-100 flex items-center justify-center">
            <IconBack width={19} height={19} />
          </button>
          <div className="flex-1">
            <div className="flex justify-between text-[11px] text-gray-400 mb-1.5">
              <span>第 {step + 1} / {STEPS.length} 步 · {STEPS[step]}</span>
              <span>{profile ? '编辑学习档案' : '建立学习档案'}</span>
            </div>
            <ProgressBar current={step + 1} total={STEPS.length} />
          </div>
        </div>

        {step === 0 && (
          <section className="anim-up mt-6">
            <h1 className="text-[24px] font-extrabold text-gray-900">先认识一下你</h1>
            <p className="text-[13px] text-gray-400 mt-1.5">只保存在本机，用于调整计划节奏。</p>
            <label className="block mt-6">
              <span className="text-[12px] font-bold text-gray-500">昵称</span>
              <input
                value={draft.nickname}
                onChange={e => patch({ nickname: e.target.value })}
                maxLength={20}
                className="mt-2 w-full rounded-2xl border border-gray-100 bg-white px-4 py-3.5 text-[15px] outline-none focus:border-[#FFB5B0]"
                placeholder="怎么称呼你？"
              />
            </label>
            <div className="mt-6 space-y-2.5">
              {IDENTITIES.map(id => (
                <OptionCard
                  key={id}
                  active={draft.identity === id}
                  title={IDENTITY_LABEL[id]}
                  desc={id === 'student' ? '在校学习，时间相对固定' : id === 'exam' ? '有明确考试日期，需要冲刺' : '兴趣或工作驱动，节奏灵活'}
                  onClick={() => patch({ identity: id })}
                />
              ))}
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="anim-up mt-6">
            <h1 className="text-[24px] font-extrabold text-gray-900">当前日语水平</h1>
            <p className="text-[13px] text-gray-400 mt-1.5">选择最接近的一项，后续可随时修改。</p>
            <div className="mt-6 space-y-2.5">
              {LEVELS.map(item => (
                <OptionCard
                  key={item.value}
                  active={draft.level === item.value}
                  title={item.title}
                  desc={item.desc}
                  onClick={() => patch({ level: item.value })}
                />
              ))}
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="anim-up mt-6">
            <h1 className="text-[24px] font-extrabold text-gray-900">学习目标</h1>
            <p className="text-[13px] text-gray-400 mt-1.5">目标和每日时间会决定新词数量。</p>
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              {GOALS.map(goal => (
                <button
                  key={goal}
                  onClick={() => patch({ goal })}
                  className={`card p-3.5 text-left transition-all ${draft.goal === goal ? 'border-[#FF5252] bg-[#FFF8F8] ring-2 ring-[#FFD6D6]' : ''}`}
                >
                  <div className="text-[14px] font-bold text-gray-800">{GOAL_LABEL[goal]}</div>
                </button>
              ))}
            </div>
            <div className="mt-6">
              <div className="text-[12px] font-bold text-gray-500 mb-2">每天可投入</div>
              <div className="grid grid-cols-4 gap-2">
                {MINUTES.map(minutes => (
                  <button
                    key={minutes}
                    onClick={() => patch({ dailyMinutes: minutes, dailyNewWords: newWordsFor(minutes) })}
                    className={`py-3 rounded-2xl text-[13px] font-bold border transition-all ${
                      draft.dailyMinutes === minutes
                        ? 'bg-[#FF5252] text-white border-[#FF5252]'
                        : 'bg-white text-gray-600 border-gray-100'
                    }`}
                  >
                    {minutes} 分钟
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-gray-400 mt-2">当前节奏：每天约 {newWordsFor(draft.dailyMinutes)} 个新词 + 到期复习</p>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="anim-up mt-6">
            <h1 className="text-[24px] font-extrabold text-gray-900">你的学习计划</h1>
            <p className="text-[13px] text-gray-400 mt-1.5">生成后即可开始，计划会保存在今天的学习首页。</p>
            <div className="card p-5 mt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF7A6E] to-[#FF5252] text-white flex items-center justify-center text-lg font-extrabold">拓</div>
                <div>
                  <div className="font-bold text-gray-800">{draft.nickname || '同学'}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">{IDENTITY_LABEL[draft.identity]} · {draft.level} · {GOAL_LABEL[draft.goal]}</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-5 text-center">
                <SummaryTile label="每日新词" value={`${newWordsFor(draft.dailyMinutes)}`} />
                <SummaryTile label="今日复习" value={`${preview.dueIds.length}`} />
                <SummaryTile label="每日时长" value={`${draft.dailyMinutes}m`} />
              </div>
              <div className="mt-5 rounded-2xl bg-[#FFF8F5] p-3.5 text-[12px] text-gray-500 leading-6">
                学习顺序：听读 → 选义 → 选词 → 假名拼写 → 例句。答错会重新入队，干净通过后按 1 / 7 / 15 / 30 天复习。
              </div>
            </div>
          </section>
        )}

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 pb-[env(safe-area-inset-bottom)]">
          <div className="max-w-lg mx-auto px-5 py-3">
            {step < STEPS.length - 1 ? (
              <button onClick={next} className="btn-primary w-full py-3.5 text-[15px] font-bold" disabled={step === 0 && !draft.nickname.trim()}>
                下一步
              </button>
            ) : (
              <button onClick={finish} className="btn-primary w-full py-3.5 text-[15px] font-bold" disabled={busy}>
                {busy ? '正在生成…' : profile ? '保存并更新计划' : '开始学习'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function OptionCard({ active, title, desc, onClick }: {
  active: boolean; title: string; desc: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`card w-full p-4 text-left transition-all ${active ? 'border-[#FF5252] bg-[#FFF8F8] ring-2 ring-[#FFD6D6]' : ''}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[15px] font-bold text-gray-800">{title}</div>
          <div className="text-[11px] text-gray-400 mt-1">{desc}</div>
        </div>
        <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[11px] font-bold shrink-0 ${active ? 'border-[#FF5252] bg-[#FF5252] text-white' : 'border-gray-200 text-transparent'}`}>✓</span>
      </div>
    </button>
  )
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-gray-50 py-3">
      <div className="text-[20px] font-extrabold text-gray-800">{value}</div>
      <div className="text-[10px] text-gray-400 mt-1">{label}</div>
    </div>
  )
}
