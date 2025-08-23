import { app, shell, BrowserWindow, ipcMain, globalShortcut } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { ClipboardManager } from './clipboard-manager'
import { ClipboardItem, SearchFilters, AppSettings } from '../shared/types'

let mainWindow: BrowserWindow
let clipboardManager: ClipboardManager

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 500,
    height: 600,
    minWidth: 400,
    minHeight: 300,
    show: false,
    frame: false,
    autoHideMenuBar: true,
    resizable: true,
    minimizable: false,
    maximizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    movable: true,
    titleBarStyle: 'hidden',
    transparent: true,
    backgroundColor: '#00000000',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    if (is.dev) {
      mainWindow.webContents.openDevTools()
    }
  })

  // Auto-hide when window loses focus
  mainWindow.on('blur', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide()
    }
  })

  // Hide window instead of closing when user clicks X
  mainWindow.on('close', (event) => {
    if (!(app as any).isQuiting) {
      event.preventDefault()
      mainWindow.hide()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function setupGlobalShortcuts(): void {
  const settings = clipboardManager.getSettings()

  // Register global shortcut to show/hide the app
  globalShortcut.register(settings.globalShortcut, () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow.show()
      mainWindow.focus()
    }
  })
}

function setupIpcHandlers(): void {
  // Get clipboard history
  ipcMain.handle('get-clipboard-history', (): ClipboardItem[] => {
    return clipboardManager.getHistory()
  })

  // Search clipboard
  ipcMain.handle('search-clipboard', (_, query: string): ClipboardItem[] => {
    return clipboardManager.searchHistory(query)
  })

  // Delete clipboard item
  ipcMain.handle('delete-clipboard-item', (_, id: string): void => {
    clipboardManager.deleteItem(id)
  })

  // Clear clipboard history
  ipcMain.handle('clear-clipboard-history', (): void => {
    clipboardManager.clearHistory()
  })

  // Get settings
  ipcMain.handle('get-settings', (): AppSettings => {
    return clipboardManager.getSettings()
  })

  // Update settings
  ipcMain.handle('update-settings', (_, settings: Partial<AppSettings>): void => {
    clipboardManager.updateSettings(settings)

    // Re-register global shortcuts if shortcut changed
    if (settings.globalShortcut) {
      globalShortcut.unregisterAll()
      setupGlobalShortcuts()
    }

    // Notify renderer of settings change
    mainWindow.webContents.send('settings-changed')
  })

  // Paste item (copy to clipboard)
  ipcMain.handle('paste-item', (_, content: string, isImage?: boolean): void => {
    clipboardManager.copyToClipboard(content, isImage)
  })

  // Show/hide window
  ipcMain.handle('show-window', (): void => {
    // Center the window on screen
    mainWindow.center()
    mainWindow.show()
    mainWindow.focus()
  })

  ipcMain.handle('hide-window', (): void => {
    mainWindow.hide()
  })

  // Listen for clipboard changes to notify renderer
  const originalAddItem = clipboardManager.addItem.bind(clipboardManager)
  clipboardManager.addItem = function (item: ClipboardItem): void {
    originalAddItem(item)
    // Notify renderer of both the new item (for notifications) and history update (for UI refresh)
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('clipboard-changed', item)
      mainWindow.webContents.send('clipboard-history-updated')
    }
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Initialize clipboard manager
  clipboardManager = new ClipboardManager()

  // Setup IPC handlers
  setupIpcHandlers()

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  // Setup global shortcuts after window is created
  setupGlobalShortcuts()

  // Start clipboard monitoring
  clipboardManager.startMonitoring()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  ;(app as any).isQuiting = true
  clipboardManager?.stopMonitoring()
  globalShortcut.unregisterAll()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
