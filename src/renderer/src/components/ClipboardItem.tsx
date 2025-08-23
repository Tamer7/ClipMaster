import React from 'react'
import { Card, Group, Text, Badge, ActionIcon } from '@mantine/core'
import { IconTrash } from '@tabler/icons-react'
import {
  ClipboardItem as ClipboardItemType,
  ClipboardItemType as ItemType
} from '../../../shared/types'
import { formatDistanceToNow } from 'date-fns'

interface ClipboardItemProps {
  item: ClipboardItemType
  isSelected: boolean
  isMultiSelected: boolean
  onSelect: (item: ClipboardItemType, event?: React.MouseEvent) => void
  onPaste: (item: ClipboardItemType) => void
  onDelete: (id: string, event: React.MouseEvent) => void
}

const ClipboardItem: React.FC<ClipboardItemProps> = ({
  item,
  isSelected,
  isMultiSelected,
  onSelect,
  onPaste,
  onDelete
}) => {
  const getTypeIcon = (type: ItemType): string => {
    switch (type) {
      case ItemType.CODE:
        return '💻'
      case ItemType.URL:
        return '🔗'
      case ItemType.JSON:
        return '📄'
      case ItemType.EMAIL:
        return '📧'
      case ItemType.PATH:
        return '📁'
      case ItemType.COLOR:
        return '🎨'
      case ItemType.XML:
        return '📜'
      case ItemType.IMAGE:
        return '🖼️'
      default:
        return '📝'
    }
  }

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getBorderStyle = (): string => {
    if (isMultiSelected) return '2px solid var(--mantine-color-green-6)' // Green for multi-selected
    if (isSelected) return '2px solid var(--mantine-color-blue-6)' // Blue for single selected
    return '1px solid var(--mantine-color-default-border)' // Default
  }

  return (
    <Card
      shadow="sm"
      padding="xs"
      radius="sm"
      withBorder
      style={{
        cursor: 'pointer',
        transition: 'all 0.2s',
        border: getBorderStyle(),
        transform: 'translateY(0)',
        background: isMultiSelected
          ? 'var(--mantine-color-green-light)'
          : isSelected
            ? 'var(--mantine-color-blue-light)'
            : 'var(--mantine-color-default)'
      }}
      onClick={(e) => onSelect(item, e)}
      onDoubleClick={() => onPaste(item)}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'
      }}
    >
      <Group justify="space-between" mb="xs" wrap="nowrap">
        <Group gap="xs" style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <Text size="lg" style={{ flexShrink: 0 }}>
            {getTypeIcon(item.type)}
          </Text>
          <Badge color="blue" variant="light" size="xs" style={{ flexShrink: 0 }}>
            {item.category}
          </Badge>
          {item.language && (
            <Badge color="gray" variant="outline" size="xs" style={{ flexShrink: 0 }}>
              {item.language}
            </Badge>
          )}
        </Group>
        <Group gap="xs" style={{ flexShrink: 0 }}>
          <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
            {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
          </Text>
          <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
            {formatSize(item.size)}
          </Text>
          <ActionIcon
            color="red"
            variant="subtle"
            size="sm"
            onClick={(e) => onDelete(item.id, e)}
            aria-label="Delete item"
          >
            <IconTrash size={12} />
          </ActionIcon>
        </Group>
      </Group>

      {item.type === ItemType.IMAGE ? (
        <div style={{ textAlign: 'center', padding: '8px' }}>
          <img
            src={item.content}
            alt="Clipboard image"
            style={{
              maxWidth: '100%',
              maxHeight: '80px',
              borderRadius: '4px',
              objectFit: 'contain'
            }}
          />
        </div>
      ) : (
        <Text
          size="sm"
          style={{
            fontFamily: 'monospace',
            background: 'var(--mantine-color-default-hover)',
            padding: '6px 8px',
            borderRadius: '4px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '100%'
          }}
        >
          {item.preview}
        </Text>
      )}
    </Card>
  )
}

export default ClipboardItem
