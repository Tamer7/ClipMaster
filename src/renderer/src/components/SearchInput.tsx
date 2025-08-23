import React from 'react'
import { TextInput, ActionIcon } from '@mantine/core'
import { IconSearch, IconX } from '@tabler/icons-react'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const SearchInput: React.FC<SearchInputProps> = ({ value, onChange, placeholder = "Search..." }) => {
  return (
    <TextInput
      id="search-input"
      placeholder={placeholder}
      leftSection={<IconSearch size={16} />}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rightSection={
        value && (
          <ActionIcon 
            variant="subtle" 
            onClick={() => onChange('')}
            aria-label="Clear search"
          >
            <IconX size={16} />
          </ActionIcon>
        )
      }
    />
  )
}

export default SearchInput
