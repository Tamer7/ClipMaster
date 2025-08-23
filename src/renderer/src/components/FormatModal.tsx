/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
// @ts-nocheck

import React, { useState } from 'react'
import { Modal, Stack, Group, Text, Button, Divider, TextInput, Textarea } from '@mantine/core'
import { ClipboardItem } from '../../../shared/types'

interface FormatModalProps {
  opened: boolean
  onClose: () => void
  selectedItems: ClipboardItem[]
  onPaste: (formattedContent: string) => void
}

const FormatModal: React.FC<FormatModalProps> = ({ opened, onClose, selectedItems, onPaste }) => {
  const [customSeparator, setCustomSeparator] = useState('')

  const formatOptions = [
    {
      name: 'Space Separated',
      description: 'text1 text2 text3',
      separator: ' ',
      icon: '📝'
    },
    {
      name: 'Comma Separated',
      description: 'text1, text2, text3',
      separator: ', ',
      icon: '📋'
    },
    {
      name: 'Newline Separated',
      description: 'text1\ntext2\ntext3',
      separator: '\n',
      icon: '📄'
    },
    {
      name: 'Quoted Comma',
      description: '"text1", "text2", "text3"',
      separator: ', ',
      icon: '💻',
      wrapper: '"'
    },
    {
      name: 'Bullet Points',
      description: '• text1\n• text2\n• text3',
      separator: '\n• ',
      icon: '•',
      prefix: '• '
    },
    {
      name: 'Numbered List',
      description: '1. text1\n2. text2\n3. text3',
      separator: '',
      icon: '🔢',
      custom: true
    }
  ]

  const formatContent = (option: any) => {
    const contents = selectedItems.map((item) => item.content.trim())

    if (option.name === 'Numbered List') {
      return contents.map((content, index) => `${index + 1}. ${content}`).join('\n')
    }

    let formatted = contents

    if (option.wrapper) {
      formatted = contents.map((content) => `${option.wrapper}${content}${option.wrapper}`)
    }

    if (option.prefix) {
      return option.prefix + formatted.join(option.separator)
    }

    return formatted.join(option.separator)
  }

  const formatWithCustomSeparator = () => {
    const contents = selectedItems.map((item) => item.content.trim())
    return contents.join(customSeparator)
  }

  const handlePaste = (formattedContent: string) => {
    onPaste(formattedContent)
    onClose()
  }

  const generatePreview = (option: any) => {
    const sampleItems = selectedItems.slice(0, 3) // Show preview with first 3 items
    if (sampleItems.length === 0) return ''

    const sampleContents = sampleItems.map((item) => {
      const content = item.content.trim()
      return content.length > 20 ? content.substring(0, 20) + '...' : content
    })

    if (option.name === 'Numbered List') {
      return sampleContents.map((content, index) => `${index + 1}. ${content}`).join('\n')
    }

    let formatted = sampleContents

    if (option.wrapper) {
      formatted = sampleContents.map((content) => `${option.wrapper}${content}${option.wrapper}`)
    }

    if (option.prefix) {
      return option.prefix + formatted.join(option.separator)
    }

    return formatted.join(option.separator)
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <Text fw={600} size="lg">
            Paste {selectedItems.length} items
          </Text>
        </Group>
      }
      size="lg"
      centered
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Choose how you want to format and paste the selected items:
        </Text>

        <Stack gap="xs">
          {formatOptions.map((option, index) => (
            <Button
              key={index}
              variant="light"
              justify="flex-start"
              leftSection={<Text size="lg">{option.icon}</Text>}
              onClick={() => handlePaste(formatContent(option))}
              style={{ height: 'auto', padding: '12px' }}
            >
              <div style={{ textAlign: 'left', width: '100%' }}>
                <Group justify="space-between" style={{ width: '100%' }}>
                  <div>
                    <Text fw={500}>{option.name}</Text>
                    <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace' }}>
                      {generatePreview(option)}
                    </Text>
                  </div>
                </Group>
              </div>
            </Button>
          ))}
        </Stack>

        <Divider label="Custom Separator" />

        <Group>
          <TextInput
            placeholder="Enter custom separator (e.g., ' | ', ' -> ')"
            value={customSeparator}
            onChange={(e) => setCustomSeparator(e.target.value)}
            style={{ flex: 1 }}
          />
          <Button
            onClick={() => handlePaste(formatWithCustomSeparator())}
            disabled={!customSeparator.trim()}
          >
            Use Custom
          </Button>
        </Group>

        {customSeparator && (
          <Textarea
            label="Preview:"
            value={selectedItems
              .slice(0, 3)
              .map((item) => item.content.trim())
              .join(customSeparator)}
            readOnly
            autosize
            minRows={2}
            maxRows={4}
            style={{ fontFamily: 'monospace', fontSize: '12px' }}
          />
        )}
      </Stack>
    </Modal>
  )
}

export default FormatModal
