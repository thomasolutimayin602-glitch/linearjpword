import { useNavigate, useParams } from 'react-router-dom'
import { IconBack } from '../components/icons'

const CONTENT = {
  privacy: {
    title: '隐私政策（开发期）',
    sections: [
      ['我们保存什么', '当前版本只在本机 IndexedDB 保存学习状态、训练记录、设置和你主动填写的学习档案。不会上传到服务器。'],
      ['我们如何使用', '这些数据仅用于生成每日计划、复习排队、统计和学习体验优化。'],
      ['你的控制权', '你可以随时在系统设置中清除应用数据；云同步和账号删除能力将在账号服务接入后提供。'],
      ['第三方服务', '语音播放使用设备自带 TTS；未配置的账号、支付、语音评测服务不会伪装为可用。'],
    ],
  },
  terms: {
    title: '用户协议（开发期）',
    sections: [
      ['服务状态', '本项目处于开发阶段，功能和内容可能变化；词条、例句与音频为原创或已获许可的种子数据。'],
      ['学习用途', '应用用于日语词汇学习，不构成考试、医疗或法律建议。'],
      ['账号与付费', '当前不提供真实账号注册和支付。页面中标注的会员能力仅为流程占位。'],
      ['合理使用', '请勿利用本应用从事违法活动或尝试破坏其他用户的数据与服务。'],
    ],
  },
} as const

export default function Policy() {
  const nav = useNavigate()
  const { kind } = useParams()
  const content = kind === 'terms' ? CONTENT.terms : CONTENT.privacy
  return (
    <div className="min-h-dvh bg-[#F5F6F7]">
      <div className="max-w-lg mx-auto px-5 py-6">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => nav(-1)} aria-label="返回" className="w-9 h-9 rounded-full bg-white border border-gray-100 flex items-center justify-center">
            <IconBack width={19} height={19} />
          </button>
          <h1 className="text-[18px] font-extrabold text-gray-900">{content.title}</h1>
        </div>
        <div className="space-y-3">
          {content.sections.map(([title, body]) => (
            <div key={title} className="card p-4">
              <div className="text-[14px] font-bold text-gray-800">{title}</div>
              <p className="text-[13px] text-gray-500 leading-6 mt-2">{body}</p>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-gray-400 mt-5 leading-5">最后更新：2026-11-05<br />正式上线前将由运营与法务复核并替换为正式文本。</p>
      </div>
    </div>
  )
}
