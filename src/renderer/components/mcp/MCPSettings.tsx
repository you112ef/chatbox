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
  Switch, 
  NumberInput, 
  Tabs,
  Grid,
  Badge,
  ActionIcon,
  Tooltip,
  Alert,
  Divider,
  Accordion,
  JsonInput,
  MultiSelect
} from '@mantine/core'
import { 
  IconSettings, 
  IconPlus, 
  IconTrash, 
  IconEdit, 
  IconCheck, 
  IconX, 
  IconRefresh,
  IconCode,
  IconDatabase,
  IconWorld,
  IconBrain,
  IconFiles,
  IconInfo
} from '@tabler/icons-react'
import { MCPServiceManager } from '../../packages/mcp/service-manager'
import { MCPVirtualService, MCPServiceConnection, MCPIntegrationConfig } from '../../packages/mcp/enhanced-types'

interface MCPSettingsProps {
  serviceManager: MCPServiceManager
  onConfigUpdate?: (config: MCPIntegrationConfig) => void
}

export function MCPSettings({ serviceManager, onConfigUpdate }: MCPSettingsProps) {
  const [config, setConfig] = useState<MCPIntegrationConfig>({
    autoConnect: true,
    maxConnections: 10,
    connectionTimeout: 30000,
    retryAttempts: 3,
    healthCheckInterval: 60000,
    logLevel: 'info',
    enableMetrics: true,
    enableCaching: true,
    cacheTimeout: 300000,
  })
  const [services, setServices] = useState<MCPVirtualService[]>([])
  const [connections, setConnections] = useState<MCPServiceConnection[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [activeTab, setActiveTab] = useState<string>('general')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setServices(serviceManager.getVirtualServices())
    setConnections(serviceManager.getConnections())
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveStatus('idle')
    
    try {
      // In a real implementation, this would save to persistent storage
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate save
      
      setSaveStatus('success')
      onConfigUpdate?.(config)
      
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      console.error('Failed to save MCP settings:', error)
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddService = () => {
    // In a real implementation, this would open a service creation modal
    console.log('Add service clicked')
  }

  const handleEditService = (serviceId: string) => {
    // In a real implementation, this would open a service editing modal
    console.log('Edit service clicked:', serviceId)
  }

  const handleDeleteService = async (serviceId: string) => {
    try {
      await serviceManager.stopVirtualService(serviceId)
      loadData()
    } catch (error) {
      console.error('Failed to delete service:', error)
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

  return (
    <Stack spacing="md">
      {/* Header */}
      <Card>
        <Group position="apart">
          <div>
            <Text size="lg" weight={600}>MCP Settings</Text>
            <Text size="sm" color="dimmed">Configure Model Context Protocol services and connections</Text>
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

      <Tabs value={activeTab} onTabChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="general" icon={<IconSettings size={16} />}>General</Tabs.Tab>
          <Tabs.Tab value="services" icon={<IconCode size={16} />}>Services</Tabs.Tab>
          <Tabs.Tab value="connections" icon={<IconDatabase size={16} />}>Connections</Tabs.Tab>
          <Tabs.Tab value="advanced" icon={<IconInfo size={16} />}>Advanced</Tabs.Tab>
        </Tabs.List>

        {/* General Settings */}
        <Tabs.Panel value="general" pt="md">
          <Grid>
            <Grid.Col span={6}>
              <Card>
                <Text size="lg" weight={600} mb="md">Connection Settings</Text>
                <Stack spacing="md">
                  <Switch
                    label="Auto Connect Services"
                    description="Automatically connect to available services on startup"
                    checked={config.autoConnect}
                    onChange={(e) => setConfig(prev => ({ ...prev, autoConnect: e.currentTarget.checked }))}
                  />
                  
                  <NumberInput
                    label="Max Connections"
                    description="Maximum number of concurrent service connections"
                    value={config.maxConnections}
                    onChange={(value) => setConfig(prev => ({ ...prev, maxConnections: value || 10 }))}
                    min={1}
                    max={50}
                  />
                  
                  <NumberInput
                    label="Connection Timeout (ms)"
                    description="Timeout for establishing connections"
                    value={config.connectionTimeout}
                    onChange={(value) => setConfig(prev => ({ ...prev, connectionTimeout: value || 30000 }))}
                    min={1000}
                    max={120000}
                  />
                  
                  <NumberInput
                    label="Retry Attempts"
                    description="Number of retry attempts for failed connections"
                    value={config.retryAttempts}
                    onChange={(value) => setConfig(prev => ({ ...prev, retryAttempts: value || 3 }))}
                    min={0}
                    max={10}
                  />
                </Stack>
              </Card>
            </Grid.Col>

            <Grid.Col span={6}>
              <Card>
                <Text size="lg" weight={600} mb="md">Monitoring Settings</Text>
                <Stack spacing="md">
                  <NumberInput
                    label="Health Check Interval (ms)"
                    description="Interval for health checks"
                    value={config.healthCheckInterval}
                    onChange={(value) => setConfig(prev => ({ ...prev, healthCheckInterval: value || 60000 }))}
                    min={10000}
                    max={300000}
                  />
                  
                  <Select
                    label="Log Level"
                    description="Minimum log level to display"
                    value={config.logLevel}
                    onChange={(value) => setConfig(prev => ({ ...prev, logLevel: value as any }))}
                    data={[
                      { value: 'debug', label: 'Debug' },
                      { value: 'info', label: 'Info' },
                      { value: 'warn', label: 'Warning' },
                      { value: 'error', label: 'Error' },
                    ]}
                  />
                  
                  <Switch
                    label="Enable Metrics"
                    description="Collect and display performance metrics"
                    checked={config.enableMetrics}
                    onChange={(e) => setConfig(prev => ({ ...prev, enableMetrics: e.currentTarget.checked }))}
                  />
                  
                  <Switch
                    label="Enable Caching"
                    description="Cache responses for better performance"
                    checked={config.enableCaching}
                    onChange={(e) => setConfig(prev => ({ ...prev, enableCaching: e.currentTarget.checked }))}
                  />
                  
                  {config.enableCaching && (
                    <NumberInput
                      label="Cache Timeout (ms)"
                      description="How long to cache responses"
                      value={config.cacheTimeout}
                      onChange={(value) => setConfig(prev => ({ ...prev, cacheTimeout: value || 300000 }))}
                      min={1000}
                      max={3600000}
                    />
                  )}
                </Stack>
              </Card>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        {/* Services Tab */}
        <Tabs.Panel value="services" pt="md">
          <Card>
            <Group position="apart" mb="md">
              <Text size="lg" weight={600}>MCP Services</Text>
              <Button
                leftIcon={<IconPlus size={16} />}
                onClick={handleAddService}
              >
                Add Service
              </Button>
            </Group>

            <Stack spacing="md">
              {services.length === 0 ? (
                <Alert color="blue" icon={<IconInfo size={16} />}>
                  No MCP services configured. Add a service to get started.
                </Alert>
              ) : (
                services.map((service) => (
                  <Card key={service.id} withBorder>
                    <Group position="apart" mb="md">
                      <Group>
                        {getServiceIcon(service.id)}
                        <div>
                          <Text size="lg" weight={600}>{service.name}</Text>
                          <Text size="sm" color="dimmed">{service.description}</Text>
                        </div>
                      </Group>
                      <Group>
                        <Badge color={getStatusColor(service.status)}>
                          {service.status}
                        </Badge>
                        <ActionIcon
                          color="blue"
                          onClick={() => handleEditService(service.id)}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                        <ActionIcon
                          color="red"
                          onClick={() => handleDeleteService(service.id)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    </Group>

                    <Grid>
                      <Grid.Col span={6}>
                        <Stack spacing="xs">
                          <Text size="sm" weight={500}>Service Details</Text>
                          <Group position="apart">
                            <Text size="sm">Version</Text>
                            <Text size="sm">{service.version}</Text>
                          </Group>
                          <Group position="apart">
                            <Text size="sm">Category</Text>
                            <Badge size="sm" variant="outline">{service.category}</Badge>
                          </Group>
                          <Group position="apart">
                            <Text size="sm">Tools</Text>
                            <Text size="sm">{service.tools.length}</Text>
                          </Group>
                        </Stack>
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <Stack spacing="xs">
                          <Text size="sm" weight={500}>Capabilities</Text>
                          <Group spacing="xs">
                            {service.capabilities.slice(0, 3).map(cap => (
                              <Badge key={cap} size="sm" variant="outline">{cap}</Badge>
                            ))}
                            {service.capabilities.length > 3 && (
                              <Text size="xs" color="dimmed">+{service.capabilities.length - 3} more</Text>
                            )}
                          </Group>
                        </Stack>
                      </Grid.Col>
                    </Grid>
                  </Card>
                ))
              )}
            </Stack>
          </Card>
        </Tabs.Panel>

        {/* Connections Tab */}
        <Tabs.Panel value="connections" pt="md">
          <Card>
            <Group position="apart" mb="md">
              <Text size="lg" weight={600}>Active Connections</Text>
              <ActionIcon onClick={loadData}>
                <IconRefresh size={16} />
              </ActionIcon>
            </Group>

            <Stack spacing="md">
              {connections.length === 0 ? (
                <Alert color="yellow" icon={<IconInfo size={16} />}>
                  No active connections. Start a service to create a connection.
                </Alert>
              ) : (
                connections.map((connection) => {
                  const service = services.find(s => s.id === connection.serviceId)
                  return (
                    <Card key={connection.id} withBorder>
                      <Group position="apart" mb="md">
                        <Group>
                          {service && getServiceIcon(service.id)}
                          <div>
                            <Text size="lg" weight={600}>{service?.name || 'Unknown Service'}</Text>
                            <Text size="sm" color="dimmed">
                              Connected {new Date(connection.connectedAt).toLocaleString()}
                            </Text>
                          </div>
                        </Group>
                        <Badge color={getStatusColor(connection.status.state)}>
                          {connection.status.state}
                        </Badge>
                      </Group>

                      <Grid>
                        <Grid.Col span={6}>
                          <Stack spacing="xs">
                            <Text size="sm" weight={500}>Performance</Text>
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
                                color={
                                  connection.health.status === 'healthy' ? 'green' :
                                  connection.health.status === 'degraded' ? 'yellow' : 'red'
                                }
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
          </Card>
        </Tabs.Panel>

        {/* Advanced Tab */}
        <Tabs.Panel value="advanced" pt="md">
          <Card>
            <Text size="lg" weight={600} mb="md">Advanced Configuration</Text>
            
            <Accordion>
              <Accordion.Item value="logging">
                <Accordion.Control>
                  <Text weight={500}>Logging Configuration</Text>
                </Accordion.Control>
                <Accordion.Panel>
                  <Stack spacing="md">
                    <Select
                      label="Log Level"
                      value={config.logLevel}
                      onChange={(value) => setConfig(prev => ({ ...prev, logLevel: value as any }))}
                      data={[
                        { value: 'debug', label: 'Debug - All messages' },
                        { value: 'info', label: 'Info - Informational messages' },
                        { value: 'warn', label: 'Warning - Warning messages' },
                        { value: 'error', label: 'Error - Error messages only' },
                      ]}
                    />
                    <Text size="sm" color="dimmed">
                      Choose the minimum level of log messages to display. Debug level shows all messages, 
                      while Error level shows only critical errors.
                    </Text>
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="performance">
                <Accordion.Control>
                  <Text weight={500}>Performance Settings</Text>
                </Accordion.Control>
                <Accordion.Panel>
                  <Stack spacing="md">
                    <Switch
                      label="Enable Metrics Collection"
                      description="Collect detailed performance metrics"
                      checked={config.enableMetrics}
                      onChange={(e) => setConfig(prev => ({ ...prev, enableMetrics: e.currentTarget.checked }))}
                    />
                    <Switch
                      label="Enable Response Caching"
                      description="Cache tool responses for better performance"
                      checked={config.enableCaching}
                      onChange={(e) => setConfig(prev => ({ ...prev, enableCaching: e.currentTarget.checked }))}
                    />
                    {config.enableCaching && (
                      <NumberInput
                        label="Cache Timeout (milliseconds)"
                        description="How long to keep cached responses"
                        value={config.cacheTimeout}
                        onChange={(value) => setConfig(prev => ({ ...prev, cacheTimeout: value || 300000 }))}
                        min={1000}
                        max={3600000}
                      />
                    )}
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="network">
                <Accordion.Control>
                  <Text weight={500}>Network Settings</Text>
                </Accordion.Control>
                <Accordion.Panel>
                  <Stack spacing="md">
                    <NumberInput
                      label="Connection Timeout (milliseconds)"
                      description="Maximum time to wait for a connection"
                      value={config.connectionTimeout}
                      onChange={(value) => setConfig(prev => ({ ...prev, connectionTimeout: value || 30000 }))}
                      min={1000}
                      max={120000}
                    />
                    <NumberInput
                      label="Max Concurrent Connections"
                      description="Maximum number of simultaneous connections"
                      value={config.maxConnections}
                      onChange={(value) => setConfig(prev => ({ ...prev, maxConnections: value || 10 }))}
                      min={1}
                      max={50}
                    />
                    <NumberInput
                      label="Retry Attempts"
                      description="Number of retry attempts for failed operations"
                      value={config.retryAttempts}
                      onChange={(value) => setConfig(prev => ({ ...prev, retryAttempts: value || 3 }))}
                      min={0}
                      max={10}
                    />
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
          </Card>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  )
}