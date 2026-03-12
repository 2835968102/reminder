export default {
  appId: 'com.reminder.app',
  productName: 'Reminder',
  directories: {
    output: 'release'
  },
  files: [
    'dist/**/*',
    'public/**/*',
    'package.json'
  ],
  extraResources: [
    {
      from: 'public',
      to: 'public'
    }
  ],
  win: {
    target: 'nsis',
    icon: 'public/icon.ico',
    requestedExecutionLevel: 'asInvoker'
  },
  nsis: {
    oneClick: false,
    allowElevation: true,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'Reminder'
  }
}
