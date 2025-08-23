import React, { useState, useEffect } from 'react'
import {
  Modal,
  Stack,
  Group,
  Text,
  NumberInput,
  Select,
  Switch,
  Button,
  Divider,
  Badge
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconSettings, IconKeyboard } from '@tabler/icons-react'
import { AppSettings } from '../../../shared/types'
import KeyRecorder from './KeyRecorder'

interface SettingsModalProps {
  opened: boolean
  onClose: () => void
}

const SettingsModal: React.FC<SettingsModalProps> = ({ opened, onClose }) => {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (opened) {
      loadSettings()
    }
  }, [opened])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const currentSettings = await window.api.getSettings()
      setSettings(currentSettings)
    } catch (error) {
      console.error('Failed to load settings:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to load settings',
        color: 'red',
        autoClose: 3000
      })
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    if (!settings) return

    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)

    try {
      await window.api.updateSettings({ [key]: value })

      if (key === 'globalShortcut') {
        notifications.show({
          title: 'Shortcut Updated!',
          message: value ? `New global shortcut: ${value}` : 'Global shortcut cleared',
          color: 'green',
          autoClose: 3000
        })
      }
    } catch (error) {
      console.error('Failed to update setting:', error)
      // Revert on error
      setSettings(settings)
      notifications.show({
        title: 'Error',
        message: 'Failed to update setting',
        color: 'red',
        autoClose: 3000
      })
    }
  }

  const shortcuts = [
    { key: 'Click', description: 'Copy item to clipboard' },
    { key: 'Double-click', description: 'Paste item & close window' },
    { key: 'Enter', description: 'Paste selected item' },
    { key: 'Delete', description: 'Delete selected item' },
    { key: 'Ctrl+F', description: 'Focus search' },
    { key: 'Escape', description: 'Hide window' }
  ]

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconSettings size={20} />
          <Text fw={600} size="lg">
            Settings
          </Text>
        </Group>
      }
      size="lg"
      centered
    >
      {loading || !settings ? (
        <Text>Loading settings...</Text>
      ) : (
        <Stack gap="xl">
          {/* General Settings */}
          <div>
            <Text fw={600} size="md" mb="md">
              General
            </Text>
            <Stack gap="md">
              <NumberInput
                label="Maximum clipboard items"
                description="How many clipboard items to keep in history"
                value={settings.maxItems}
                onChange={(val) => updateSetting('maxItems', Number(val) || 500)}
                min={50}
                max={2000}
                stepHoldDelay={500}
                stepHoldInterval={100}
              />

              <KeyRecorder
                label="Global shortcut"
                description="Keyboard shortcut to show/hide the app"
                value={settings.globalShortcut}
                onChange={(shortcut) => updateSetting('globalShortcut', shortcut)}
              />

              <Select
                label="Theme"
                description="Choose your preferred color scheme"
                value={settings.theme}
                onChange={(val) => updateSetting('theme', val as 'light' | 'dark' | 'system')}
                data={[
                  { value: 'system', label: 'System' },
                  { value: 'light', label: 'Light' },
                  { value: 'dark', label: 'Dark' }
                ]}
              />
            </Stack>
          </div>

          <Divider />

          {/* Features */}
          <div>
            <Text fw={600} size="md" mb="md">
              Features
            </Text>
            <Stack gap="md">
              <Switch
                label="Enable content preview"
                description="Show detailed preview panel for selected items"
                checked={settings.enablePreview}
                onChange={(e) => updateSetting('enablePreview', e.currentTarget.checked)}
              />

              <Switch
                label="Auto-categorization"
                description="Automatically categorize clipboard content by type"
                checked={settings.autoCategorizationEnabled}
                onChange={(e) =>
                  updateSetting('autoCategorizationEnabled', e.currentTarget.checked)
                }
              />
            </Stack>
          </div>

          <Divider />

          {/* Keyboard Shortcuts */}
          <div>
            <Group gap="xs" mb="md">
              <IconKeyboard size={18} />
              <Text fw={600} size="md">
                Keyboard Shortcuts
              </Text>
            </Group>
            <Stack gap="xs">
              {shortcuts.map((shortcut, index) => (
                <Group key={`shortcut-${shortcut.key}`} justify="space-between">
                  <Text size="sm">{shortcut.description}</Text>
                  <Badge variant="outline" size="sm">
                    {shortcut.key}
                  </Badge>
                </Group>
              ))}
            </Stack>
          </div>

          <Divider />

          <Group justify="flex-end">
            <Button onClick={onClose}>Done</Button>
          </Group>
        </Stack>
      )}
    </Modal>
  )
}

export default SettingsModal
