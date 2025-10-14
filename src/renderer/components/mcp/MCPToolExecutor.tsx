import React, { useState, useEffect } from 'react'
import { 
  Card, 
  Group, 
  Text, 
  Button, 
  Stack, 
  TextInput, 
  Textarea, 
  Select, 
  Badge, 
  Alert, 
  Code, 
  ScrollArea,
  Tabs,
  JsonInput,
  ActionIcon,
  Tooltip,
  Progress,
  Divider,
  Accordion
} from '@mantine/core'
import { 
  IconPlay, 
  IconStop, 
  IconRefresh, 
  IconCode, 
  IconCheck, 
  IconX, 
  IconClock,
  IconInfo,
  IconCopy,
  IconDownload
} from '@tabler/icons-react'
import { MCPServiceManager } from '../../packages/mcp/service-manager'
import { MCPVirtualService, MCPToolExecution } from '../../packages/mcp/enhanced-types'

interface MCPToolExecutorProps {
  serviceManager: MCPServiceManager
  serviceId?: string
  toolName?: string
  onExecutionComplete?: (execution: MCPToolExecution) => void
}

export function MCPToolExecutor({ 
  serviceManager, 
  serviceId, 
  toolName, 
  onExecutionComplete 
}: MCPToolExecutorProps) {
  const [services, setServices] = useState<MCPVirtualService[]>([])
  const [selectedService, setSelectedService] = useState<string>(serviceId || '')
  const [selectedTool, setSelectedTool] = useState<string>(toolName || '')
  const [toolInput, setToolInput] = useState<Record<string, any>>({})
  const [isExecuting, setIsExecuting] = useState(false)
  const [execution, setExecution] = useState<MCPToolExecution | null>(null)
  const [executionHistory, setExecutionHistory] = useState<MCPToolExecution[]>([])
  const [activeTab, setActiveTab] = useState<string>('execute')

  useEffect(() => {
    loadServices()
    loadExecutionHistory()
  }, [])

  useEffect(() => {
    if (selectedService) {
      const service = services.find(s => s.id === selectedService)
      if (service && service.tools.length > 0) {
        setSelectedTool(service.tools[0].name)
        initializeToolInput(service.tools[0])
      }
    }
  }, [selectedService, services])

  const loadServices = () => {
    setServices(serviceManager.getVirtualServices())
  }

  const loadExecutionHistory = () => {
    setExecutionHistory(serviceManager.getToolExecutions().slice(-20).reverse())
  }

  const initializeToolInput = (tool: any) => {
    const input: Record<string, any> = {}
    
    if (tool.inputSchema?.properties) {
      Object.entries(tool.inputSchema.properties).forEach(([key, prop]: [string, any]) => {
        if (prop.default !== undefined) {
          input[key] = prop.default
        } else if (prop.type === 'string') {
          input[key] = ''
        } else if (prop.type === 'number') {
          input[key] = 0
        } else if (prop.type === 'boolean') {
          input[key] = false
        } else if (prop.type === 'array') {
          input[key] = []
        } else if (prop.type === 'object') {
          input[key] = {}
        }
      })
    }
    
    setToolInput(input)
  }

  const handleServiceChange = (serviceId: string) => {
    setSelectedService(serviceId)
    setSelectedTool('')
    setToolInput({})
  }

  const handleToolChange = (toolName: string) => {
    setSelectedTool(toolName)
    const service = services.find(s => s.id === selectedService)
    const tool = service?.tools.find(t => t.name === toolName)
    if (tool) {
      initializeToolInput(tool)
    }
  }

  const handleExecute = async () => {
    if (!selectedService || !selectedTool) return

    setIsExecuting(true)
    setExecution(null)

    try {
      const result = await serviceManager.executeTool(selectedService, selectedTool, toolInput)
      
      // Create execution record
      const newExecution: MCPToolExecution = {
        id: `exec-${Date.now()}`,
        toolName: selectedTool,
        serviceId: selectedService,
        connectionId: '',
        input: toolInput,
        output: result,
        status: 'completed',
        startedAt: Date.now(),
        completedAt: Date.now(),
        duration: 100,
        retryCount: 0,
        metadata: {},
      }

      setExecution(newExecution)
      onExecutionComplete?.(newExecution)
      loadExecutionHistory()
    } catch (error) {
      const failedExecution: MCPToolExecution = {
        id: `exec-${Date.now()}`,
        toolName: selectedTool,
        serviceId: selectedService,
        connectionId: '',
        input: toolInput,
        status: 'failed',
        startedAt: Date.now(),
        completedAt: Date.now(),
        duration: 0,
        retryCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {},
      }

      setExecution(failedExecution)
      loadExecutionHistory()
    } finally {
      setIsExecuting(false)
    }
  }

  const getCurrentTool = () => {
    const service = services.find(s => s.id === selectedService)
    return service?.tools.find(t => t.name === selectedTool)
  }

  const getCurrentService = () => {
    return services.find(s => s.id === selectedService)
  }

  const renderInputField = (key: string, prop: any) => {
    const value = toolInput[key] || ''
    const isRequired = getCurrentTool()?.inputSchema?.required?.includes(key)

    switch (prop.type) {
      case 'string':
        if (prop.enum) {
          return (
            <Select
              key={key}
              label={prop.description || key}
              placeholder={prop.description || key}
              value={value}
              onChange={(val) => setToolInput(prev => ({ ...prev, [key]: val }))}
              data={prop.enum.map((option: string) => ({ value: option, label: option }))}
              required={isRequired}
            />
          )
        }
        return (
          <TextInput
            key={key}
            label={prop.description || key}
            placeholder={prop.description || key}
            value={value}
            onChange={(e) => setToolInput(prev => ({ ...prev, [key]: e.target.value }))}
            required={isRequired}
          />
        )
      
      case 'number':
        return (
          <TextInput
            key={key}
            label={prop.description || key}
            placeholder={prop.description || key}
            value={value}
            onChange={(e) => setToolInput(prev => ({ ...prev, [key]: Number(e.target.value) }))}
            type="number"
            required={isRequired}
          />
        )
      
      case 'boolean':
        return (
          <div key={key}>
            <Text size="sm" weight={500} mb="xs">{prop.description || key}</Text>
            <Button
              variant={value ? 'filled' : 'outline'}
              onClick={() => setToolInput(prev => ({ ...prev, [key]: !value }))}
              size="sm"
            >
              {value ? 'True' : 'False'}
            </Button>
          </div>
        )
      
      case 'object':
        return (
          <div key={key}>
            <Text size="sm" weight={500} mb="xs">{prop.description || key}</Text>
            <JsonInput
              value={JSON.stringify(value, null, 2)}
              onChange={(val) => {
                try {
                  setToolInput(prev => ({ ...prev, [key]: JSON.parse(val) }))
                } catch (e) {
                  // Invalid JSON, keep as string
                }
              }}
              minRows={3}
              maxRows={6}
            />
          </div>
        )
      
      default:
        return (
          <Textarea
            key={key}
            label={prop.description || key}
            placeholder={prop.description || key}
            value={value}
            onChange={(e) => setToolInput(prev => ({ ...prev, [key]: e.target.value }))}
            required={isRequired}
          />
        )
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const downloadResult = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Stack spacing="md">
      {/* Header */}
      <Card>
        <Group position="apart">
          <div>
            <Text size="lg" weight={600}>MCP Tool Executor</Text>
            <Text size="sm" color="dimmed">Execute tools from MCP services</Text>
          </div>
          <Group>
            <Button
              leftIcon={<IconRefresh size={16} />}
              variant="outline"
              onClick={loadServices}
            >
              Refresh
            </Button>
          </Group>
        </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onTabChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="execute" icon={<IconPlay size={16} />}>Execute</Tabs.Tab>
          <Tabs.Tab value="history" icon={<IconClock size={16} />}>History</Tabs.Tab>
        </Tabs.List>

        {/* Execute Tab */}
        <Tabs.Panel value="execute" pt="md">
          <Grid>
            <Grid.Col span={6}>
              <Card>
                <Text size="lg" weight={600} mb="md">Tool Configuration</Text>
                
                <Stack spacing="md">
                  <Select
                    label="Service"
                    placeholder="Select a service"
                    value={selectedService}
                    onChange={handleServiceChange}
                    data={services.map(service => ({
                      value: service.id,
                      label: service.name,
                    }))}
                    required
                  />

                  {selectedService && (
                    <Select
                      label="Tool"
                      placeholder="Select a tool"
                      value={selectedTool}
                      onChange={handleToolChange}
                      data={getCurrentService()?.tools.map(tool => ({
                        value: tool.name,
                        label: tool.name,
                      })) || []}
                      required
                    />
                  )}

                  {getCurrentTool() && (
                    <div>
                      <Text size="sm" weight={500} mb="xs">Tool Description</Text>
                      <Text size="sm" color="dimmed" mb="md">
                        {getCurrentTool()?.description}
                      </Text>

                      <Text size="sm" weight={500} mb="xs">Input Parameters</Text>
                      <Stack spacing="md">
                        {getCurrentTool()?.inputSchema?.properties && 
                          Object.entries(getCurrentTool()?.inputSchema.properties || {}).map(([key, prop]: [string, any]) => 
                            renderInputField(key, prop)
                          )
                        }
                      </Stack>
                    </div>
                  )}

                  <Button
                    leftIcon={<IconPlay size={16} />}
                    onClick={handleExecute}
                    loading={isExecuting}
                    disabled={!selectedService || !selectedTool}
                    fullWidth
                  >
                    Execute Tool
                  </Button>
                </Stack>
              </Card>
            </Grid.Col>

            <Grid.Col span={6}>
              <Card>
                <Text size="lg" weight={600} mb="md">Execution Result</Text>
                
                {isExecuting && (
                  <div>
                    <Progress value={100} animated />
                    <Text size="sm" color="dimmed" mt="xs">Executing tool...</Text>
                  </div>
                )}

                {execution && (
                  <Stack spacing="md">
                    <Group position="apart">
                      <Badge 
                        color={
                          execution.status === 'completed' ? 'green' :
                          execution.status === 'failed' ? 'red' : 'blue'
                        }
                      >
                        {execution.status}
                      </Badge>
                      <Group spacing="xs">
                        <Tooltip label="Copy result">
                          <ActionIcon
                            onClick={() => copyToClipboard(JSON.stringify(execution.output, null, 2))}
                          >
                            <IconCopy size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Download result">
                          <ActionIcon
                            onClick={() => downloadResult(execution.output, `execution-${execution.id}.json`)}
                          >
                            <IconDownload size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Group>

                    {execution.error && (
                      <Alert color="red" icon={<IconX size={16} />}>
                        {execution.error}
                      </Alert>
                    )}

                    {execution.output && (
                      <div>
                        <Text size="sm" weight={500} mb="xs">Output</Text>
                        <ScrollArea h={300}>
                          <Code block>
                            {JSON.stringify(execution.output, null, 2)}
                          </Code>
                        </ScrollArea>
                      </div>
                    )}

                    <Divider />

                    <Stack spacing="xs">
                      <Text size="sm" weight={500}>Execution Details</Text>
                      <Group position="apart">
                        <Text size="xs" color="dimmed">Duration</Text>
                        <Text size="xs">{execution.duration}ms</Text>
                      </Group>
                      <Group position="apart">
                        <Text size="xs" color="dimmed">Started</Text>
                        <Text size="xs">{new Date(execution.startedAt).toLocaleString()}</Text>
                      </Group>
                      {execution.completedAt && (
                        <Group position="apart">
                          <Text size="xs" color="dimmed">Completed</Text>
                          <Text size="xs">{new Date(execution.completedAt).toLocaleString()}</Text>
                        </Group>
                      )}
                    </Stack>
                  </Stack>
                )}

                {!execution && !isExecuting && (
                  <Text size="sm" color="dimmed" ta="center">
                    Select a service and tool to execute
                  </Text>
                )}
              </Card>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        {/* History Tab */}
        <Tabs.Panel value="history" pt="md">
          <Card>
            <Text size="lg" weight={600} mb="md">Execution History</Text>
            
            <ScrollArea h={400}>
              <Stack spacing="sm">
                {executionHistory.length === 0 ? (
                  <Text size="sm" color="dimmed" ta="center">No executions yet</Text>
                ) : (
                  executionHistory.map((exec) => {
                    const service = services.find(s => s.id === exec.serviceId)
                    return (
                      <Card key={exec.id} size="sm">
                        <Group position="apart" mb="xs">
                          <Group>
                            <Text size="sm" weight={500}>{exec.toolName}</Text>
                            <Text size="xs" color="dimmed">{service?.name || 'Unknown Service'}</Text>
                          </Group>
                          <Badge 
                            size="sm"
                            color={
                              exec.status === 'completed' ? 'green' :
                              exec.status === 'failed' ? 'red' : 'blue'
                            }
                          >
                            {exec.status}
                          </Badge>
                        </Group>

                        <Group position="apart">
                          <Text size="xs" color="dimmed">
                            {new Date(exec.startedAt).toLocaleString()}
                          </Text>
                          {exec.duration && (
                            <Text size="xs" color="dimmed">
                              {exec.duration}ms
                            </Text>
                          )}
                        </Group>

                        {exec.error && (
                          <Alert color="red" size="xs" mt="xs">
                            {exec.error}
                          </Alert>
                        )}

                        {exec.output && (
                          <Accordion size="xs" mt="xs">
                            <Accordion.Item value="output">
                              <Accordion.Control>
                                <Text size="xs">View Output</Text>
                              </Accordion.Control>
                              <Accordion.Panel>
                                <ScrollArea h={100}>
                                  <Code block>
                                    {JSON.stringify(exec.output, null, 2)}
                                  </Code>
                                </ScrollArea>
                              </Accordion.Panel>
                            </Accordion.Item>
                          </Accordion>
                        )}
                      </Card>
                    )
                  })
                )}
              </Stack>
            </ScrollArea>
          </Card>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  )
}