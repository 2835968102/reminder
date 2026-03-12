import { useState } from 'react'

function ReminderForm({ onAdd }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [repeatType, setRepeatType] = useState('once')
  const [intervalMinutes, setIntervalMinutes] = useState(30)
  const [time, setTime] = useState(() => {
    const now = new Date()
    now.setHours(now.getHours() + 1)
    return now.toISOString().slice(0, 16)
  })

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!title.trim() || !time) {
      alert('请填写标题和时间')
      return
    }

    const reminder = {
      title,
      content,
      time: new Date(time).toISOString(),
      enabled: true,
      repeatType,
      intervalMinutes: repeatType === 'interval' ? intervalMinutes : null
    }

    await onAdd(reminder)

    // 重置表单
    setTitle('')
    setContent('')
    setTime('')
    setRepeatType('once')
    setIntervalMinutes(30)
  }

  return (
    <form className="add-form" onSubmit={handleSubmit}>
      <h2 style={{ marginBottom: 20, fontSize: 20, color: '#333' }}>添加新提醒</h2>

      <div className="form-group">
        <label>标题</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="请输入提醒标题"
          required
        />
      </div>

      <div className="form-group">
        <label>内容</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="请输入提醒内容（可选）"
        />
      </div>

      <div className="form-group">
        <label>提醒时间</label>
        <input
          type="datetime-local"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          min={new Date().toISOString().slice(0, 16)}
          required
        />
      </div>

      <div className="form-group">
        <label>重复类型</label>
        <select
          value={repeatType}
          onChange={(e) => setRepeatType(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        >
          <option value="once">只提醒一次</option>
          <option value="interval">间隔重复</option>
        </select>
      </div>

      {repeatType === 'interval' && (
        <div className="form-group">
          <label>间隔时间（分钟）</label>
          <input
            type="number"
            value={intervalMinutes}
            onChange={(e) => setIntervalMinutes(Math.max(1, parseInt(e.target.value) || 1))}
            min="1"
            required
          />
        </div>
      )}

      <button type="submit" className="btn btn-primary">
        + 添加提醒
      </button>
    </form>
  )
}

export default ReminderForm
