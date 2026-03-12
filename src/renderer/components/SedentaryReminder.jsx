import { useState, useEffect } from 'react'

function SedentaryReminder() {
  const [enabled, setEnabled] = useState(false)
  const [intervalMinutes, setIntervalMinutes] = useState(30)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    window.electronAPI.getSedentary().then(settings => {
      setEnabled(settings.enabled)
      setIntervalMinutes(settings.intervalMinutes)
    })
  }, [])

  const handleToggle = async () => {
    setLoading(true)
    const newEnabled = !enabled
    const settings = { enabled: newEnabled, intervalMinutes }
    await window.electronAPI.setSedentary(settings)
    setEnabled(newEnabled)
    setLoading(false)
  }

  const handleIntervalChange = (e) => {
    const val = parseInt(e.target.value, 10)
    if (!isNaN(val) && val > 0) {
      setIntervalMinutes(val)
    }
  }

  const handleIntervalBlur = async () => {
    if (enabled) {
      setLoading(true)
      await window.electronAPI.setSedentary({ enabled, intervalMinutes })
      setLoading(false)
    }
  }

  return (
    <div className="sedentary-card">
      <div className="sedentary-icon">{enabled ? '🧘' : '🪑'}</div>
      <h2 className="sedentary-title">久坐提醒</h2>
      <p className="sedentary-desc">
        {enabled
          ? `已开启，每 ${intervalMinutes} 分钟提醒你起来活动`
          : '设置间隔时间，开启后定时提醒你起来活动'}
      </p>

      <div className="sedentary-interval">
        <label>提醒间隔</label>
        <div className="interval-input-row">
          <input
            type="number"
            min="1"
            max="120"
            value={intervalMinutes}
            onChange={handleIntervalChange}
            onBlur={handleIntervalBlur}
            disabled={loading}
            className="interval-input"
          />
          <span className="interval-unit">分钟</span>
        </div>
        <div className="interval-presets">
          {[15, 30, 45, 60].map(min => (
            <button
              key={min}
              className={`preset-btn${intervalMinutes === min ? ' active' : ''}`}
              onClick={async () => {
                setIntervalMinutes(min)
                if (enabled) {
                  setLoading(true)
                  await window.electronAPI.setSedentary({ enabled, intervalMinutes: min })
                  setLoading(false)
                }
              }}
              disabled={loading}
            >
              {min} 分钟
            </button>
          ))}
        </div>
      </div>

      <button
        className={`sedentary-toggle-btn${enabled ? ' stop' : ' start'}`}
        onClick={handleToggle}
        disabled={loading}
      >
        {loading ? '处理中...' : enabled ? '⏹ 停止提醒' : '▶ 开启提醒'}
      </button>

      {enabled && (
        <div className="sedentary-status">
          <span className="status-dot"></span>
          运行中 — 每 {intervalMinutes} 分钟提醒一次
        </div>
      )}
    </div>
  )
}

export default SedentaryReminder
