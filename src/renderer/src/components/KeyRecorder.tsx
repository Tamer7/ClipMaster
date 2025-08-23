import React, { useState, useEffect, useCallback } from 'react'
import { Button, Text, Group, Kbd } from '@mantine/core'
import { IconKeyboard, IconX } from '@tabler/icons-react'

interface KeyRecorderProps {
  value: string
  onChange: (shortcut: string) => void
  label?: string
  description?: string
}

const KeyRecorder: React.FC<KeyRecorderProps> = ({ value, onChange, label, description }) => {
  const [isRecording, setIsRecording] = useState(false)
  const [recordedKeys, setRecordedKeys] = useState<string[]>([])

  const formatShortcut = (shortcut: string): string[] => {
    if (!shortcut) return []
    return shortcut.split('+').map(key => {
      // Convert electron shortcuts to display format
      switch (key.toLowerCase()) {
        case 'cmdorctrl':
        case 'commandorcontrol':
          return navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'
        case 'ctrl':
        case 'control':
          return 'Ctrl'
        case 'cmd':
        case 'command':
          return 'Cmd'
        case 'alt':
          return 'Alt'
        case 'shift':
          return 'Shift'
        case 'meta':
          return navigator.platform.includes('Mac') ? 'Cmd' : 'Win'
        default:
          return key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()
      }
    })
  }

  const normalizeKey = (key: string): string => {
    // Normalize keys for electron shortcuts
    switch (key.toLowerCase()) {
      case 'control':
        return 'CommandOrControl'
      case 'meta':
        return navigator.platform.includes('Mac') ? 'Command' : 'CommandOrControl'
      case 'alt':
        return 'Alt'
      case 'shift':
        return 'Shift'
      case ' ':
        return 'Space'
      case 'arrowup':
        return 'Up'
      case 'arrowdown':
        return 'Down'
      case 'arrowleft':
        return 'Left'
      case 'arrowright':
        return 'Right'
      case 'backspace':
        return 'Backspace'
      case 'delete':
        return 'Delete'
      case 'enter':
        return 'Return'
      case 'escape':
        return 'Escape'
      case 'tab':
        return 'Tab'
      default:
        return key.toUpperCase()
    }
  }

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isRecording) return
    
    e.preventDefault()
    e.stopPropagation()

    const keys: string[] = []
    
    // Add modifiers in order
    if (e.ctrlKey || e.metaKey) keys.push('CommandOrControl')
    if (e.altKey) keys.push('Alt')
    if (e.shiftKey) keys.push('Shift')
    
    // Add the main key (not modifier keys)
    if (!['Control', 'Alt', 'Shift', 'Meta', 'OS'].includes(e.key)) {
      const mainKey = normalizeKey(e.key)
      keys.push(mainKey)
      
      // Validate shortcut - must have at least one modifier
      if (keys.length > 1) {
        const shortcut = keys.join('+')
        onChange(shortcut)
        setRecordedKeys(formatShortcut(shortcut))
        setIsRecording(false)
      } else {
        // Show error for shortcuts without modifiers
        setRecordedKeys(['Invalid - needs modifier'])
        setTimeout(() => {
          setRecordedKeys([])
        }, 1000)
      }
    } else {
      // Just show the modifiers while holding them
      setRecordedKeys(keys.map(key => 
        key === 'CommandOrControl' 
          ? (navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl')
          : key
      ))
    }
  }, [isRecording, onChange])

  const startRecording = () => {
    setIsRecording(true)
    setRecordedKeys([])
  }

  const stopRecording = () => {
    setIsRecording(false)
    setRecordedKeys(formatShortcut(value))
  }

  const clearShortcut = () => {
    onChange('')
    setRecordedKeys([])
  }

  useEffect(() => {
    if (isRecording) {
      document.addEventListener('keydown', handleKeyDown, { capture: true })
      return () => {
        document.removeEventListener('keydown', handleKeyDown, { capture: true })
      }
    }
  }, [isRecording, handleKeyDown])

  useEffect(() => {
    if (!isRecording) {
      setRecordedKeys(formatShortcut(value))
    }
  }, [value, isRecording])

  return (
    <div>
      {label && (
        <Text size="sm" fw={500} mb="xs">
          {label}
        </Text>
      )}
      
      <Group gap="xs" mb="xs">
        <Button
          variant={isRecording ? "filled" : "light"}
          color={isRecording ? "red" : "blue"}
          size="sm"
          leftSection={<IconKeyboard size={16} />}
          onClick={isRecording ? stopRecording : startRecording}
          style={{ minWidth: 140 }}
        >
          {isRecording ? 'Press keys...' : 'Record shortcut'}
        </Button>

        {value && (
          <Button
            variant="subtle"
            color="gray"
            size="sm"
            leftSection={<IconX size={16} />}
            onClick={clearShortcut}
          >
            Clear
          </Button>
        )}
      </Group>

      <Group gap="xs" mb="xs">
        {recordedKeys.length > 0 ? (
          recordedKeys.map((key, index) => (
            <React.Fragment key={`${key}-${index}`}>
              <Kbd>{key}</Kbd>
              {index < recordedKeys.length - 1 && <Text size="sm">+</Text>}
            </React.Fragment>
          ))
        ) : (
          <Text size="sm" c="dimmed">
            No shortcut set
          </Text>
        )}
      </Group>

      {description && (
        <Text size="xs" c="dimmed">
          {description}
        </Text>
      )}

      {isRecording && (
        <Text size="xs" c="blue" mt="xs">
          Hold modifier keys (Ctrl, Alt, Shift) and press a letter, number, or function key
        </Text>
      )}
    </div>
  )
}

export default KeyRecorder
