import { clipboard } from 'electron'
import Store from 'electron-store'
import { ClipboardItem, ClipboardItemType, AppSettings } from '../shared/types'

export class ClipboardManager {
  private store: Store<{ items: ClipboardItem[] }>
  private settingsStore: Store<AppSettings>
  private lastClipboardContent: string = ''
  private isMonitoring: boolean = false
  private monitoringInterval: NodeJS.Timeout | null = null
  private isInternalOperation: boolean = false

  constructor() {
    this.store = new Store({
      name: 'clipboard-history',
      defaults: {
        items: []
      }
    })

    this.settingsStore = new Store({
      name: 'app-settings',
      defaults: {
        maxItems: 500,
        globalShortcut: 'CommandOrControl+Shift+V',
        enablePreview: true,
        autoCategorizationEnabled: true,
        theme: 'system'
      } as AppSettings
    })
  }

  startMonitoring(): void {
    if (this.isMonitoring) {
      console.log('Clipboard monitoring already running')
      return
    }

    console.log('Starting clipboard monitoring...')
    this.isMonitoring = true
    this.lastClipboardContent = clipboard.readText()

    this.monitoringInterval = setInterval(() => {
      this.checkClipboard()
    }, 500) // Check every 500ms

    console.log('Clipboard monitoring started successfully')
  }

  stopMonitoring(): void {
    if (!this.isMonitoring) return

    this.isMonitoring = false
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
  }

  private checkClipboard(): void {
    try {
      // Skip if we're performing an internal operation
      if (this.isInternalOperation) {
        console.log('Skipping clipboard check - internal operation')
        return
      }

      let currentContent = ''
      let isImage = false

      // Check for image first
      const image = clipboard.readImage()
      if (!image.isEmpty()) {
        currentContent = image.toDataURL()
        isImage = true
      } else {
        // Check for text
        const textContent = clipboard.readText()
        if (textContent) {
          currentContent = textContent
          isImage = false
        }
      }

      // Only add if we have content and it's different from the last one
      if (currentContent && currentContent !== this.lastClipboardContent) {
        console.log('New clipboard content detected:', currentContent.substring(0, 50) + '...')
        this.lastClipboardContent = currentContent
        const item = this.createClipboardItem(currentContent, isImage)
        this.addItem(item)
      }
    } catch (error) {
      console.error('Error checking clipboard:', error)
    }
  }

  private createClipboardItem(content: string, isImage: boolean = false): ClipboardItem {
    const timestamp = Date.now()
    const type = isImage ? ClipboardItemType.IMAGE : this.detectContentType(content)
    const category = this.categorizeContent(content, type)
    const preview = this.generatePreview(content, type)

    return {
      id: `${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
      content,
      type,
      category,
      timestamp,
      preview,
      language: type === ClipboardItemType.CODE ? this.detectLanguage(content) : undefined,
      size: isImage ? content.length : new Blob([content]).size
    }
  }

  private detectContentType(content: string): ClipboardItemType {
    // URL detection
    const urlRegex = /^https?:\/\/[^\s]+$/i
    if (urlRegex.test(content.trim())) {
      return ClipboardItemType.URL
    }

    // Email detection
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (emailRegex.test(content.trim())) {
      return ClipboardItemType.EMAIL
    }

    // File path detection
    const pathRegex = /^[a-zA-Z]:\\|^\/|^\.{1,2}\//
    if (pathRegex.test(content.trim()) && content.length < 500) {
      return ClipboardItemType.PATH
    }

    // Color detection (hex, rgb, hsl)
    const colorRegex = /^(#[0-9a-f]{3,8}|rgb\(|rgba\(|hsl\(|hsla\()/i
    if (colorRegex.test(content.trim()) && content.length < 50) {
      return ClipboardItemType.COLOR
    }

    // JSON detection
    try {
      JSON.parse(content)
      if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
        return ClipboardItemType.JSON
      }
    } catch {}

    // XML detection
    const xmlRegex = /^\s*<\?xml|^\s*<[a-zA-Z]/
    if (xmlRegex.test(content)) {
      return ClipboardItemType.XML
    }

    // Code detection (simplified)
    const codePatterns = [
      /function\s+\w+\s*\(/,
      /class\s+\w+/,
      /import\s+.*from/,
      /export\s+(default\s+)?/,
      /const\s+\w+\s*=/,
      /let\s+\w+\s*=/,
      /var\s+\w+\s*=/,
      /if\s*\([^)]*\)\s*\{/,
      /for\s*\([^)]*\)\s*\{/,
      /while\s*\([^)]*\)\s*\{/,
      /def\s+\w+\s*\(/,
      /public\s+\w+/,
      /private\s+\w+/,
      /\w+\s*\([^)]*\)\s*\{/
    ]

    if (codePatterns.some((pattern) => pattern.test(content))) {
      return ClipboardItemType.CODE
    }

    return ClipboardItemType.TEXT
  }

  private categorizeContent(content: string, type: ClipboardItemType): string {
    switch (type) {
      case ClipboardItemType.URL:
        if (content.includes('github.com')) return 'GitHub'
        if (content.includes('stackoverflow.com')) return 'Stack Overflow'
        if (content.includes('youtube.com') || content.includes('youtu.be')) return 'YouTube'
        if (content.includes('docs.')) return 'Documentation'
        return 'Web Links'

      case ClipboardItemType.CODE:
        const language = this.detectLanguage(content)
        return language ? `${language.toUpperCase()} Code` : 'Code Snippets'

      case ClipboardItemType.JSON:
        return 'JSON Data'

      case ClipboardItemType.XML:
        return 'XML/HTML'

      case ClipboardItemType.EMAIL:
        return 'Email Addresses'

      case ClipboardItemType.PATH:
        return 'File Paths'

      case ClipboardItemType.COLOR:
        return 'Colors'

      case ClipboardItemType.IMAGE:
        return 'Images'

      default:
        // Categorize text by length and content
        if (content.length < 50) return 'Short Text'
        if (content.length > 1000) return 'Long Text'
        if (content.includes('\n')) return 'Multi-line Text'
        return 'Text'
    }
  }

  private detectLanguage(content: string): string | undefined {
    const languagePatterns = {
      javascript: [
        /function\s+\w+/,
        /const\s+\w+\s*=/,
        /=>\s*\{/,
        /console\.log/,
        /require\(/,
        /import.*from/
      ],
      typescript: [/interface\s+\w+/, /type\s+\w+\s*=/, /: \w+\[\]/, /as\s+\w+/],
      python: [
        /def\s+\w+\(/,
        /import\s+\w+/,
        /from\s+\w+\s+import/,
        /if\s+__name__\s*==/,
        /print\(/
      ],
      java: [/public\s+class/, /public\s+static\s+void/, /System\.out\./, /import\s+java\./],
      css: [/\w+\s*\{[^}]*\}/, /@media/, /\.[\w-]+\s*\{/, /#[\w-]+\s*\{/],
      html: [/<\w+[^>]*>/, /<\/\w+>/, /<!DOCTYPE/, /<html/],
      sql: [/SELECT\s+.*FROM/i, /INSERT\s+INTO/i, /UPDATE\s+.*SET/i, /DELETE\s+FROM/i],
      json: [/^\s*[\{\[]/, /"\w+":/],
      bash: [/#!\/bin/, /\$\w+/, /echo\s+/, /cd\s+/],
      powershell: [/Get-\w+/, /Set-\w+/, /\$\w+\s*=/, /Write-Host/]
    }

    for (const [language, patterns] of Object.entries(languagePatterns)) {
      if (patterns.some((pattern) => pattern.test(content))) {
        return language
      }
    }

    return undefined
  }

  private generatePreview(content: string, type: ClipboardItemType): string {
    const maxLength = 100

    // For images, return a descriptive preview
    if (type === ClipboardItemType.IMAGE) {
      return 'Image data (click to view)'
    }

    if (content.length <= maxLength) {
      return content
    }

    // For code, try to get a meaningful first line
    if (type === ClipboardItemType.CODE) {
      const lines = content.split('\n')
      const meaningfulLine = lines.find(
        (line) =>
          line.trim() &&
          !line.trim().startsWith('//') &&
          !line.trim().startsWith('/*') &&
          !line.trim().startsWith('*')
      )

      if (meaningfulLine && meaningfulLine.length <= maxLength) {
        return meaningfulLine.trim()
      }
    }

    return content.substring(0, maxLength) + '...'
  }

  addItem(item: ClipboardItem): void {
    const items = this.getHistory()

    // Remove all existing items with the same content (there might be multiple for some reason)
    const filteredItems = items.filter((existingItem) => existingItem.content !== item.content)

    // Add the new item at the beginning
    const newItems = [item, ...filteredItems]

    // Limit to max items
    const maxItems = this.getSettings().maxItems
    const limitedItems = newItems.slice(0, maxItems)

    this.store.set('items', limitedItems as ClipboardItem[])
  }

  getHistory(): ClipboardItem[] {
    return this.store.get('items', []) as ClipboardItem[]
  }

  searchHistory(query: string): ClipboardItem[] {
    const items = this.getHistory()

    if (!query.trim()) {
      return items
    }

    const searchTerm = query.toLowerCase()

    return items.filter(
      (item) =>
        item.content.toLowerCase().includes(searchTerm) ||
        item.category.toLowerCase().includes(searchTerm) ||
        (item.language && item.language.toLowerCase().includes(searchTerm))
    )
  }

  deleteItem(id: string): void {
    const items = this.getHistory()
    const filteredItems = items.filter((item) => item.id !== id)
    this.store.set('items', filteredItems)
  }

  clearHistory(): void {
    this.store.set('items', [])
  }

  getSettings(): AppSettings {
    return this.settingsStore.store
  }

  updateSettings(settings: Partial<AppSettings>): void {
    const currentSettings = this.getSettings()
    const newSettings = { ...currentSettings, ...settings }
    this.settingsStore.store = newSettings
  }

  copyToClipboard(content: string, isImage: boolean = false): void {
    // Set flag to indicate internal operation
    this.isInternalOperation = true

    try {
      if (isImage && content.startsWith('data:image/')) {
        // Convert data URL back to image and write to clipboard
        const { nativeImage } = require('electron')
        const image = nativeImage.createFromDataURL(content)
        clipboard.writeImage(image)
        this.lastClipboardContent = content
      } else {
        clipboard.writeText(content)
        this.lastClipboardContent = content
      }
    } catch (error) {
      console.error('Failed to write to clipboard:', error)
      // Fallback to text for images
      if (isImage) {
        clipboard.writeText(content)
        this.lastClipboardContent = content
      }
    }

    // Clear the internal operation flag after a short delay
    setTimeout(() => {
      this.isInternalOperation = false
    }, 200)
  }
}
