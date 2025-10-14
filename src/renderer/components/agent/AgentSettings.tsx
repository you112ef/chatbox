import React, { useState, useEffect } from 'react'
import { 
  Card, 
  Group, 
  Text, 
  Switch, 
  Button, 
  Stack, 
  TextInput, 
  NumberInput, 
  Select, 
  Slider, 
  Divider,
  Tabs,
  Grid,
  Badge,
  ActionIcon,
  Tooltip,
  Alert
} from '@mantine/core'
import { 
  IconSettings, 
  IconBrain, 
  IconMemory, 
  IconTools, 
  IconWorkflow, 
  IconUsers,
  IconInfo,
  IconCheck,
  IconX
} from '@tabler/icons-react'
import { AgentIntegration } from '../../packages/agent/integration'

interface AgentSettingsProps {
  agentIntegration: AgentIntegration | null
  onSettingsUpdate?: (settings: any) => void
}

export function AgentSettings({ agentIntegration, onSettingsUpdate }: AgentSettingsProps) {
  const [settings, setSettings] = useState({
    // General Settings
    enabled: true,
    agentName: 'Advanced AI Agent',
    agentDescription: 'An advanced AI agent with autonomous capabilities',
    
    // Capabilities
    capabilities: {
      reasoning: { enabled: true, level: 'expert' },
      planning: { enabled: true, level: 'expert' },
      toolUse: { enabled: true, level: 'expert' },
      memory: { enabled: true, level: 'expert' },
      communication: { enabled: true, level: 'expert' },
      learning: { enabled: true, level: 'expert' },
    },
    
    // Performance Settings
    performance: {
      maxConcurrentTasks: 5,
      memoryConsolidationInterval: 60, // minutes
      learningRate: 0.1,
      reasoningTimeout: 30, // seconds
    },
    
    // Memory Settings
    memory: {
      maxMemories: 10000,
      consolidationThreshold: 0.3,
      importanceThreshold: 0.5,
      autoConsolidation: true,
    },
    
    // Tool Settings
    tools: {
      enableAdvancedTools: true,
      enableFileOperations: true,
      enableWebScraping: true,
      enableCodeAnalysis: true,
      enableSystemIntegration: true,
    },
    
    // Workflow Settings
    workflows: {
      enableAutomation: true,
      maxWorkflows: 50,
      executionTimeout: 300, // seconds
      retryAttempts: 3,
    },
    
    // Collaboration Settings
    collaboration: {
      enableMultiAgent: true,
      maxParticipants: 10,
      communicationTimeout: 60, // seconds
    },
  })

  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = () => {
    // In a real implementation, this would load from persistent storage
    console.log('Loading agent settings...')
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveStatus('idle')
    
    try {
      // In a real implementation, this would save to persistent storage
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate save
      
      setSaveStatus('success')
      onSettingsUpdate?.(settings)
      
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      console.error('Failed to save settings:', error)
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCapabilityToggle = (capability: string, enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      capabilities: {
        ...prev.capabilities,
        [capability]: {
          ...prev.capabilities[capability as keyof typeof prev.capabilities],
          enabled,
        },
      },
    }))
  }

  const handleCapabilityLevelChange = (capability: string, level: string) => {
    setSettings(prev => ({
      ...prev,
      capabilities: {
        ...prev.capabilities,
        [capability]: {
          ...prev.capabilities[capability as keyof typeof prev.capabilities],
          level,
        },
      },
    }))
  }

  const getCapabilityIcon = (capability: string) => {
    switch (capability) {
      case 'reasoning': return <IconBrain size={16} />
      case 'memory': return <IconMemory size={16} />
      case 'toolUse': return <IconTools size={16} />
      case 'workflow': return <IconWorkflow size={16} />
      case 'collaboration': return <IconUsers size={16} />
      default: return <IconSettings size={16} />
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'expert': return 'green'
      case 'advanced': return 'blue'
      case 'intermediate': return 'yellow'
      case 'basic': return 'gray'
      default: return 'gray'
    }
  }

  return (
    <Stack spacing="md">
      {/* Header */}
      <Card>
        <Group position="apart">
          <div>
            <Text size="lg" weight={600}>Agent Settings</Text>
            <Text size="sm" color="dimmed">Configure advanced AI agent capabilities</Text>
          </div>
          <Group>
            {saveStatus === 'success' && (
              <Tooltip label="Settings saved successfully">
                <ActionIcon color="green">
                  <IconCheck size={16} />
                </ActionIcon>
              </Tooltip>
            )}
            {saveStatus === 'error' && (
              <Tooltip label="Failed to save settings">
                <ActionIcon color="red">
                  <IconX size={16} />
                </ActionIcon>
              </Tooltip>
            )}
            <Button
              onClick={handleSave}
              loading={isSaving}
              leftIcon={<IconSettings size={16} />}
            >
              Save Settings
            </Button>
          </Group>
        </Group>
      </Card>

      {/* Status Alert */}
      {!agentIntegration?.isAgentReady() && (
        <Alert icon={<IconInfo size={16} />} color="yellow">
          Agent is not ready. Please ensure the agent integration is properly initialized.
        </Alert>
      )}

      <Tabs defaultValue="general">
        <Tabs.List>
          <Tabs.Tab value="general" icon={<IconSettings size={16} />}>General</Tabs.Tab>
          <Tabs.Tab value="capabilities" icon={<IconBrain size={16} />}>Capabilities</Tabs.Tab>
          <Tabs.Tab value="performance" icon={<IconTools size={16} />}>Performance</Tabs.Tab>
          <Tabs.Tab value="memory" icon={<IconMemory size={16} />}>Memory</Tabs.Tab>
          <Tabs.Tab value="tools" icon={<IconTools size={16} />}>Tools</Tabs.Tab>
          <Tabs.Tab value="workflows" icon={<IconWorkflow size={16} />}>Workflows</Tabs.Tab>
          <Tabs.Tab value="collaboration" icon={<IconUsers size={16} />}>Collaboration</Tabs.Tab>
        </Tabs.List>

        {/* General Settings */}
        <Tabs.Panel value="general" pt="md">
          <Stack spacing="md">
            <Card>
              <Text size="lg" weight={600} mb="md">General Settings</Text>
              <Stack spacing="md">
                <Switch
                  label="Enable Agent"
                  description="Enable or disable the AI agent system"
                  checked={settings.enabled}
                  onChange={(e) => setSettings(prev => ({ ...prev, enabled: e.currentTarget.checked }))}
                />
                <TextInput
                  label="Agent Name"
                  value={settings.agentName}
                  onChange={(e) => setSettings(prev => ({ ...prev, agentName: e.target.value }))}
                />
                <TextInput
                  label="Agent Description"
                  value={settings.agentDescription}
                  onChange={(e) => setSettings(prev => ({ ...prev, agentDescription: e.target.value }))}
                />
              </Stack>
            </Card>
          </Stack>
        </Tabs.Panel>

        {/* Capabilities Settings */}
        <Tabs.Panel value="capabilities" pt="md">
          <Card>
            <Text size="lg" weight={600} mb="md">Agent Capabilities</Text>
            <Stack spacing="md">
              {Object.entries(settings.capabilities).map(([capability, config]) => (
                <div key={capability}>
                  <Group position="apart" mb="xs">
                    <Group>
                      {getCapabilityIcon(capability)}
                      <Text size="sm" weight={600} style={{ textTransform: 'capitalize' }}>
                        {capability.replace(/([A-Z])/g, ' $1').trim()}
                      </Text>
                    </Group>
                    <Group>
                      <Badge color={getLevelColor(config.level)} size="sm">
                        {config.level}
                      </Badge>
                      <Switch
                        checked={config.enabled}
                        onChange={(e) => handleCapabilityToggle(capability, e.currentTarget.checked)}
                      />
                    </Group>
                  </Group>
                  {config.enabled && (
                    <Select
                      data={[
                        { value: 'basic', label: 'Basic' },
                        { value: 'intermediate', label: 'Intermediate' },
                        { value: 'advanced', label: 'Advanced' },
                        { value: 'expert', label: 'Expert' },
                      ]}
                      value={config.level}
                      onChange={(value) => handleCapabilityLevelChange(capability, value || 'basic')}
                      size="sm"
                    />
                  )}
                </div>
              ))}
            </Stack>
          </Card>
        </Tabs.Panel>

        {/* Performance Settings */}
        <Tabs.Panel value="performance" pt="md">
          <Card>
            <Text size="lg" weight={600} mb="md">Performance Settings</Text>
            <Stack spacing="md">
              <div>
                <Text size="sm" weight={600} mb="xs">Max Concurrent Tasks</Text>
                <NumberInput
                  value={settings.performance.maxConcurrentTasks}
                  onChange={(value) => setSettings(prev => ({
                    ...prev,
                    performance: { ...prev.performance, maxConcurrentTasks: value || 5 }
                  }))}
                  min={1}
                  max={20}
                />
              </div>
              <div>
                <Text size="sm" weight={600} mb="xs">Memory Consolidation Interval (minutes)</Text>
                <NumberInput
                  value={settings.performance.memoryConsolidationInterval}
                  onChange={(value) => setSettings(prev => ({
                    ...prev,
                    performance: { ...prev.performance, memoryConsolidationInterval: value || 60 }
                  }))}
                  min={1}
                  max={1440}
                />
              </div>
              <div>
                <Text size="sm" weight={600} mb="xs">Learning Rate</Text>
                <Slider
                  value={settings.performance.learningRate}
                  onChange={(value) => setSettings(prev => ({
                    ...prev,
                    performance: { ...prev.performance, learningRate: value }
                  }))}
                  min={0}
                  max={1}
                  step={0.01}
                  marks={[
                    { value: 0, label: '0' },
                    { value: 0.5, label: '0.5' },
                    { value: 1, label: '1' },
                  ]}
                />
              </div>
              <div>
                <Text size="sm" weight={600} mb="xs">Reasoning Timeout (seconds)</Text>
                <NumberInput
                  value={settings.performance.reasoningTimeout}
                  onChange={(value) => setSettings(prev => ({
                    ...prev,
                    performance: { ...prev.performance, reasoningTimeout: value || 30 }
                  }))}
                  min={5}
                  max={300}
                />
              </div>
            </Stack>
          </Card>
        </Tabs.Panel>

        {/* Memory Settings */}
        <Tabs.Panel value="memory" pt="md">
          <Card>
            <Text size="lg" weight={600} mb="md">Memory Settings</Text>
            <Stack spacing="md">
              <div>
                <Text size="sm" weight={600} mb="xs">Max Memories</Text>
                <NumberInput
                  value={settings.memory.maxMemories}
                  onChange={(value) => setSettings(prev => ({
                    ...prev,
                    memory: { ...prev.memory, maxMemories: value || 10000 }
                  }))}
                  min={100}
                  max={100000}
                />
              </div>
              <div>
                <Text size="sm" weight={600} mb="xs">Consolidation Threshold</Text>
                <Slider
                  value={settings.memory.consolidationThreshold}
                  onChange={(value) => setSettings(prev => ({
                    ...prev,
                    memory: { ...prev.memory, consolidationThreshold: value }
                  }))}
                  min={0}
                  max={1}
                  step={0.01}
                  marks={[
                    { value: 0, label: '0' },
                    { value: 0.5, label: '0.5' },
                    { value: 1, label: '1' },
                  ]}
                />
              </div>
              <div>
                <Text size="sm" weight={600} mb="xs">Importance Threshold</Text>
                <Slider
                  value={settings.memory.importanceThreshold}
                  onChange={(value) => setSettings(prev => ({
                    ...prev,
                    memory: { ...prev.memory, importanceThreshold: value }
                  }))}
                  min={0}
                  max={1}
                  step={0.01}
                  marks={[
                    { value: 0, label: '0' },
                    { value: 0.5, label: '0.5' },
                    { value: 1, label: '1' },
                  ]}
                />
              </div>
              <Switch
                label="Auto Consolidation"
                description="Automatically consolidate memories to prevent overflow"
                checked={settings.memory.autoConsolidation}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  memory: { ...prev.memory, autoConsolidation: e.currentTarget.checked }
                }))}
              />
            </Stack>
          </Card>
        </Tabs.Panel>

        {/* Tools Settings */}
        <Tabs.Panel value="tools" pt="md">
          <Card>
            <Text size="lg" weight={600} mb="md">Tool Settings</Text>
            <Stack spacing="md">
              <Switch
                label="Enable Advanced Tools"
                description="Enable advanced tool capabilities"
                checked={settings.tools.enableAdvancedTools}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  tools: { ...prev.tools, enableAdvancedTools: e.currentTarget.checked }
                }))}
              />
              <Switch
                label="Enable File Operations"
                description="Allow file system operations"
                checked={settings.tools.enableFileOperations}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  tools: { ...prev.tools, enableFileOperations: e.currentTarget.checked }
                }))}
              />
              <Switch
                label="Enable Web Scraping"
                description="Allow web scraping and data extraction"
                checked={settings.tools.enableWebScraping}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  tools: { ...prev.tools, enableWebScraping: e.currentTarget.checked }
                }))}
              />
              <Switch
                label="Enable Code Analysis"
                description="Allow code analysis and processing"
                checked={settings.tools.enableCodeAnalysis}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  tools: { ...prev.tools, enableCodeAnalysis: e.currentTarget.checked }
                }))}
              />
              <Switch
                label="Enable System Integration"
                description="Allow system-level operations"
                checked={settings.tools.enableSystemIntegration}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  tools: { ...prev.tools, enableSystemIntegration: e.currentTarget.checked }
                }))}
              />
            </Stack>
          </Card>
        </Tabs.Panel>

        {/* Workflow Settings */}
        <Tabs.Panel value="workflows" pt="md">
          <Card>
            <Text size="lg" weight={600} mb="md">Workflow Settings</Text>
            <Stack spacing="md">
              <Switch
                label="Enable Automation"
                description="Enable automated workflow execution"
                checked={settings.workflows.enableAutomation}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  workflows: { ...prev.workflows, enableAutomation: e.currentTarget.checked }
                }))}
              />
              <div>
                <Text size="sm" weight={600} mb="xs">Max Workflows</Text>
                <NumberInput
                  value={settings.workflows.maxWorkflows}
                  onChange={(value) => setSettings(prev => ({
                    ...prev,
                    workflows: { ...prev.workflows, maxWorkflows: value || 50 }
                  }))}
                  min={1}
                  max={1000}
                />
              </div>
              <div>
                <Text size="sm" weight={600} mb="xs">Execution Timeout (seconds)</Text>
                <NumberInput
                  value={settings.workflows.executionTimeout}
                  onChange={(value) => setSettings(prev => ({
                    ...prev,
                    workflows: { ...prev.workflows, executionTimeout: value || 300 }
                  }))}
                  min={30}
                  max={3600}
                />
              </div>
              <div>
                <Text size="sm" weight={600} mb="xs">Retry Attempts</Text>
                <NumberInput
                  value={settings.workflows.retryAttempts}
                  onChange={(value) => setSettings(prev => ({
                    ...prev,
                    workflows: { ...prev.workflows, retryAttempts: value || 3 }
                  }))}
                  min={0}
                  max={10}
                />
              </div>
            </Stack>
          </Card>
        </Tabs.Panel>

        {/* Collaboration Settings */}
        <Tabs.Panel value="collaboration" pt="md">
          <Card>
            <Text size="lg" weight={600} mb="md">Collaboration Settings</Text>
            <Stack spacing="md">
              <Switch
                label="Enable Multi-Agent"
                description="Enable multi-agent collaboration"
                checked={settings.collaboration.enableMultiAgent}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  collaboration: { ...prev.collaboration, enableMultiAgent: e.currentTarget.checked }
                }))}
              />
              <div>
                <Text size="sm" weight={600} mb="xs">Max Participants</Text>
                <NumberInput
                  value={settings.collaboration.maxParticipants}
                  onChange={(value) => setSettings(prev => ({
                    ...prev,
                    collaboration: { ...prev.collaboration, maxParticipants: value || 10 }
                  }))}
                  min={2}
                  max={100}
                />
              </div>
              <div>
                <Text size="sm" weight={600} mb="xs">Communication Timeout (seconds)</Text>
                <NumberInput
                  value={settings.collaboration.communicationTimeout}
                  onChange={(value) => setSettings(prev => ({
                    ...prev,
                    collaboration: { ...prev.collaboration, communicationTimeout: value || 60 }
                  }))}
                  min={10}
                  max={600}
                />
              </div>
            </Stack>
          </Card>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  )
}