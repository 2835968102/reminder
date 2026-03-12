import { useState, useEffect } from 'react'
import ReminderForm from './components/ReminderForm'
import ReminderList from './components/ReminderList'
import ReminderPopup from './components/ReminderPopup'
import SedentaryReminder from './components/SedentaryReminder'

function App() {
  const [activeTab, setActiveTab] = useState('reminder')
  const [reminders, setReminders] = useState([])
  const [refresh, setRefresh] = useState(0)
  const [popupReminder, setPopupReminder] = useState(null)
  const [sedentaryFireCount, setSedentaryFireCount] = useState(0)

  useEffect(() => {
    loadReminders()

    // 监听提醒更新事件
    window.electronAPI.onReminderUpdated((_, updatedReminders) => {
      setReminders(updatedReminders)
    })

    // 监听弹窗提醒事件
    window.electronAPI.onReminderPopup((reminder) => {
      setPopupReminder(reminder)
      if (reminder.id === 'sedentary') {
        setSedentaryFireCount(prev => prev + 1)
      }
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
        <div className="tabs">
          <button
            className={`tab-btn${activeTab === 'reminder' ? ' active' : ''}`}
            onClick={() => setActiveTab('reminder')}
          >
            📋 定时提醒
          </button>
          <button
            className={`tab-btn${activeTab === 'sedentary' ? ' active' : ''}`}
            onClick={() => setActiveTab('sedentary')}
          >
            🧘 久坐提醒
          </button>
        </div>
      </div>

      {activeTab === 'reminder' && (
        <>
          <ReminderForm onAdd={handleAddReminder} />
          <ReminderList
            reminders={reminders}
            onUpdate={handleUpdateReminder}
            onDelete={handleDeleteReminder}
          />
        </>
      )}

      {activeTab === 'sedentary' && (
        <SedentaryReminder fireCount={sedentaryFireCount} />
      )}

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
