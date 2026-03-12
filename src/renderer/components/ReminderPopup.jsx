import { useEffect } from 'react'

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()

    const frequencies = [880, 1100, 880]
    let startTime = ctx.currentTime

    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, startTime + i * 0.18)
      gain.gain.linearRampToValueAtTime(0.4, startTime + i * 0.18 + 0.05)
      gain.gain.linearRampToValueAtTime(0, startTime + i * 0.18 + 0.15)

      osc.start(startTime + i * 0.18)
      osc.stop(startTime + i * 0.18 + 0.2)
    })
  } catch (e) {
    // 浏览器不支持 Web Audio API 时静默失败
  }
}

function ReminderPopup({ reminder, onClose }) {
  useEffect(() => {
    playNotificationSound()
  }, [reminder])

  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-box" onClick={(e) => e.stopPropagation()}>
        <div className="popup-icon">⏰</div>
        <div className="popup-header">定时提醒</div>
        <div className="popup-title">{reminder.title}</div>
        {reminder.content && (
          <div className="popup-content">{reminder.content}</div>
        )}
        <div className="popup-time">{formatTime(reminder.time)}</div>
        {reminder.repeatType === 'interval' && (
          <div className="popup-repeat">🔄 每隔 {reminder.intervalMinutes} 分钟重复</div>
        )}
        <button className="popup-close-btn" onClick={onClose}>
          我知道了
        </button>
      </div>
    </div>
  )
}

export default ReminderPopup
