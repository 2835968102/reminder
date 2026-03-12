import { useState, useEffect } from 'react'
import ReminderForm from './components/ReminderForm'
import ReminderList from './components/ReminderList'
import ReminderPopup from './components/ReminderPopup'

function App() {
  const [reminders, setReminders] = useState([])
  const [refresh, setRefresh] = useState(0)
  const [popupReminder, setPopupReminder] = useState(null)

  useEffect(() => {
    loadReminders()

    // 监听提醒更新事件
    window.electronAPI.onReminderUpdated((_, updatedReminders) => {
      setReminders(updatedReminders)
    })

    // 监听弹窗提醒事件
    window.electronAPI.onReminderPopup((reminder) => {
      setPopupReminder(reminder)
    })
  }, [refresh])

  const loadReminders = async () => {
    const data = await window.electronAPI.getReminders()
    setReminders(data)
  }

  const handleAddReminder = async (reminder) => {
    await window.electronAPI.addReminder(reminder)
    setRefresh(prev => prev + 1)
  }

  const handleUpdateReminder = async (reminder) => {
    await window.electronAPI.updateReminder(reminder)
    setRefresh(prev => prev + 1)
  }

  const handleDeleteReminder = async (id) => {
    await window.electronAPI.deleteReminder(id)
    setRefresh(prev => prev + 1)
  }

  return (
    <div className="container">
      <div className="header">
        <h1>⏰ 定时提醒</h1>
      </div>

      <ReminderForm onAdd={handleAddReminder} />

      <ReminderList
        reminders={reminders}
        onUpdate={handleUpdateReminder}
        onDelete={handleDeleteReminder}
      />

      {popupReminder && (
        <ReminderPopup
          reminder={popupReminder}
          onClose={() => setPopupReminder(null)}
        />
      )}
    </div>
  )
}

export default App
