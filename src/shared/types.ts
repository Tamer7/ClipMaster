export interface ClipboardItem {
  id: string
  content: string
  type: ClipboardItemType
  category: string
  timestamp: number
  preview: string
  language?: string // For code snippets
  size: number // Content size in bytes
}

export enum ClipboardItemType {
  TEXT = 'text',
  CODE = 'code',
  URL = 'url',
  JSON = 'json',
  XML = 'xml',
  EMAIL = 'email',
  PATH = 'path',
  COLOR = 'color',
  IMAGE = 'image'
}

export interface SearchFilters {
  type?: ClipboardItemType
  category?: string
  dateRange?: {
    start: number
    end: number
  }
}

export interface AppSettings {
  maxItems: number
  globalShortcut: string
  enablePreview: boolean
  autoCategorizationEnabled: boolean
  theme: 'light' | 'dark' | 'system'
}

export interface IpcEvents {
  'clipboard-changed': (item: ClipboardItem) => void
  'get-clipboard-history': () => ClipboardItem[]
  'search-clipboard': (query: string, filters?: SearchFilters) => ClipboardItem[]
  'delete-clipboard-item': (id: string) => void
  'clear-clipboard-history': () => void
  'get-settings': () => AppSettings
  'update-settings': (settings: Partial<AppSettings>) => void
  'paste-item': (content: string) => void
  'show-window': () => void
  'hide-window': () => void
}
