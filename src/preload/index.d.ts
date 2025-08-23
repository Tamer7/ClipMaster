import { ElectronAPI } from '@electron-toolkit/preload'
import { ClipboardItem, SearchFilters, AppSettings } from '../shared/types'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      // Clipboard operations
      getClipboardHistory: () => Promise<ClipboardItem[]>
      searchClipboard: (query: string, filters?: SearchFilters) => Promise<ClipboardItem[]>
      deleteClipboardItem: (id: string) => Promise<void>
      clearClipboardHistory: () => Promise<void>
      pasteItem: (content: string, isImage?: boolean) => Promise<void>

      // Settings
      getSettings: () => Promise<AppSettings>
      updateSettings: (settings: Partial<AppSettings>) => Promise<void>

      // Window operations
      showWindow: () => Promise<void>
      hideWindow: () => Promise<void>

      // Event listeners
      onClipboardChanged: (callback: (item: ClipboardItem) => void) => void
      onHistoryUpdated: (callback: () => void) => void
      onSettingsChanged: (callback: () => void) => void
      removeAllListeners: (channel: string) => void
    }
  }
}
