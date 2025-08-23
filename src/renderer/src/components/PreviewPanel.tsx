import React from 'react'
import { Card, Stack, Group, Text, Badge, Button, Divider, ActionIcon } from '@mantine/core'
import { IconCopy, IconTrash, IconX } from '@tabler/icons-react'
import { ClipboardItem, ClipboardItemType } from '../../../shared/types'
import { formatDistanceToNow } from 'date-fns'

interface PreviewPanelProps {
  item: ClipboardItem
  onPaste: () => void
  onDelete: () => void
  onClose: () => void
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ item, onPaste, onDelete, onClose }) => {
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder style={{ height: '100%' }}>
      <Stack style={{ height: '100%' }} gap="md">
        <Group justify="space-between">
          <Text fw={600} size="lg">Preview</Text>
          <ActionIcon variant="subtle" onClick={onClose} aria-label="Close preview">
            <IconX size={18} />
          </ActionIcon>
        </Group>

        <Stack gap="xs">
          <Group gap="xs">
            <Text size="sm" fw={500}>Type:</Text>
            <Badge color="blue" variant="light" size="sm">{item.category}</Badge>
          </Group>
          <Group gap="xs">
            <Text size="sm" fw={500}>Size:</Text>
            <Text size="sm" c="dimmed">{formatSize(item.size)}</Text>
          </Group>
          <Group gap="xs">
            <Text size="sm" fw={500}>Created:</Text>
            <Text size="sm" c="dimmed">
              {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
            </Text>
          </Group>
          {item.language && (
            <Group gap="xs">
              <Text size="sm" fw={500}>Language:</Text>
              <Badge color="gray" variant="outline" size="sm">{item.language}</Badge>
            </Group>
          )}
        </Stack>

        <Divider />

        <div style={{ flex: 1, overflow: 'auto' }}>
          {item.type === ClipboardItemType.IMAGE ? (
            <div style={{ textAlign: 'center', padding: '12px' }}>
              <img
                src={item.content}
                alt="Clipboard image"
                style={{
                  maxWidth: '100%',
                  maxHeight: '400px',
                  borderRadius: '4px',
                  objectFit: 'contain',
                  border: '1px solid #e0e0e0'
                }}
              />
            </div>
          ) : (
            <Text
              size="sm"
              style={{
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                padding: '12px',
                background: '#fff',
                border: '1px solid #e0e0e0',
                borderRadius: '4px'
              }}
            >
              {item.content.length > 5000 
                ? item.content.substring(0, 5000) + '\n... (truncated)'
                : item.content
              }
            </Text>
          )}
        </div>

        <Group grow>
          <Button
            leftSection={<IconCopy size={16} />}
            onClick={onPaste}
          >
            Paste
          </Button>
          <Button
            color="red"
            variant="light"
            leftSection={<IconTrash size={16} />}
            onClick={onDelete}
          >
            Delete
          </Button>
        </Group>

        <Text size="xs" c="dimmed">
          Lines: {item.content.split('\n').length} • 
          Characters: {item.content.length} • 
          Words: {item.content.split(/\s+/).filter(w => w.length > 0).length}
        </Text>
      </Stack>
    </Card>
  )
}

export default PreviewPanel
