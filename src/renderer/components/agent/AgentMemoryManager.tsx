import React, { useState, useEffect } from 'react'
import { 
  Card, 
  Group, 
  Text, 
  Badge, 
  Button, 
  Stack, 
  TextInput, 
  Textarea, 
  Select, 
  NumberInput, 
  Modal, 
  ActionIcon, 
  Tooltip,
  Progress,
  Tabs,
  Grid,
  Divider,
  Chip,
  MultiSelect
} from '@mantine/core'
import { 
  IconPlus, 
  IconEdit, 
  IconTrash, 
  IconSearch,
  IconBrain,
  IconStar,
  IconClock,
  IconTag,
  IconFilter,
  IconRefresh
} from '@tabler/icons-react'
import { AgentEngine, AgentMemory } from '../../packages/agent'

interface AgentMemoryManagerProps {
  agent: AgentEngine
  onMemoryUpdate?: (memory: AgentMemory) => void
}

export function AgentMemoryManager({ agent, onMemoryUpdate }: AgentMemoryManagerProps) {
  const [memories, setMemories] = useState<AgentMemory[]>([])
  const [filteredMemories, setFilteredMemories] = useState<AgentMemory[]>([])
  const [selectedMemory, setSelectedMemory] = useState<AgentMemory | null>(null)
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false)
  const [isCreatingMemory, setIsCreatingMemory] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string | null>(null)
  const [filterTags, setFilterTags] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<string>('all')

  // Memory form state
  const [memoryForm, setMemoryForm] = useState({
    type: 'fact' as AgentMemory['type'],
    content: '',
    importance: 0.5,
    tags: [] as string[],
  })

  useEffect(() => {
    loadMemories()
  }, [agent])

  useEffect(() => {
    filterMemories()
  }, [memories, searchQuery, filterType, filterTags])

  const loadMemories = async () => {
    try {
      const agentMemories = agent.getMemories()
      setMemories(agentMemories)
    } catch (error) {
      console.error('Failed to load memories:', error)
    }
  }

  const filterMemories = () => {
    let filtered = memories

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(memory => 
        memory.content.toLowerCase().includes(query) ||
        memory.tags?.some(tag => tag.toLowerCase().includes(query))
      )
    }

    // Type filter
    if (filterType) {
      filtered = filtered.filter(memory => memory.type === filterType)
    }

    // Tags filter
    if (filterTags.length > 0) {
      filtered = filtered.filter(memory => 
        memory.tags?.some(tag => filterTags.includes(tag))
      )
    }

    setFilteredMemories(filtered)
  }

  const handleCreateMemory = async () => {
    if (!memoryForm.content.trim()) return

    setIsCreatingMemory(true)
    try {
      const newMemory: AgentMemory = {
        id: `memory-${Date.now()}`,
        type: memoryForm.type,
        content: memoryForm.content,
        importance: memoryForm.importance,
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
        accessCount: 0,
        tags: memoryForm.tags,
      }

      // In a real implementation, this would create the memory through the agent
      setMemories(prev => [newMemory, ...prev])
      setIsMemoryModalOpen(false)
      setMemoryForm({ type: 'fact', content: '', importance: 0.5, tags: [] })
      onMemoryUpdate?.(newMemory)
    } catch (error) {
      console.error('Failed to create memory:', error)
    } finally {
      setIsCreatingMemory(false)
    }
  }

  const handleDeleteMemory = async (memoryId: string) => {
    try {
      setMemories(prev => prev.filter(m => m.id !== memoryId))
    } catch (error) {
      console.error('Failed to delete memory:', error)
    }
  }

  const getTypeColor = (type: AgentMemory['type']) => {
    switch (type) {
      case 'fact': return 'blue'
      case 'experience': return 'green'
      case 'preference': return 'purple'
      case 'skill': return 'orange'
      case 'context': return 'gray'
      default: return 'gray'
    }
  }

  const getTypeIcon = (type: AgentMemory['type']) => {
    switch (type) {
      case 'fact': return <IconBrain size={16} />
      case 'experience': return <IconStar size={16} />
      case 'preference': return <IconTag size={16} />
      case 'skill': return <IconClock size={16} />
      case 'context': return <IconTag size={16} />
      default: return <IconBrain size={16} />
    }
  }

  const getImportanceColor = (importance: number) => {
    if (importance >= 0.8) return 'red'
    if (importance >= 0.6) return 'orange'
    if (importance >= 0.4) return 'yellow'
    return 'gray'
  }

  const getMemoriesByType = (type: AgentMemory['type']) => {
    return filteredMemories.filter(memory => memory.type === type)
  }

  const getAllTags = () => {
    const allTags = new Set<string>()
    memories.forEach(memory => {
      memory.tags?.forEach(tag => allTags.add(tag))
    })
    return Array.from(allTags)
  }

  return (
    <Stack spacing="md">
      {/* Header */}
      <Card>
        <Group position="apart">
          <div>
            <Text size="lg" weight={600}>Memory Management</Text>
            <Text size="sm" color="dimmed">Manage agent memories and knowledge</Text>
          </div>
          <Group>
            <Button
              leftIcon={<IconPlus size={16} />}
              onClick={() => setIsMemoryModalOpen(true)}
            >
              Add Memory
            </Button>
            <Button
              leftIcon={<IconRefresh size={16} />}
              variant="outline"
              onClick={loadMemories}
            >
              Refresh
            </Button>
          </Group>
        </Group>
      </Card>

      {/* Filters */}
      <Card>
        <Stack spacing="md">
          <Group grow>
            <TextInput
              placeholder="Search memories..."
              leftIcon={<IconSearch size={16} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Select
              placeholder="Filter by type"
              data={[
                { value: 'fact', label: 'Facts' },
                { value: 'experience', label: 'Experiences' },
                { value: 'preference', label: 'Preferences' },
                { value: 'skill', label: 'Skills' },
                { value: 'context', label: 'Context' },
              ]}
              value={filterType}
              onChange={setFilterType}
              clearable
            />
            <MultiSelect
              placeholder="Filter by tags"
              data={getAllTags()}
              value={filterTags}
              onChange={setFilterTags}
              clearable
            />
          </Group>
        </Stack>
      </Card>

      {/* Memory Types Tabs */}
      <Tabs value={activeTab} onTabChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="all">All ({filteredMemories.length})</Tabs.Tab>
          <Tabs.Tab value="fact">Facts ({getMemoriesByType('fact').length})</Tabs.Tab>
          <Tabs.Tab value="experience">Experiences ({getMemoriesByType('experience').length})</Tabs.Tab>
          <Tabs.Tab value="preference">Preferences ({getMemoriesByType('preference').length})</Tabs.Tab>
          <Tabs.Tab value="skill">Skills ({getMemoriesByType('skill').length})</Tabs.Tab>
          <Tabs.Tab value="context">Context ({getMemoriesByType('context').length})</Tabs.Tab>
        </Tabs.List>

        {/* All Memories Tab */}
        <Tabs.Panel value="all" pt="md">
          <MemoryList
            memories={filteredMemories}
            onMemoryClick={setSelectedMemory}
            onDeleteMemory={handleDeleteMemory}
            getTypeColor={getTypeColor}
            getTypeIcon={getTypeIcon}
            getImportanceColor={getImportanceColor}
          />
        </Tabs.Panel>

        {/* Individual Type Tabs */}
        {['fact', 'experience', 'preference', 'skill', 'context'].map(type => (
          <Tabs.Panel key={type} value={type} pt="md">
            <MemoryList
              memories={getMemoriesByType(type as AgentMemory['type'])}
              onMemoryClick={setSelectedMemory}
              onDeleteMemory={handleDeleteMemory}
              getTypeColor={getTypeColor}
              getTypeIcon={getTypeIcon}
              getImportanceColor={getImportanceColor}
            />
          </Tabs.Panel>
        ))}
      </Tabs>

      {/* Memory Modal */}
      <Modal
        opened={isMemoryModalOpen}
        onClose={() => setIsMemoryModalOpen(false)}
        title="Add New Memory"
        size="md"
      >
        <Stack spacing="md">
          <Select
            label="Memory Type"
            data={[
              { value: 'fact', label: 'Fact' },
              { value: 'experience', label: 'Experience' },
              { value: 'preference', label: 'Preference' },
              { value: 'skill', label: 'Skill' },
              { value: 'context', label: 'Context' },
            ]}
            value={memoryForm.type}
            onChange={(value) => setMemoryForm(prev => ({ ...prev, type: value as AgentMemory['type'] }))}
            required
          />
          <Textarea
            label="Content"
            placeholder="Enter memory content"
            value={memoryForm.content}
            onChange={(e) => setMemoryForm(prev => ({ ...prev, content: e.target.value }))}
            minRows={4}
            required
          />
          <NumberInput
            label="Importance (0-1)"
            value={memoryForm.importance}
            onChange={(value) => setMemoryForm(prev => ({ ...prev, importance: value || 0.5 }))}
            min={0}
            max={1}
            step={0.1}
            precision={1}
          />
          <MultiSelect
            label="Tags"
            placeholder="Add tags"
            data={getAllTags()}
            value={memoryForm.tags}
            onChange={(value) => setMemoryForm(prev => ({ ...prev, tags: value }))}
            creatable
            searchable
          />
          <Group position="right">
            <Button variant="outline" onClick={() => setIsMemoryModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateMemory}
              loading={isCreatingMemory}
              disabled={!memoryForm.content.trim()}
            >
              Add Memory
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}

interface MemoryListProps {
  memories: AgentMemory[]
  onMemoryClick: (memory: AgentMemory) => void
  onDeleteMemory: (memoryId: string) => void
  getTypeColor: (type: AgentMemory['type']) => string
  getTypeIcon: (type: AgentMemory['type']) => React.ReactNode
  getImportanceColor: (importance: number) => string
}

function MemoryList({ 
  memories, 
  onMemoryClick, 
  onDeleteMemory, 
  getTypeColor, 
  getTypeIcon, 
  getImportanceColor 
}: MemoryListProps) {
  if (memories.length === 0) {
    return (
      <Card>
        <Text size="sm" color="dimmed" ta="center">No memories found</Text>
      </Card>
    )
  }

  return (
    <Stack spacing="sm">
      {memories.map((memory) => (
        <Card
          key={memory.id}
          style={{ cursor: 'pointer' }}
          onClick={() => onMemoryClick(memory)}
        >
          <Group position="apart" align="flex-start">
            <div style={{ flex: 1 }}>
              <Group spacing="xs" mb="xs">
                <Badge
                  size="sm"
                  color={getTypeColor(memory.type)}
                  leftSection={getTypeIcon(memory.type)}
                >
                  {memory.type}
                </Badge>
                <Badge
                  size="sm"
                  color={getImportanceColor(memory.importance)}
                  variant="outline"
                >
                  {Math.round(memory.importance * 100)}%
                </Badge>
                <Badge size="sm" variant="outline">
                  {memory.accessCount} accesses
                </Badge>
              </Group>
              <Text size="sm" mb="xs">{memory.content}</Text>
              <Group spacing="xs">
                {memory.tags?.map((tag) => (
                  <Chip key={tag} size="xs" variant="outline">
                    {tag}
                  </Chip>
                ))}
              </Group>
            </div>
            <ActionIcon
              color="red"
              onClick={(e) => {
                e.stopPropagation()
                onDeleteMemory(memory.id)
              }}
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Group>
        </Card>
      ))}
    </Stack>
  )
}