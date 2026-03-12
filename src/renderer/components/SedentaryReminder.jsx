import { useState, useEffect, useRef } from 'react'

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function SedentaryReminder({ fireCount }) {
  const [enabled, setEnabled] = useState(false)
  const [intervalMinutes, setIntervalMinutes] = useState(30)
  const [loading, setLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const tickRef = useRef(null)
  const intervalMinutesRef = useRef(intervalMinutes)

  // 保持 ref 和 state 同步，供 tick 闭包读取
  useEffect(() => {
    intervalMinutesRef.current = intervalMinutes
  }, [intervalMinutes])

  useEffect(() => {
    window.electronAPI.getSedentary().then(settings => {
      setEnabled(settings.enabled)
      setIntervalMinutes(settings.intervalMinutes)
      intervalMinutesRef.current = settings.intervalMinutes
      if (settings.enabled) {
        startCountdown(settings.intervalMinutes)
      }
    })
    return () => stopCountdown()
  }, [])

  // 通知触发后重置倒计时
  useEffect(() => {
    if (fireCount > 0 && enabled) {
      startCountdown(intervalMinutesRef.current)
    }
  }, [fireCount])

  const startCountdown = (minutes) => {
    stopCountdown()
    setTimeLeft(minutes * 60)
    tickRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) return intervalMinutesRef.current * 60
        return prev - 1
      })
    }, 1000)
  }

  const stopCountdown = () => {
    if (tickRef.current) {
      clearInterval(tickRef.current)
      tickRef.current = null
    }
    setTimeLeft(0)
  }

  const handleToggle = async () => {
    setLoading(true)
    const newEnabled = !enabled
    await window.electronAPI.setSedentary({ enabled: newEnabled, intervalMinutes })
    setEnabled(newEnabled)
    if (newEnabled) {
      startCountdown(intervalMinutes)
    } else {
      stopCountdown()
    }
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
      startCountdown(intervalMinutes)
      setLoading(false)
    }
  }

  const handlePreset = async (min) => {
    setIntervalMinutes(min)
    intervalMinutesRef.current = min
    if (enabled) {
      setLoading(true)
      await window.electronAPI.setSedentary({ enabled, intervalMinutes: min })
      startCountdown(min)
      setLoading(false)
    }
  }

  const totalSeconds = intervalMinutes * 60
  const progress = enabled && totalSeconds > 0 ? (totalSeconds - timeLeft) / totalSeconds : 0

  return (
    <div className="sedentary-card">
      <div className="sedentary-icon">{enabled ? '🧘' : '🪑'}</div>
      <h2 className="sedentary-title">久坐提醒</h2>
      <p className="sedentary-desc">
        {enabled
          ? `已开启，每 ${intervalMinutes} 分钟提醒你起来活动`
          : '设置间隔时间，开启后定时提醒你起来活动'}
      </p>

      {enabled && (
        <div className="countdown-block">
          <div className="countdown-label">距离下次提醒</div>
          <div className="countdown-time">{formatTime(timeLeft)}</div>
          <div className="countdown-bar-bg">
            <div
              className="countdown-bar-fill"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      )}

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
              onClick={() => handlePreset(min)}
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
