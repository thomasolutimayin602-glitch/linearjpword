import { useSettingsStore } from '../stores/settings-store'

export default function Settings() {
  const { settings, updateSettings, resetSettings } = useSettingsStore()

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-4">⚙️ 設定</h2>

      <div className="space-y-4">
        {/* 每日新词 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">每日新單詞數</span>
            <span className="text-lg font-bold text-red-500">{settings.dailyNewWords}</span>
          </div>
          <input
            type="range"
            min="5" max="50" step="5"
            value={settings.dailyNewWords}
            onChange={e => updateSettings({ dailyNewWords: Number(e.target.value) })}
            className="w-full accent-red-500"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>5</span><span>50</span>
          </div>
        </div>

        {/* 倒计时 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-700 mb-3">⏱ 倒計時設定</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">選義訓練</span>
              <div className="flex items-center gap-2">
                <input
                  type="range" min="3" max="15"
                  value={settings.selectMeaningTimer}
                  onChange={e => updateSettings({ selectMeaningTimer: Number(e.target.value) })}
                  className="w-24 accent-red-500"
                />
                <span className="text-sm font-bold w-8 text-right">{settings.selectMeaningTimer}s</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">選詞訓練</span>
              <div className="flex items-center gap-2">
                <input
                  type="range" min="5" max="20"
                  value={settings.selectWordTimer}
                  onChange={e => updateSettings({ selectWordTimer: Number(e.target.value) })}
                  className="w-24 accent-red-500"
                />
                <span className="text-sm font-bold w-8 text-right">{settings.selectWordTimer}s</span>
              </div>
            </div>
          </div>
        </div>

        {/* 训练选项 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-700 mb-3">🎯 訓練選項</h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-600">自動發音</span>
              <input type="checkbox" checked={settings.autoPronounce} onChange={e => updateSettings({ autoPronounce: e.target.checked })} className="w-5 h-5 accent-red-500 rounded" />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-600">釋義自動發音</span>
              <input type="checkbox" checked={settings.definitionPronounce} onChange={e => updateSettings({ definitionPronounce: e.target.checked })} className="w-5 h-5 accent-red-500 rounded" />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-600">猜對算答錯</span>
              <input type="checkbox" checked={settings.guessAsWrong} onChange={e => updateSettings({ guessAsWrong: e.target.checked })} className="w-5 h-5 accent-red-500 rounded" />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-600">中文隱身</span>
              <input type="checkbox" checked={settings.hideChinese} onChange={e => updateSettings({ hideChinese: e.target.checked })} className="w-5 h-5 accent-red-500 rounded" />
            </label>
          </div>
        </div>

        {/* 复习规则 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-700 mb-3">🔄 復習規則</h3>
          <div className="space-y-2">
            <span className="text-sm text-gray-600">長期記憶遺忘點（天）</span>
            <div className="flex gap-2">
              {[7, 15, 30].map(d => (
                <label key={d} className="flex items-center gap-1">
                  <input type="checkbox" checked={settings.reviewDays.includes(d)} className="accent-red-500"
                    onChange={() => {
                      const newDays = settings.reviewDays.includes(d)
                        ? settings.reviewDays.filter(x => x !== d)
                        : [...settings.reviewDays, d].sort()
                      updateSettings({ reviewDays: newDays })
                    }}
                  />
                  <span className="text-sm">{d}天</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* 重置 */}
        <button
          onClick={resetSettings}
          className="w-full py-3 text-sm text-gray-400 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          恢復默認設置
        </button>

        <div className="text-center text-xs text-gray-300 py-4">
          語詞 v1.0
        </div>
      </div>
    </div>
  )
}
