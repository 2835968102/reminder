import { app, BrowserWindow, ipcMain, Notification, Tray, Menu } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import schedule from 'node-schedule'
import Store from 'electron-store'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const store = new Store()
let mainWindow
let tray
let scheduledJobs = new Map()
let sedentaryTimer = null

function createWindow() {
  const isDev = process.env.NODE_ENV === 'development'
  const publicPath = isDev ? path.join(process.cwd(), 'public') : path.join(process.resourcesPath, 'public')
  const iconPath = path.join(publicPath, 'icon.ico')

  // 开发环境如果没有图标则使用默认
  const windowOptions = {
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  }

  try {
    if (require('fs').existsSync(iconPath)) {
      windowOptions.icon = iconPath
    }
  } catch (e) {}

  mainWindow = new BrowserWindow(windowOptions)

  if (isDev) {
    // 开发模式下使用vite提供的动态地址，支持自动端口切换
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('close', (e) => {
    if (!app.isQuiting) {
      e.preventDefault()
      mainWindow.hide()
    }
    return false
  })
}

function createTray() {
  const isDev = process.env.NODE_ENV === 'development'
  const publicPath = isDev ? path.join(process.cwd(), 'public') : path.join(process.resourcesPath, 'public')
  const iconPath = path.join(publicPath, 'icon.ico')

  // 如果没有自定义图标则使用默认图标
  let trayIcon = iconPath
  try {
    if (!require('fs').existsSync(iconPath)) {
      // 使用Electron默认图标
      trayIcon = path.join(process.execPath, '..', 'resources', 'electron.ico')
      if (!require('fs').existsSync(trayIcon)) {
        // 开发环境下使用app图标
        trayIcon = undefined
      }
    }
  } catch (e) {}

  tray = new Tray(trayIcon)
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示主界面',
      click: () => {
        mainWindow.show()
      }
    },
    {
      label: '退出',
      click: () => {
        app.isQuiting = true
        app.quit()
      }
    }
  ])
  tray.setToolTip('Reminder 定时提醒')
  tray.setContextMenu(contextMenu)

  tray.on('double-click', () => {
    mainWindow.show()
  })
}

function loadScheduledJobs() {
  const reminders = store.get('reminders', [])
  reminders.forEach(reminder => {
    if (reminder.enabled) {
      if (reminder.repeatType === 'interval') {
        // 间隔提醒如果时间已经过了，从现在开始计算下一次
        if (new Date(reminder.time) <= new Date()) {
          const nextTime = new Date()
          nextTime.setMinutes(nextTime.getMinutes() + reminder.intervalMinutes)
          reminder.time = nextTime.toISOString()
          // 更新存储
          const index = reminders.findIndex(r => r.id === reminder.id)
          if (index !== -1) {
            reminders[index] = reminder
            store.set('reminders', reminders)
          }
        }
        scheduleReminder(reminder)
      } else {
        // 一次性提醒只有时间未到才调度
        if (new Date(reminder.time) > new Date()) {
          scheduleReminder(reminder)
        }
      }
    }
  })
}

function scheduleReminder(reminder) {
  if (reminder.repeatType === 'once') {
    // 一次性提醒
    const job = schedule.scheduleJob(new Date(reminder.time), () => {
      showNotification(reminder)
      reminder.enabled = false
      const reminders = store.get('reminders', [])
      const index = reminders.findIndex(r => r.id === reminder.id)
      if (index !== -1) {
        reminders[index] = reminder
        store.set('reminders', reminders)
        mainWindow.webContents.send('reminder-updated', reminders)
      }
      scheduledJobs.delete(reminder.id)
    })
    scheduledJobs.set(reminder.id, job)
  } else {
    // 间隔重复提醒
    const runIntervalReminder = () => {
      showNotification(reminder)
      // 计算下一次提醒时间
      const nextTime = new Date()
      nextTime.setMinutes(nextTime.getMinutes() + reminder.intervalMinutes)
      reminder.time = nextTime.toISOString()

      // 更新存储的提醒时间
      const reminders = store.get('reminders', [])
      const index = reminders.findIndex(r => r.id === reminder.id)
      if (index !== -1) {
        reminders[index] = reminder
        store.set('reminders', reminders)
        mainWindow.webContents.send('reminder-updated', reminders)
      }

      // 调度下一次提醒
      if (reminder.enabled) {
        const nextJob = schedule.scheduleJob(nextTime, runIntervalReminder)
        scheduledJobs.set(reminder.id, nextJob)
      } else {
        scheduledJobs.delete(reminder.id)
      }
    }

    // 第一次调度
    const job = schedule.scheduleJob(new Date(reminder.time), runIntervalReminder)
    scheduledJobs.set(reminder.id, job)
  }
}

function showNotification(reminder) {
  const isDev = process.env.NODE_ENV === 'development'
  const publicPath = isDev ? path.join(process.cwd(), 'public') : path.join(process.resourcesPath, 'public')
  const iconPath = path.join(publicPath, 'icon.ico')

  const notificationOptions = {
    title: '⏰ 定时提醒',
    body: reminder.title + (reminder.content ? `\n${reminder.content}` : ''),
    silent: false
  }

  try {
    if (require('fs').existsSync(iconPath)) {
      notificationOptions.icon = iconPath
    }
  } catch (e) {}

  try {
    if (Notification.isSupported()) {
      const notification = new Notification(notificationOptions)
      notification.show()
      notification.on('click', () => {
        mainWindow.show()
        mainWindow.focus()
      })
    }
  } catch (e) {
    console.log('系统通知发送失败:', e.message)
  }

  // 发送 IPC 事件到渲染进程显示应用内弹窗和播放提示音
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('show-reminder-popup', reminder)
  }
}

app.whenReady().then(() => {
  createWindow()
  try {
    createTray()
  } catch (e) {
    console.log('创建系统托盘失败:', e.message)
  }
  loadScheduledJobs()

  // 恢复久坐提醒
  const sedentary = store.get('sedentary', { enabled: false, intervalMinutes: 30 })
  if (sedentary.enabled) {
    const ms = sedentary.intervalMinutes * 60 * 1000
    sedentaryTimer = setInterval(() => {
      const current = store.get('sedentary', { enabled: false, intervalMinutes: 30 })
      if (!current.enabled) {
        clearInterval(sedentaryTimer)
        sedentaryTimer = null
        return
      }
      showSedentaryNotification(current.intervalMinutes)
    }, ms)
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// IPC handlers
ipcMain.handle('get-reminders', () => {
  return store.get('reminders', [])
})

ipcMain.handle('add-reminder', (_, reminder) => {
  const reminders = store.get('reminders', [])
  const newReminder = {
    id: Date.now().toString(),
    ...reminder,
    createdAt: new Date().toISOString()
  }
  reminders.push(newReminder)
  store.set('reminders', reminders)

  if (newReminder.enabled) {
    if (newReminder.repeatType === 'interval') {
      // 间隔提醒：如果首次时间已过则从现在起计算
      if (new Date(newReminder.time) <= new Date()) {
        const nextTime = new Date()
        nextTime.setMinutes(nextTime.getMinutes() + newReminder.intervalMinutes)
        newReminder.time = nextTime.toISOString()
        reminders[reminders.length - 1] = newReminder
        store.set('reminders', reminders)
      }
      scheduleReminder(newReminder)
    } else if (new Date(newReminder.time) > new Date()) {
      scheduleReminder(newReminder)
    }
  }

  return newReminder
})

ipcMain.handle('update-reminder', (_, updatedReminder) => {
  const reminders = store.get('reminders', [])
  const index = reminders.findIndex(r => r.id === updatedReminder.id)
  if (index !== -1) {
    // 取消旧的定时任务
    if (scheduledJobs.has(updatedReminder.id)) {
      scheduledJobs.get(updatedReminder.id).cancel()
      scheduledJobs.delete(updatedReminder.id)
    }

    reminders[index] = updatedReminder
    store.set('reminders', reminders)

    // 重新调度新的任务
    if (updatedReminder.enabled) {
      if (updatedReminder.repeatType === 'interval') {
        // 间隔提醒：如果时间已过则从现在起计算下一次
        if (new Date(updatedReminder.time) <= new Date()) {
          const nextTime = new Date()
          nextTime.setMinutes(nextTime.getMinutes() + updatedReminder.intervalMinutes)
          updatedReminder.time = nextTime.toISOString()
          reminders[index] = updatedReminder
          store.set('reminders', reminders)
        }
        scheduleReminder(updatedReminder)
      } else if (new Date(updatedReminder.time) > new Date()) {
        scheduleReminder(updatedReminder)
      }
    }

    return updatedReminder
  }
  return null
})

ipcMain.handle('delete-reminder', (_, id) => {
  const reminders = store.get('reminders', [])
  const filteredReminders = reminders.filter(r => r.id !== id)
  store.set('reminders', filteredReminders)

  if (scheduledJobs.has(id)) {
    scheduledJobs.get(id).cancel()
    scheduledJobs.delete(id)
  }

  return true
})

// 久坐提醒 IPC
ipcMain.handle('get-sedentary', () => {
  return store.get('sedentary', { enabled: false, intervalMinutes: 30 })
})

ipcMain.handle('set-sedentary', (_, settings) => {
  store.set('sedentary', settings)

  // 清除已有计时器
  if (sedentaryTimer) {
    clearInterval(sedentaryTimer)
    sedentaryTimer = null
  }

  if (settings.enabled) {
    const ms = settings.intervalMinutes * 60 * 1000
    sedentaryTimer = setInterval(() => {
      const sedentary = store.get('sedentary', { enabled: false, intervalMinutes: 30 })
      if (!sedentary.enabled) {
        clearInterval(sedentaryTimer)
        sedentaryTimer = null
        return
      }
      showSedentaryNotification(sedentary.intervalMinutes)
    }, ms)
  }

  return settings
})

function showSedentaryNotification(intervalMinutes) {
  const isDev = process.env.NODE_ENV === 'development'
  const publicPath = isDev ? path.join(process.cwd(), 'public') : path.join(process.resourcesPath, 'public')
  const iconPath = path.join(publicPath, 'icon.ico')

  const notificationOptions = {
    title: '🧘 久坐提醒',
    body: `你已久坐 ${intervalMinutes} 分钟，起来活动一下吧！`,
    silent: false
  }

  try {
    if (require('fs').existsSync(iconPath)) {
      notificationOptions.icon = iconPath
    }
  } catch (e) {}

  try {
    if (Notification.isSupported()) {
      const notification = new Notification(notificationOptions)
      notification.show()
      notification.on('click', () => {
        mainWindow.show()
        mainWindow.focus()
      })
    }
  } catch (e) {
    console.log('久坐提醒通知发送失败:', e.message)
  }

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('show-reminder-popup', {
      id: 'sedentary',
      title: '起来活动一下！',
      content: `你已久坐 ${intervalMinutes} 分钟，建议站起来伸展一下身体。`,
      repeatType: 'interval',
      intervalMinutes
    })
  }
}
