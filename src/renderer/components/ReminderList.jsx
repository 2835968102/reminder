function ReminderList({ reminders, onUpdate, onDelete }) {
  const formatTime = (isoString) => {
    const date = new Date(isoString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const toggleEnabled = (reminder) => {
    onUpdate({
      ...reminder,
      enabled: !reminder.enabled
    })
  }

  if (reminders.length === 0) {
    return (
      <div className="empty-state">
        <p>暂无提醒，添加第一个提醒吧！</p>
      </div>
    )
  }

  return (
    <div>
      <h2 style={{ marginBottom: 20, fontSize: 20, color: '#333' }}>
        我的提醒 ({reminders.length})
      </h2>
      <div className="reminder-list">
        {reminders.sort((a, b) => new Date(a.time) - new Date(b.time)).map((reminder) => (
          <div
            key={reminder.id}
            className={`reminder-item ${!reminder.enabled ? 'disabled' : ''}`}
          >
            <div className="reminder-content">
              <h3>{reminder.title}</h3>
              {reminder.content && <p>{reminder.content}</p>}
              <div className="reminder-time">
                🕒 {formatTime(reminder.time)}
                {reminder.repeatType === 'interval' && (
                  <span style={{ color: '#52c41a', marginLeft: 10 }}>
                    🔄 每隔{reminder.intervalMinutes}分钟重复
                  </span>
                )}
                {new Date(reminder.time) < new Date() && reminder.repeatType === 'once' && (
                  <span style={{ color: '#ff4d4f', marginLeft: 10 }}>已过期</span>
                )}
              </div>
            </div>
            <div className="reminder-actions">
              <button
                className={`btn ${reminder.enabled ? 'btn-success' : 'btn-primary'}`}
                onClick={() => toggleEnabled(reminder)}
                disabled={new Date(reminder.time) < new Date()}
              >
                {reminder.enabled ? '已启用' : '已禁用'}
              </button>
              <button
                className="btn btn-danger"
                onClick={() => onDelete(reminder.id)}
              >
                删除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ReminderList
