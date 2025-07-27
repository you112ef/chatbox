import { Badge, Button, Flex, Stack, Text, TextInput, Tooltip } from '@mantine/core'
import { IconBulb, IconCircleMinus, IconEye, IconSearch, IconSettings, IconTool } from '@tabler/icons-react'
import { capitalize } from 'lodash'
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { ProviderModelInfo } from 'src/shared/types'

interface ModelListProps {
  models: ProviderModelInfo[]
  showActions?: boolean
  onEditModel?: (model: ProviderModelInfo) => void
  onDeleteModel?: (modelId: string) => void
  className?: string
}

export function ModelList({ models, showActions = true, onEditModel, onDeleteModel, className }: ModelListProps) {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredModels = useMemo(() => {
    if (!searchQuery.trim()) return models

    const query = searchQuery.toLowerCase()
    return models.filter((model) => {
      const displayName = (model.nickname || model.modelId).toLowerCase()
      return displayName.includes(query)
    })
  }, [models, searchQuery])

  return (
    <Stack gap="sm" className={className}>
      {models.length > 0 && (
        <TextInput
          placeholder={t('Search models...') as string}
          leftSection={<IconSearch size={16} />}
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.currentTarget.value)}
          className="px-xxs pt-xxs"
        />
      )}

      <Stack
        gap={0}
        px="xxs"
        className={`border-solid border rounded-sm min-h-[100px] border-[var(--mantine-color-chatbox-border-primary-outline)]`}
      >
        {filteredModels.length > 0 ? (
          filteredModels.map((model) => (
            <Flex
              key={model.modelId}
              gap="xs"
              align="center"
              py="sm"
              px="xs"
              className="border-solid border-0 border-b last:border-b-0 border-[var(--mantine-color-chatbox-border-primary-outline)]"
            >
              <Text component="span" size="sm" flex="0 1 auto">
                {model.nickname || model.modelId}
              </Text>

              <Flex flex="0 0 auto" gap="xs" align="center">
                {model.type && model.type !== 'chat' && (
                  <Badge color="blue">{t(capitalize(model.type)) as string}</Badge>
                )}
                {model.capabilities?.includes('reasoning') && (
                  <Tooltip label={t('Reasoning') as string} events={{ hover: true, focus: true, touch: true }}>
                    <Text span c="chatbox-warning" className="flex items-center">
                      <IconBulb size={20} />
                    </Text>
                  </Tooltip>
                )}
                {model.capabilities?.includes('vision') && (
                  <Tooltip label={t('Vision') as string} events={{ hover: true, focus: true, touch: true }}>
                    <Text span c="chatbox-brand" className="flex items-center">
                      <IconEye size={20} />
                    </Text>
                  </Tooltip>
                )}
                {model.capabilities?.includes('tool_use') && (
                  <Tooltip label={t('Tool Use') as string} events={{ hover: true, focus: true, touch: true }}>
                    <Text span c="chatbox-success" className="flex items-center">
                      <IconTool size={20} />
                    </Text>
                  </Tooltip>
                )}
              </Flex>

              {showActions && (
                <Flex flex="0 0 auto" gap="xs" align="center" className="ml-auto">
                  <Button
                    variant="transparent"
                    c="chatbox-tertiary"
                    p={0}
                    h="auto"
                    size="xs"
                    bd={0}
                    onClick={() => onEditModel?.(model)}
                  >
                    <IconSettings size={20} />
                  </Button>

                  <Button
                    variant="transparent"
                    c="chatbox-error"
                    p={0}
                    h="auto"
                    size="compact-xs"
                    bd={0}
                    onClick={() => onDeleteModel?.(model.modelId)}
                  >
                    <IconCircleMinus size={20} />
                  </Button>
                </Flex>
              )}
            </Flex>
          ))
        ) : (
          <Flex align="center" justify="center" py="lg" px="xs">
            <Text component="span" size="sm" c="chatbox-tertiary">
              {searchQuery.trim() ? t('No models found matching your search') : t('No models available')}
            </Text>
          </Flex>
        )}
      </Stack>
    </Stack>
  )
}
