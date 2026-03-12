const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  getReminders: () => ipcRenderer.invoke('get-reminders'),
  addReminder: (reminder) => ipcRenderer.invoke('add-reminder', reminder),
  updateReminder: (reminder) => ipcRenderer.invoke('update-reminder', reminder),
  deleteReminder: (id) => ipcRenderer.invoke('delete-reminder', id),
  onReminderUpdated: (callback) => ipcRenderer.on('reminder-updated', (event, data) => callback(event, data)),
  onReminderPopup: (callback) => ipcRenderer.on('show-reminder-popup', (event, data) => callback(data))
})
