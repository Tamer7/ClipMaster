import React, { useState, useEffect, useCallback } from 'react'
import { useMantineColorScheme } from '@mantine/core'
import {
  AppShell,
  Text,
  Group,
  ActionIcon,
  Grid,
  Stack,
  Kbd,
  Center,
  Loader,
  Button
} from '@mantine/core'
import { useHotkeys, useDisclosure, useViewportSize } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { IconSettings, IconTrash, IconClipboard } from '@tabler/icons-react'
import { ClipboardItem, ClipboardItemType } from '../../shared/types'
import SettingsModal from './components/SettingsModal'
import SearchInput from './components/SearchInput'
import ClipboardList from './components/ClipboardList'
import PreviewPanel from './components/PreviewPanel'
import FormatModal from './components/FormatModal'

function App(): React.JSX.Element {
  const [clipboardItems, setClipboardItems] = useState<ClipboardItem[]>([])
  const [filteredItems, setFilteredItems] = useState<ClipboardItem[]>([])
  const [selectedItem, setSelectedItem] = useState<ClipboardItem | null>(null)
  const [selectedItems, setSelectedItems] = useState<ClipboardItem[]>([]) // Multi-select
  const [searchQuery, setSearchQuery] = useState('')
  const [settingsOpened, { open: openSettings, close: closeSettings }] = useDisclosure(false)
  const [formatModalOpened, { open: openFormatModal, close: closeFormatModal }] =
    useDisclosure(false)
  const [loading, setLoading] = useState(true)
  const { width } = useViewportSize()
  const { setColorScheme } = useMantineColorScheme()

  // Load and apply theme from settings
  const loadAndApplyTheme = useCallback(async () => {
    try {
      const settings = await window.api.getSettings()
      if (settings.theme === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        setColorScheme(isDark ? 'dark' : 'light')
      } else {
        setColorScheme(settings.theme)
      }
    } catch (error) {
      console.error('Failed to load theme:', error)
    }
  }, [setColorScheme])

  // Listen for settings changes to update theme
  useEffect(() => {
    const handleSettingsChange = async () => {
      await loadAndApplyTheme()
    }
    window.api.onSettingsChanged(handleSettingsChange)
    return () => {
      window.api.removeAllListeners('settings-changed')
    }
  }, [loadAndApplyTheme])

  // Hotkeys
  useHotkeys([
    ['Escape', () => window.api.hideWindow()],
    ['ctrl+f', () => document.getElementById('search-input')?.focus()]
  ])

  // Load clipboard history on mount
  useEffect(() => {
    loadClipboardHistory()
    loadAndApplyTheme()

    // Listen for clipboard history updates (handles reordering and deduplication)
    window.api.onHistoryUpdated(() => {
      loadClipboardHistory()
    })

    // Listen for new clipboard items (for notifications)
    // window.api.onClipboardChanged((newItem: ClipboardItem) => {
    //   notifications.show({
    //     title: 'New clipboard item',
    //     message: `${newItem.category}: ${newItem.preview}`,
    //     icon: <IconClipboard size={16} />,
    //     autoClose: 2000
    //   })
    // })

    return () => {
      window.api.removeAllListeners('clipboard-changed')
      window.api.removeAllListeners('clipboard-history-updated')
    }
  }, [])

  // Filter items when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredItems(clipboardItems)
    } else {
      const filtered = clipboardItems.filter(
        (item) =>
          item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.language?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredItems(filtered)
    }
  }, [clipboardItems, searchQuery])

  const loadClipboardHistory = async () => {
    try {
      const items = await window.api.getClipboardHistory()
      setClipboardItems(items)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load clipboard history:', error)
      setLoading(false)
    }
  }

  const handleItemClick = async (item: ClipboardItem, hideWindow: boolean = false) => {
    try {
      const isImage = item.type === ClipboardItemType.IMAGE
      await window.api.pasteItem(item.content, isImage)

      if (hideWindow) {
        setTimeout(() => window.api.hideWindow(), 100)
      }
    } catch (error) {
      console.error('Failed to copy item:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to copy item',
        color: 'red',
        autoClose: 3000
      })
    }
  }

  const handleDeleteItem = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent item click
    try {
      await window.api.deleteClipboardItem(id)
      setClipboardItems((prev) => prev.filter((item) => item.id !== id))
      if (selectedItem?.id === id) {
        setSelectedItem(null)
      }
      notifications.show({
        title: 'Deleted',
        message: 'Item removed from history',
        icon: <IconTrash size={16} />,
        autoClose: 2000
      })
    } catch (error) {
      console.error('Failed to delete item:', error)
    }
  }

  const handleClearHistory = async () => {
    try {
      await window.api.clearClipboardHistory()
      setClipboardItems([])
      setSelectedItem(null)
      notifications.show({
        title: 'Cleared',
        message: 'All clipboard history cleared',
        icon: <IconTrash size={16} />,
        autoClose: 2000
      })
    } catch (error) {
      console.error('Failed to clear history:', error)
    }
  }

  const handleSelectItem = (item: ClipboardItem, event?: React.MouseEvent) => {
    // Multi-select with Ctrl/Cmd or Shift
    if (event?.ctrlKey || event?.metaKey) {
      // Ctrl+Click: Toggle individual selection
      setSelectedItems((prev) => {
        const isSelected = prev.some((i) => i.id === item.id)
        if (isSelected) {
          return prev.filter((i) => i.id !== item.id)
        } else {
          return [...prev, item]
        }
      })
      setSelectedItem(item) // Keep last selected as primary
    } else if (event?.shiftKey && selectedItem) {
      // Shift+Click: Select range
      const currentIndex = filteredItems.findIndex((i) => i.id === selectedItem.id)
      const clickedIndex = filteredItems.findIndex((i) => i.id === item.id)
      const start = Math.min(currentIndex, clickedIndex)
      const end = Math.max(currentIndex, clickedIndex)
      const rangeItems = filteredItems.slice(start, end + 1)
      setSelectedItems(rangeItems)
      setSelectedItem(item)
    } else {
      // Normal click: Clear multi-selection and select single item
      setSelectedItems([])
      setSelectedItem(item)
      // Immediately copy to clipboard when item is selected (single click)
      handleItemClick(item, false) // Don't hide window
    }
  }

  const handlePasteAndHide = (item: ClipboardItem) => {
    // Double-click behavior - paste and hide window
    handleItemClick(item, true) // Hide window
  }

  const handleMultiPaste = (formattedContent: string) => {
    // Paste the formatted multi-select content
    handleItemClick(
      { content: formattedContent, type: ClipboardItemType.TEXT } as ClipboardItem,
      true
    )
    setSelectedItems([]) // Clear multi-selection
  }

  const handleFormatAndPaste = () => {
    if (selectedItems.length > 1) {
      openFormatModal()
    }
  }

  if (loading) {
    return (
      <Center style={{ height: '100vh' }}>
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text>Loading clipboard history...</Text>
        </Stack>
      </Center>
    )
  }

  return (
    <div
      style={{
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
        border: '1px solid var(--mantine-color-default-border)',
        backgroundColor: 'var(--mantine-color-body)'
      }}
    >
      <AppShell
        header={{ height: 120 }}
        padding="md"
        style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      >
        <AppShell.Header p="md">
          <Stack gap="sm">
            <Group
              justify="space-between"
              style={
                {
                  WebkitAppRegion: 'drag',
                  cursor: 'move',
                  paddingBottom: '4px'
                } as React.CSSProperties
              }
            >
              <Text
                size="xl"
                fw={700}
                c="blue"
                style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
              >
                Snippet Finder
              </Text>
              <Group gap="xs" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
                {selectedItems.length > 1 && (
                  <Button
                    size="sm"
                    color="green"
                    onClick={handleFormatAndPaste}
                    leftSection={<IconClipboard size={16} />}
                  >
                    Paste {selectedItems.length} items
                  </Button>
                )}
                <ActionIcon variant="light" onClick={openSettings} aria-label="Settings">
                  <IconSettings size={18} />
                </ActionIcon>
                <ActionIcon
                  variant="light"
                  color="red"
                  onClick={handleClearHistory}
                  aria-label="Clear History"
                >
                  <IconTrash size={18} />
                </ActionIcon>
              </Group>
            </Group>

            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search clipboard history... (Ctrl+F)"
            />
          </Stack>
        </AppShell.Header>

        <AppShell.Main
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <Grid style={{ flex: 1, margin: 0, position: 'relative' }}>
            <Grid.Col
              span={selectedItem && width > 600 ? 8 : 12}
              style={{
                height: 'calc(100vh - 160px)',
                overflowY: 'auto',
                scrollbarWidth: 'thin',
                scrollbarColor: 'var(--mantine-color-dark-4) transparent',
                paddingRight: '8px',
                paddingBottom: '16px'
              }}
            >
              <ClipboardList
                items={filteredItems}
                selectedItem={selectedItem}
                selectedItems={selectedItems}
                onSelectItem={handleSelectItem}
                onPasteAndHide={handlePasteAndHide}
                onDeleteItem={handleDeleteItem}
              />
            </Grid.Col>

            {selectedItem && width > 600 && (
              <Grid.Col
                span={4}
                style={{
                  height: 'calc(100% - 40px)',
                  overflowY: 'auto',
                  background: 'var(--mantine-color-default-hover)',
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'var(--mantine-color-dark-4) transparent',
                  paddingRight: '8px',
                  paddingBottom: '16px'
                }}
              >
                <PreviewPanel
                  item={selectedItem}
                  onPaste={() => handleItemClick(selectedItem, true)} // Hide window when using paste button
                  onDelete={() => handleDeleteItem(selectedItem.id, {} as React.MouseEvent)}
                  onClose={() => setSelectedItem(null)}
                />
              </Grid.Col>
            )}
          </Grid>

          <SettingsModal opened={settingsOpened} onClose={closeSettings} />
          <FormatModal
            opened={formatModalOpened}
            onClose={closeFormatModal}
            selectedItems={selectedItems}
            onPaste={handleMultiPaste}
          />
        </AppShell.Main>
      </AppShell>
    </div>
  )
}

export default App
