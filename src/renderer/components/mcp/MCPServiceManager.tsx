import React, { useState, useEffect } from 'react'
import { 
  Card, 
  Group, 
  Text, 
  Badge, 
  Button, 
  Stack, 
  Tabs, 
  Grid, 
  ActionIcon, 
  Tooltip,
  Progress,
  Alert,
  Modal,
  TextInput,
  Textarea,
  Select,
  Switch,
  NumberInput,
  Divider,
  ScrollArea,
  Timeline,
  Chip,
  Accordion
} from '@mantine/core'
import { 
  IconPlus, 
  IconSettings, 
  IconPlay, 
  IconStop, 
  IconRefresh, 
  IconTrash, 
  IconEye,
  IconCode,
  IconDatabase,
  IconWorld,
  IconBrain,
  IconFiles,
  IconCheck,
  IconX,
  IconAlert,
  IconInfo,
  IconActivity,
  IconChart
} from '@tabler/icons-react'
import { MCPServiceManager } from '../../packages/mcp/service-manager'
import { MCPVirtualService, MCPServiceConnection, MCPToolExecution, MCPHealthCheck } from '../../packages/mcp/enhanced-types'

interface MCPServiceManagerProps {
  serviceManager: MCPServiceManager
  onServiceUpdate?: (service: MCPVirtualService) => void
  onConnectionUpdate?: (connection: MCPServiceConnection) => void
}

export function MCPServiceManagerComponent({ serviceManager, onServiceUpdate, onConnectionUpdate }: MCPServiceManagerProps) {
  const [services, setServices] = useState<MCPVirtualService[]>([])
  const [connections, setConnections] = useState<MCPServiceConnection[]>([])
  const [executions, setExecutions] = useState<MCPToolExecution[]>([])
  const [healthChecks, setHealthChecks] = useState<Map<string, MCPHealthCheck>>(new Map())
  const [activeTab, setActiveTab] = useState<string>('services')
  const [selectedService, setSelectedService] = useState<MCPVirtualService | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    loadData()
    
    // Set up event listeners
    serviceManager.on('virtual_service_created', handleServiceCreated)
    serviceManager.on('service_connected', handleServiceConnected)
    serviceManager.on('service_disconnected', handleServiceDisconnected)
    serviceManager.on('tool_execution_started', handleToolExecutionStarted)
    serviceManager.on('tool_execution_completed', handleToolExecutionCompleted)
    serviceManager.on('tool_execution_failed', handleToolExecutionFailed)
    serviceManager.on('health_check_completed', handleHealthCheckCompleted)

    return () => {
      serviceManager.removeAllListeners()
    }
  }, [serviceManager])

  const loadData = async () => {
    setIsRefreshing(true)
    try {
      setServices(serviceManager.getVirtualServices())
      setConnections(serviceManager.getConnections())
      setExecutions(serviceManager.getToolExecutions())
    } catch (error) {
      console.error('Failed to load MCP data:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleServiceCreated = (service: MCPVirtualService) => {
    setServices(prev => [...prev, service])
  }

  const handleServiceConnected = (connection: MCPServiceConnection) => {
    setConnections(prev => [...prev, connection])
    onConnectionUpdate?.(connection)
  }

  const handleServiceDisconnected = ({ connectionId }: { connectionId: string }) => {
    setConnections(prev => prev.filter(conn => conn.id !== connectionId))
  }

  const handleToolExecutionStarted = (execution: MCPToolExecution) => {
    setExecutions(prev => [...prev, execution])
  }

  const handleToolExecutionCompleted = (execution: MCPToolExecution) => {
    setExecutions(prev => prev.map(e => e.id === execution.id ? execution : e))
  }

  const handleToolExecutionFailed = (execution: MCPToolExecution) => {
    setExecutions(prev => prev.map(e => e.id === execution.id ? execution : e))
  }

  const handleHealthCheckCompleted = (healthCheck: MCPHealthCheck) => {
    setHealthChecks(prev => new Map(prev.set(healthCheck.serviceId, healthCheck)))
  }

  const handleStartService = async (serviceId: string) => {
    try {
      await serviceManager.startVirtualService(serviceId)
      await loadData()
    } catch (error) {
      console.error('Failed to start service:', error)
    }
  }

  const handleStopService = async (serviceId: string) => {
    try {
      await serviceManager.stopVirtualService(serviceId)
      await loadData()
    } catch (error) {
      console.error('Failed to stop service:', error)
    }
  }

  const handleExecuteTool = async (serviceId: string, toolName: string, input: Record<string, any>) => {
    try {
      const result = await serviceManager.executeTool(serviceId, toolName, input)
      console.log('Tool execution result:', result)
    } catch (error) {
      console.error('Tool execution failed:', error)
    }
  }

  const getServiceIcon = (serviceId: string) => {
    switch (serviceId) {
      case 'virtual-filesystem': return <IconFiles size={20} />
      case 'virtual-database': return <IconDatabase size={20} />
      case 'virtual-web': return <IconWorld size={20} />
      case 'virtual-ai': return <IconBrain size={20} />
      default: return <IconCode size={20} />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'green'
      case 'available': return 'blue'
      case 'error': return 'red'
      case 'stopped': return 'gray'
      default: return 'gray'
    }
  }

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'green'
      case 'degraded': return 'yellow'
      case 'unhealthy': return 'red'
      default: return 'gray'
    }
  }

  return (
    <Stack spacing="md">
      {/* Header */}
      <Card>
        <Group position="apart">
          <div>
            <Text size="lg" weight={600}>MCP Service Manager</Text>
            <Text size="sm" color="dimmed">Manage Model Context Protocol services and connections</Text>
          </div>
          <Group>
            <Tooltip label="Refresh">
              <ActionIcon loading={isRefreshing} onClick={loadData}>
                <IconRefresh size={16} />
              </ActionIcon>
            </Tooltip>
            <Button
              leftIcon={<IconPlus size={16} />}
              onClick={() => setIsModalOpen(true)}
            >
              Add Service
            </Button>
          </Group>
        </Group>
      </Card>

      {/* Status Overview */}
      <Grid>
        <Grid.Col span={3}>
          <Card>
            <Group position="apart">
              <div>
                <Text size="sm" color="dimmed">Total Services</Text>
                <Text size="xl" weight={600}>{services.length}</Text>
              </div>
              <IconCode size={24} color="blue" />
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={3}>
          <Card>
            <Group position="apart">
              <div>
                <Text size="sm" color="dimmed">Active Connections</Text>
                <Text size="xl" weight={600}>{connections.length}</Text>
              </div>
              <IconActivity size={24} color="green" />
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={3}>
          <Card>
            <Group position="apart">
              <div>
                <Text size="sm" color="dimmed">Tool Executions</Text>
                <Text size="xl" weight={600}>{executions.length}</Text>
              </div>
              <IconChart size={24} color="orange" />
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={3}>
          <Card>
            <Group position="apart">
              <div>
                <Text size="sm" color="dimmed">Success Rate</Text>
                <Text size="xl" weight={600}>
                  {executions.length > 0 
                    ? Math.round((executions.filter(e => e.status === 'completed').length / executions.length) * 100)
                    : 0}%
                </Text>
              </div>
              <IconCheck size={24} color="green" />
            </Group>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Main Content */}
      <Tabs value={activeTab} onTabChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="services" icon={<IconCode size={16} />}>Services</Tabs.Tab>
          <Tabs.Tab value="connections" icon={<IconActivity size={16} />}>Connections</Tabs.Tab>
          <Tabs.Tab value="executions" icon={<IconChart size={16} />}>Executions</Tabs.Tab>
          <Tabs.Tab value="health" icon={<IconAlert size={16} />}>Health</Tabs.Tab>
        </Tabs.List>

        {/* Services Tab */}
        <Tabs.Panel value="services" pt="md">
          <Grid>
            {services.map((service) => (
              <Grid.Col key={service.id} span={6}>
                <Card>
                  <Group position="apart" mb="md">
                    <Group>
                      {getServiceIcon(service.id)}
                      <div>
                        <Text size="lg" weight={600}>{service.name}</Text>
                        <Text size="sm" color="dimmed">{service.description}</Text>
                      </div>
                    </Group>
                    <Badge color={getStatusColor(service.status)}>
                      {service.status}
                    </Badge>
                  </Group>

                  <Stack spacing="sm" mb="md">
                    <Group position="apart">
                      <Text size="sm" weight={500}>Version</Text>
                      <Text size="sm">{service.version}</Text>
                    </Group>
                    <Group position="apart">
                      <Text size="sm" weight={500}>Category</Text>
                      <Badge size="sm" variant="outline">{service.category}</Badge>
                    </Group>
                    <Group position="apart">
                      <Text size="sm" weight={500}>Tools</Text>
                      <Text size="sm">{service.tools.length}</Text>
                    </Group>
                    <Group position="apart">
                      <Text size="sm" weight={500}>Capabilities</Text>
                      <Group spacing="xs">
                        {service.capabilities.slice(0, 2).map(cap => (
                          <Chip key={cap} size="xs">{cap}</Chip>
                        ))}
                        {service.capabilities.length > 2 && (
                          <Text size="xs" color="dimmed">+{service.capabilities.length - 2}</Text>
                        )}
                      </Group>
                    </Group>
                  </Stack>

                  <Group position="apart">
                    <Group>
                      {service.status === 'available' && (
                        <Button
                          size="sm"
                          leftIcon={<IconPlay size={14} />}
                          onClick={() => handleStartService(service.id)}
                        >
                          Start
                        </Button>
                      )}
                      {service.status === 'running' && (
                        <Button
                          size="sm"
                          color="red"
                          leftIcon={<IconStop size={14} />}
                          onClick={() => handleStopService(service.id)}
                        >
                          Stop
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<IconEye size={14} />}
                        onClick={() => setSelectedService(service)}
                      >
                        Details
                      </Button>
                    </Group>
                    <ActionIcon
                      color="blue"
                      onClick={() => setSelectedService(service)}
                    >
                      <IconSettings size={16} />
                    </ActionIcon>
                  </Group>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        </Tabs.Panel>

        {/* Connections Tab */}
        <Tabs.Panel value="connections" pt="md">
          <Stack spacing="md">
            {connections.length === 0 ? (
              <Card>
                <Text size="sm" color="dimmed" ta="center">No active connections</Text>
              </Card>
            ) : (
              connections.map((connection) => {
                const service = services.find(s => s.id === connection.serviceId)
                return (
                  <Card key={connection.id}>
                    <Group position="apart" mb="md">
                      <Group>
                        {service && getServiceIcon(service.id)}
                        <div>
                          <Text size="lg" weight={600}>{service?.name || 'Unknown Service'}</Text>
                          <Text size="sm" color="dimmed">Connected {new Date(connection.connectedAt).toLocaleString()}</Text>
                        </div>
                      </Group>
                      <Badge color={getStatusColor(connection.status.state)}>
                        {connection.status.state}
                      </Badge>
                    </Group>

                    <Grid>
                      <Grid.Col span={6}>
                        <Stack spacing="xs">
                          <Text size="sm" weight={500}>Metrics</Text>
                          <Group position="apart">
                            <Text size="sm">Total Requests</Text>
                            <Text size="sm">{connection.metrics.totalRequests}</Text>
                          </Group>
                          <Group position="apart">
                            <Text size="sm">Success Rate</Text>
                            <Text size="sm">
                              {connection.metrics.totalRequests > 0 
                                ? Math.round((connection.metrics.successfulRequests / connection.metrics.totalRequests) * 100)
                                : 0}%
                            </Text>
                          </Group>
                          <Group position="apart">
                            <Text size="sm">Avg Response Time</Text>
                            <Text size="sm">{connection.metrics.averageResponseTime.toFixed(0)}ms</Text>
                          </Group>
                        </Stack>
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <Stack spacing="xs">
                          <Text size="sm" weight={500}>Health</Text>
                          <Group position="apart">
                            <Text size="sm">Status</Text>
                            <Badge 
                              size="sm" 
                              color={getHealthStatusColor(connection.health.status)}
                            >
                              {connection.health.status}
                            </Badge>
                          </Group>
                          {connection.health.issues.length > 0 && (
                            <Alert color="yellow" size="sm">
                              {connection.health.issues.join(', ')}
                            </Alert>
                          )}
                        </Stack>
                      </Grid.Col>
                    </Grid>
                  </Card>
                )
              })
            )}
          </Stack>
        </Tabs.Panel>

        {/* Executions Tab */}
        <Tabs.Panel value="executions" pt="md">
          <Stack spacing="md">
            {executions.length === 0 ? (
              <Card>
                <Text size="sm" color="dimmed" ta="center">No tool executions</Text>
              </Card>
            ) : (
              executions.slice(0, 20).map((execution) => {
                const service = services.find(s => s.id === execution.serviceId)
                return (
                  <Card key={execution.id}>
                    <Group position="apart" mb="sm">
                      <Group>
                        <Text size="sm" weight={600}>{execution.toolName}</Text>
                        <Text size="xs" color="dimmed">{service?.name || 'Unknown Service'}</Text>
                      </Group>
                      <Badge 
                        color={
                          execution.status === 'completed' ? 'green' :
                          execution.status === 'failed' ? 'red' :
                          execution.status === 'running' ? 'blue' : 'gray'
                        }
                      >
                        {execution.status}
                      </Badge>
                    </Group>

                    <Group position="apart">
                      <Text size="xs" color="dimmed">
                        Started: {new Date(execution.startedAt).toLocaleString()}
                      </Text>
                      {execution.duration && (
                        <Text size="xs" color="dimmed">
                          Duration: {execution.duration}ms
                        </Text>
                      )}
                    </Group>

                    {execution.error && (
                      <Alert color="red" size="sm" mt="sm">
                        {execution.error}
                      </Alert>
                    )}
                  </Card>
                )
              })
            )}
          </Stack>
        </Tabs.Panel>

        {/* Health Tab */}
        <Tabs.Panel value="health" pt="md">
          <Stack spacing="md">
            {services.map((service) => {
              const healthCheck = healthChecks.get(service.id)
              const connection = connections.find(c => c.serviceId === service.id)
              
              return (
                <Card key={service.id}>
                  <Group position="apart" mb="md">
                    <Group>
                      {getServiceIcon(service.id)}
                      <div>
                        <Text size="lg" weight={600}>{service.name}</Text>
                        <Text size="sm" color="dimmed">{service.description}</Text>
                      </div>
                    </Group>
                    <Badge 
                      color={getHealthStatusColor(healthCheck?.status || 'unknown')}
                    >
                      {healthCheck?.status || 'Unknown'}
                    </Badge>
                  </Group>

                  {healthCheck && (
                    <Grid>
                      <Grid.Col span={6}>
                        <Stack spacing="xs">
                          <Text size="sm" weight={500}>Health Details</Text>
                          <Group position="apart">
                            <Text size="sm">Response Time</Text>
                            <Text size="sm">{healthCheck.responseTime}ms</Text>
                          </Group>
                          <Group position="apart">
                            <Text size="sm">Last Check</Text>
                            <Text size="sm">{new Date(healthCheck.lastCheck).toLocaleString()}</Text>
                          </Group>
                          <Group position="apart">
                            <Text size="sm">Tools Available</Text>
                            <Text size="sm">{healthCheck.details.tools}</Text>
                          </Group>
                        </Stack>
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <Stack spacing="xs">
                          <Text size="sm" weight={500}>Capabilities</Text>
                          <Group spacing="xs">
                            {healthCheck.details.capabilities.map(cap => (
                              <Chip key={cap} size="xs">{cap}</Chip>
                            ))}
                          </Group>
                          {healthCheck.issues.length > 0 && (
                            <Alert color="yellow" size="sm" mt="sm">
                              Issues: {healthCheck.issues.join(', ')}
                            </Alert>
                          )}
                        </Stack>
                      </Grid.Col>
                    </Grid>
                  )}
                </Card>
              )
            })}
          </Stack>
        </Tabs.Panel>
      </Tabs>

      {/* Service Details Modal */}
      <Modal
        opened={!!selectedService}
        onClose={() => setSelectedService(null)}
        title={selectedService?.name}
        size="lg"
      >
        {selectedService && (
          <Stack spacing="md">
            <div>
              <Text size="sm" weight={500} mb="xs">Description</Text>
              <Text size="sm">{selectedService.description}</Text>
            </div>

            <div>
              <Text size="sm" weight={500} mb="xs">Tools</Text>
              <Accordion>
                {selectedService.tools.map((tool, index) => (
                  <Accordion.Item key={index} value={tool.name}>
                    <Accordion.Control>
                      <Group>
                        <Text size="sm" weight={500}>{tool.name}</Text>
                        <Badge size="xs" variant="outline">{tool.category}</Badge>
                      </Group>
                    </Accordion.Control>
                    <Accordion.Panel>
                      <Stack spacing="xs">
                        <Text size="xs">{tool.description}</Text>
                        {tool.examples.length > 0 && (
                          <div>
                            <Text size="xs" weight={500}>Examples:</Text>
                            {tool.examples.map((example, exIndex) => (
                              <Card key={exIndex} size="sm" mt="xs">
                                <Text size="xs" weight={500}>{example.name}</Text>
                                <Text size="xs" color="dimmed">{example.description}</Text>
                              </Card>
                            ))}
                          </div>
                        )}
                      </Stack>
                    </Accordion.Panel>
                  </Accordion.Item>
                ))}
              </Accordion>
            </div>

            <div>
              <Text size="sm" weight={500} mb="xs">Capabilities</Text>
              <Group spacing="xs">
                {selectedService.capabilities.map(cap => (
                  <Chip key={cap} size="sm">{cap}</Chip>
                ))}
              </Group>
            </div>
          </Stack>
        )}
      </Modal>
    </Stack>
  )
}