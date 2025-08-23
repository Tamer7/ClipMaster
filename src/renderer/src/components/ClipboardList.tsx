import React from 'react'
import { Stack, Center, Text } from '@mantine/core'
import { ClipboardItem as ClipboardItemType } from '../../../shared/types'
import ClipboardItem from './ClipboardItem'

interface ClipboardListProps {
  items: ClipboardItemType[]
  selectedItem: ClipboardItemType | null
  selectedItems: ClipboardItemType[]
  onSelectItem: (item: ClipboardItemType, event?: React.MouseEvent) => void
  onPasteAndHide: (item: ClipboardItemType) => void
  onDeleteItem: (id: string, event: React.MouseEvent) => void
}

const ClipboardList: React.FC<ClipboardListProps> = ({
  items,
  selectedItem,
  selectedItems,
  onSelectItem,
  onPasteAndHide,
  onDeleteItem
}) => {
  if (items.length === 0) {
    return (
      <Center style={{ height: '100%' }}>
        <Stack align="center" gap="md">
          <Text size="60px">📋</Text>
          <Text size="xl" fw={500}>No clipboard items</Text>
          <Text c="dimmed">Copy something to get started!</Text>
        </Stack>
      </Center>
    )
  }

  return (
    <Stack gap="xs">
      {items.map((item) => (
        <ClipboardItem
          key={item.id}
          item={item}
          isSelected={selectedItem?.id === item.id}
          isMultiSelected={selectedItems.some(i => i.id === item.id)}
          onSelect={onSelectItem}
          onPaste={onPasteAndHide}
          onDelete={onDeleteItem}
        />
      ))}
    </Stack>
  )
}

export default ClipboardList
