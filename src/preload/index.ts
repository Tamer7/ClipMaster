import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { ClipboardItem, SearchFilters, AppSettings } from '../shared/types'

// Custom APIs for renderer
const api = {
  // Clipboard operations
  getClipboardHistory: (): Promise<ClipboardItem[]> => ipcRenderer.invoke('get-clipboard-history'),

  searchClipboard: (query: string, filters?: SearchFilters): Promise<ClipboardItem[]> =>
    ipcRenderer.invoke('search-clipboard', query, filters),

  deleteClipboardItem: (id: string): Promise<void> =>
    ipcRenderer.invoke('delete-clipboard-item', id),

  clearClipboardHistory: (): Promise<void> => ipcRenderer.invoke('clear-clipboard-history'),

  pasteItem: (content: string, isImage?: boolean): Promise<void> =>
    ipcRenderer.invoke('paste-item', content, isImage),

  // Settings
  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke('get-settings'),

  updateSettings: (settings: Partial<AppSettings>): Promise<void> =>
    ipcRenderer.invoke('update-settings', settings),

  // Window operations
  showWindow: (): Promise<void> => ipcRenderer.invoke('show-window'),

  hideWindow: (): Promise<void> => ipcRenderer.invoke('hide-window'),

  // Event listeners
  onClipboardChanged: (callback: (item: ClipboardItem) => void) => {
    ipcRenderer.on('clipboard-changed', (_, item) => callback(item))
  },

  onHistoryUpdated: (callback: () => void) => {
    ipcRenderer.on('clipboard-history-updated', () => callback())
  },
  onSettingsChanged: (callback: () => void) => {
    ipcRenderer.on('settings-changed', () => callback())
  },

  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
