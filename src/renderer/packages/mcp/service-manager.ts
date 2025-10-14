import { EventEmitter } from 'events'
import { v4 as uuidv4 } from 'uuid'
import { 
  MCPVirtualService, 
  MCPServiceConnection, 
  MCPServiceRegistry, 
  MCPIntegrationConfig, 
  MCPToolExecution, 
  MCPEvent, 
  MCPMetrics, 
  MCPVirtualServiceConfig,
  MCPHealthCheck,
  MCPLogEntry,
  MCPConfiguration
} from './enhanced-types'
import { mcpController } from './controller'
import { MCPServerConfig, MCPServerStatus } from '../../../shared/types/mcp'

export class MCPServiceManager extends EventEmitter {
  private virtualServices: Map<string, MCPVirtualService> = new Map()
  private connections: Map<string, MCPServiceConnection> = new Map()
  private registries: Map<string, MCPServiceRegistry> = new Map()
  private toolExecutions: Map<string, MCPToolExecution> = new Map()
  private events: MCPEvent[] = []
  private logs: MCPLogEntry[] = []
  private config: MCPIntegrationConfig
  private healthCheckInterval?: NodeJS.Timeout
  private isInitialized: boolean = false

  constructor(config?: Partial<MCPIntegrationConfig>) {
    super()
    this.config = {
      autoConnect: true,
      maxConnections: 10,
      connectionTimeout: 30000,
      retryAttempts: 3,
      healthCheckInterval: 60000,
      logLevel: 'info',
      enableMetrics: true,
      enableCaching: true,
      cacheTimeout: 300000,
      ...config,
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      // Load virtual services
      await this.loadVirtualServices()
      
      // Load registries
      await this.loadRegistries()
      
      // Start health checking
      this.startHealthChecking()
      
      this.isInitialized = true
      this.emit('initialized')
      this.log('info', 'MCP Service Manager initialized')
    } catch (error) {
      this.log('error', 'Failed to initialize MCP Service Manager', { error })
      throw error
    }
  }

  async cleanup(): Promise<void> {
    if (!this.isInitialized) {
      return
    }

    // Stop health checking
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }

    // Disconnect all connections
    for (const connection of this.connections.values()) {
      await this.disconnectService(connection.id)
    }

    this.isInitialized = false
    this.emit('cleanup')
    this.log('info', 'MCP Service Manager cleaned up')
  }

  // Virtual Service Management
  async createVirtualService(config: MCPVirtualServiceConfig): Promise<MCPVirtualService> {
    const service: MCPVirtualService = {
      id: config.id || uuidv4(),
      name: config.name,
      description: config.description,
      version: config.version,
      category: config.category,
      capabilities: this.extractCapabilities(config),
      tools: config.tools,
      resources: config.resources,
      prompts: config.prompts,
      status: 'available',
      configuration: config.configuration,
      metadata: {
        ...config.metadata,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    }

    this.virtualServices.set(service.id, service)
    this.emit('virtual_service_created', service)
    this.log('info', `Virtual service created: ${service.name}`, { serviceId: service.id })

    return service
  }

  async startVirtualService(serviceId: string): Promise<MCPServiceConnection> {
    const service = this.virtualServices.get(serviceId)
    if (!service) {
      throw new Error(`Virtual service not found: ${serviceId}`)
    }

    // Create MCP server config for virtual service
    const serverConfig: MCPServerConfig = {
      id: serviceId,
      name: service.name,
      enabled: true,
      transport: service.configuration.transport || {
        type: 'stdio',
        command: 'node',
        args: ['-e', 'console.log("Virtual MCP Service")'],
      },
    }

    // Start the service through MCP controller
    await mcpController.startServer(serverConfig)
    
    const connection: MCPServiceConnection = {
      id: uuidv4(),
      serviceId,
      config: serverConfig,
      status: { state: 'running' },
      connectedAt: Date.now(),
      lastActivity: Date.now(),
      metrics: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
      },
      health: {
        status: 'healthy',
        lastCheck: Date.now(),
        issues: [],
      },
    }

    this.connections.set(connection.id, connection)
    service.status = 'running'
    
    this.emit('service_connected', connection)
    this.log('info', `Virtual service started: ${service.name}`, { 
      serviceId, 
      connectionId: connection.id 
    })

    return connection
  }

  async stopVirtualService(serviceId: string): Promise<void> {
    const service = this.virtualServices.get(serviceId)
    if (!service) {
      throw new Error(`Virtual service not found: ${serviceId}`)
    }

    // Find and disconnect all connections for this service
    const serviceConnections = Array.from(this.connections.values())
      .filter(conn => conn.serviceId === serviceId)

    for (const connection of serviceConnections) {
      await this.disconnectService(connection.id)
    }

    service.status = 'stopped'
    this.emit('service_stopped', { serviceId })
    this.log('info', `Virtual service stopped: ${service.name}`, { serviceId })
  }

  // Service Discovery and Registry
  async discoverServices(): Promise<MCPVirtualService[]> {
    const discoveredServices: MCPVirtualService[] = []

    // Discover from registries
    for (const registry of this.registries.values()) {
      if (registry.isEnabled) {
        try {
          const services = await this.discoverFromRegistry(registry)
          discoveredServices.push(...services)
        } catch (error) {
          this.log('error', `Failed to discover from registry: ${registry.name}`, { error })
        }
      }
    }

    // Discover local virtual services
    discoveredServices.push(...Array.from(this.virtualServices.values()))

    this.emit('services_discovered', discoveredServices)
    return discoveredServices
  }

  async addRegistry(registry: MCPServiceRegistry): Promise<void> {
    this.registries.set(registry.id, registry)
    this.emit('registry_added', registry)
    this.log('info', `Registry added: ${registry.name}`, { registryId: registry.id })
  }

  async removeRegistry(registryId: string): Promise<void> {
    const registry = this.registries.get(registryId)
    if (registry) {
      this.registries.delete(registryId)
      this.emit('registry_removed', { registryId })
      this.log('info', `Registry removed: ${registry.name}`, { registryId })
    }
  }

  // Tool Execution
  async executeTool(
    serviceId: string, 
    toolName: string, 
    input: Record<string, any>
  ): Promise<any> {
    const service = this.virtualServices.get(serviceId)
    if (!service) {
      throw new Error(`Service not found: ${serviceId}`)
    }

    const tool = service.tools.find(t => t.name === toolName)
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`)
    }

    const execution: MCPToolExecution = {
      id: uuidv4(),
      toolName,
      serviceId,
      connectionId: '', // Will be set when connection is established
      input,
      status: 'pending',
      startedAt: Date.now(),
      retryCount: 0,
      metadata: {},
    }

    this.toolExecutions.set(execution.id, execution)
    this.emit('tool_execution_started', execution)

    try {
      // Find active connection for this service
      const connection = Array.from(this.connections.values())
        .find(conn => conn.serviceId === serviceId && conn.status.state === 'running')

      if (!connection) {
        throw new Error(`No active connection for service: ${serviceId}`)
      }

      execution.connectionId = connection.id
      execution.status = 'running'

      // Execute the tool
      const result = await this.executeVirtualTool(service, tool, input)
      
      execution.status = 'completed'
      execution.completedAt = Date.now()
      execution.duration = execution.completedAt - execution.startedAt
      execution.output = result

      // Update connection metrics
      connection.metrics.totalRequests++
      connection.metrics.successfulRequests++
      connection.metrics.averageResponseTime = 
        (connection.metrics.averageResponseTime + execution.duration) / 2
      connection.lastActivity = Date.now()

      this.emit('tool_execution_completed', execution)
      this.log('info', `Tool executed successfully: ${toolName}`, { 
        executionId: execution.id,
        serviceId,
        duration: execution.duration
      })

      return result
    } catch (error) {
      execution.status = 'failed'
      execution.completedAt = Date.now()
      execution.duration = execution.completedAt - execution.startedAt
      execution.error = error instanceof Error ? error.message : 'Unknown error'

      // Update connection metrics
      const connection = this.connections.get(execution.connectionId)
      if (connection) {
        connection.metrics.totalRequests++
        connection.metrics.failedRequests++
        connection.metrics.lastError = execution.error
      }

      this.emit('tool_execution_failed', execution)
      this.log('error', `Tool execution failed: ${toolName}`, { 
        executionId: execution.id,
        serviceId,
        error: execution.error
      })

      throw error
    }
  }

  // Health Monitoring
  async checkServiceHealth(serviceId: string): Promise<MCPHealthCheck> {
    const service = this.virtualServices.get(serviceId)
    if (!service) {
      throw new Error(`Service not found: ${serviceId}`)
    }

    const connection = Array.from(this.connections.values())
      .find(conn => conn.serviceId === serviceId)

    const startTime = Date.now()
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    const issues: string[] = []

    try {
      // Perform health check
      if (!connection) {
        status = 'unhealthy'
        issues.push('No active connection')
      } else if (connection.status.state !== 'running') {
        status = 'unhealthy'
        issues.push('Connection not running')
      } else {
        // Check if service is responsive
        const responseTime = Date.now() - startTime
        if (responseTime > 5000) {
          status = 'degraded'
          issues.push('Slow response time')
        }
      }

      const healthCheck: MCPHealthCheck = {
        serviceId,
        connectionId: connection?.id || '',
        status,
        responseTime: Date.now() - startTime,
        lastCheck: Date.now(),
        issues,
        details: {
          transport: service.configuration.transport?.type || 'unknown',
          version: service.version,
          capabilities: service.capabilities,
          tools: service.tools.length,
          resources: service.resources.length,
        },
      }

      // Update connection health
      if (connection) {
        connection.health = {
          status,
          lastCheck: healthCheck.lastCheck,
          issues,
        }
      }

      this.emit('health_check_completed', healthCheck)
      return healthCheck
    } catch (error) {
      const healthCheck: MCPHealthCheck = {
        serviceId,
        connectionId: connection?.id || '',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastCheck: Date.now(),
        issues: [error instanceof Error ? error.message : 'Unknown error'],
        details: {
          transport: service.configuration.transport?.type || 'unknown',
          version: service.version,
          capabilities: service.capabilities,
          tools: service.tools.length,
          resources: service.resources.length,
        },
      }

      this.emit('health_check_failed', healthCheck)
      return healthCheck
    }
  }

  // Metrics and Analytics
  getMetrics(): MCPMetrics {
    const totalServices = this.virtualServices.size
    const activeConnections = Array.from(this.connections.values())
      .filter(conn => conn.status.state === 'running').length

    const executions = Array.from(this.toolExecutions.values())
    const totalExecutions = executions.length
    const successfulExecutions = executions.filter(e => e.status === 'completed').length
    const failedExecutions = executions.filter(e => e.status === 'failed').length

    const averageResponseTime = executions
      .filter(e => e.duration)
      .reduce((sum, e) => sum + (e.duration || 0), 0) / 
      executions.filter(e => e.duration).length || 0

    const lastActivity = Math.max(
      ...Array.from(this.connections.values()).map(c => c.lastActivity),
      ...executions.map(e => e.startedAt)
    )

    // Top tools
    const toolStats = new Map<string, { executions: number; successes: number; totalTime: number }>()
    executions.forEach(execution => {
      const stats = toolStats.get(execution.toolName) || { executions: 0, successes: 0, totalTime: 0 }
      stats.executions++
      if (execution.status === 'completed') stats.successes++
      if (execution.duration) stats.totalTime += execution.duration
      toolStats.set(execution.toolName, stats)
    })

    const topTools = Array.from(toolStats.entries())
      .map(([name, stats]) => ({
        name,
        executions: stats.executions,
        successRate: stats.executions > 0 ? stats.successes / stats.executions : 0,
        averageTime: stats.executions > 0 ? stats.totalTime / stats.executions : 0,
      }))
      .sort((a, b) => b.executions - a.executions)
      .slice(0, 10)

    // Top services
    const serviceStats = new Map<string, { connections: number; executions: number; successes: number }>()
    this.connections.forEach(conn => {
      const stats = serviceStats.get(conn.serviceId) || { connections: 0, executions: 0, successes: 0 }
      stats.connections++
      serviceStats.set(conn.serviceId, stats)
    })

    executions.forEach(execution => {
      const stats = serviceStats.get(execution.serviceId) || { connections: 0, executions: 0, successes: 0 }
      stats.executions++
      if (execution.status === 'completed') stats.successes++
      serviceStats.set(execution.serviceId, stats)
    })

    const topServices = Array.from(serviceStats.entries())
      .map(([serviceId, stats]) => {
        const service = this.virtualServices.get(serviceId)
        return {
          id: serviceId,
          name: service?.name || 'Unknown',
          connections: stats.connections,
          executions: stats.executions,
          successRate: stats.executions > 0 ? stats.successes / stats.executions : 0,
        }
      })
      .sort((a, b) => b.executions - a.executions)
      .slice(0, 10)

    return {
      totalServices,
      activeConnections,
      totalToolExecutions: totalExecutions,
      successfulExecutions,
      failedExecutions,
      averageResponseTime,
      uptime: this.isInitialized ? Date.now() - (this.events[0]?.timestamp || Date.now()) : 0,
      lastActivity,
      topTools,
      topServices,
    }
  }

  // Private methods
  private async loadVirtualServices(): Promise<void> {
    // Load built-in virtual services
    const builtinServices = await this.getBuiltinVirtualServices()
    for (const service of builtinServices) {
      this.virtualServices.set(service.id, service)
    }
  }

  private async loadRegistries(): Promise<void> {
    // Load built-in registries
    const builtinRegistries = await this.getBuiltinRegistries()
    for (const registry of builtinRegistries) {
      this.registries.set(registry.id, registry)
    }
  }

  private async getBuiltinVirtualServices(): Promise<MCPVirtualService[]> {
    // Return built-in virtual services
    return [
      {
        id: 'virtual-filesystem',
        name: 'Virtual Filesystem',
        description: 'A virtual filesystem service for testing and development',
        version: '1.0.0',
        category: 'development',
        capabilities: ['file_operations', 'directory_traversal'],
        tools: [
          {
            name: 'read_file',
            description: 'Read a file from the virtual filesystem',
            inputSchema: {
              type: 'object',
              properties: {
                path: { type: 'string', description: 'File path' },
              },
              required: ['path'],
            },
            outputSchema: {
              type: 'object',
              properties: {
                content: { type: 'string' },
                size: { type: 'number' },
              },
            },
            category: 'file',
            examples: [
              {
                name: 'Read text file',
                description: 'Read a text file',
                input: { path: '/example.txt' },
                expectedOutput: { content: 'Hello World', size: 11 },
              },
            ],
            isAsync: false,
          },
          {
            name: 'write_file',
            description: 'Write content to a file in the virtual filesystem',
            inputSchema: {
              type: 'object',
              properties: {
                path: { type: 'string', description: 'File path' },
                content: { type: 'string', description: 'File content' },
              },
              required: ['path', 'content'],
            },
            outputSchema: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                size: { type: 'number' },
              },
            },
            category: 'file',
            examples: [
              {
                name: 'Write text file',
                description: 'Write text to a file',
                input: { path: '/example.txt', content: 'Hello World' },
                expectedOutput: { success: true, size: 11 },
              },
            ],
            isAsync: false,
          },
        ],
        resources: [],
        prompts: [],
        status: 'available',
        configuration: {
          transport: {
            type: 'stdio',
            command: 'node',
            args: ['-e', 'console.log("Virtual Filesystem Service")'],
          },
        },
        metadata: {
          author: 'Chatbox Team',
          tags: ['filesystem', 'virtual', 'development'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      },
      {
        id: 'virtual-database',
        name: 'Virtual Database',
        description: 'A virtual database service for testing and development',
        version: '1.0.0',
        category: 'development',
        capabilities: ['database_operations', 'query_execution'],
        tools: [
          {
            name: 'execute_query',
            description: 'Execute a SQL query on the virtual database',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'SQL query' },
                params: { type: 'array', description: 'Query parameters' },
              },
              required: ['query'],
            },
            outputSchema: {
              type: 'object',
              properties: {
                rows: { type: 'array' },
                rowCount: { type: 'number' },
              },
            },
            category: 'database',
            examples: [
              {
                name: 'Select query',
                description: 'Execute a SELECT query',
                input: { query: 'SELECT * FROM users' },
                expectedOutput: { rows: [], rowCount: 0 },
              },
            ],
            isAsync: false,
          },
        ],
        resources: [],
        prompts: [],
        status: 'available',
        configuration: {
          transport: {
            type: 'stdio',
            command: 'node',
            args: ['-e', 'console.log("Virtual Database Service")'],
          },
        },
        metadata: {
          author: 'Chatbox Team',
          tags: ['database', 'virtual', 'development'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      },
    ]
  }

  private async getBuiltinRegistries(): Promise<MCPServiceRegistry[]> {
    return [
      {
        id: 'official-registry',
        name: 'Official MCP Registry',
        description: 'Official registry of MCP services',
        url: 'https://registry.modelcontextprotocol.io',
        type: 'official',
        services: [],
        lastUpdated: Date.now(),
        isEnabled: true,
      },
      {
        id: 'community-registry',
        name: 'Community MCP Registry',
        description: 'Community-maintained registry of MCP services',
        url: 'https://community.modelcontextprotocol.io',
        type: 'community',
        services: [],
        lastUpdated: Date.now(),
        isEnabled: true,
      },
    ]
  }

  private async discoverFromRegistry(registry: MCPServiceRegistry): Promise<MCPVirtualService[]> {
    // In a real implementation, this would fetch from the registry URL
    return []
  }

  private extractCapabilities(config: MCPVirtualServiceConfig): string[] {
    const capabilities: string[] = []
    
    if (config.tools.some(t => t.category === 'file')) {
      capabilities.push('file_operations')
    }
    if (config.tools.some(t => t.category === 'database')) {
      capabilities.push('database_operations')
    }
    if (config.tools.some(t => t.category === 'web')) {
      capabilities.push('web_operations')
    }
    if (config.tools.some(t => t.category === 'ai')) {
      capabilities.push('ai_operations')
    }

    return capabilities
  }

  private async executeVirtualTool(
    service: MCPVirtualService, 
    tool: any, 
    input: Record<string, any>
  ): Promise<any> {
    // Simulate tool execution based on service type
    switch (service.id) {
      case 'virtual-filesystem':
        return this.executeFilesystemTool(tool, input)
      case 'virtual-database':
        return this.executeDatabaseTool(tool, input)
      default:
        return { success: true, message: 'Tool executed successfully' }
    }
  }

  private async executeFilesystemTool(tool: any, input: Record<string, any>): Promise<any> {
    switch (tool.name) {
      case 'read_file':
        return {
          content: `Virtual content for ${input.path}`,
          size: 100,
        }
      case 'write_file':
        return {
          success: true,
          size: input.content?.length || 0,
        }
      default:
        return { success: true }
    }
  }

  private async executeDatabaseTool(tool: any, input: Record<string, any>): Promise<any> {
    switch (tool.name) {
      case 'execute_query':
        return {
          rows: [],
          rowCount: 0,
        }
      default:
        return { success: true }
    }
  }

  private startHealthChecking(): void {
    this.healthCheckInterval = setInterval(async () => {
      for (const service of this.virtualServices.values()) {
        if (service.status === 'running') {
          try {
            await this.checkServiceHealth(service.id)
          } catch (error) {
            this.log('error', `Health check failed for service: ${service.name}`, { error })
          }
        }
      }
    }, this.config.healthCheckInterval)
  }

  private async disconnectService(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId)
    if (!connection) {
      return
    }

    try {
      await mcpController.stopServer(connection.serviceId)
      this.connections.delete(connectionId)
      this.emit('service_disconnected', { connectionId })
    } catch (error) {
      this.log('error', `Failed to disconnect service: ${connectionId}`, { error })
    }
  }

  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void {
    const logEntry: MCPLogEntry = {
      id: uuidv4(),
      timestamp: Date.now(),
      level,
      serviceId: 'system',
      message,
      data,
    }

    this.logs.push(logEntry)
    
    // Keep only last 1000 logs
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000)
    }

    this.emit('log', logEntry)
  }

  // Getters
  getVirtualServices(): MCPVirtualService[] {
    return Array.from(this.virtualServices.values())
  }

  getConnections(): MCPServiceConnection[] {
    return Array.from(this.connections.values())
  }

  getRegistries(): MCPServiceRegistry[] {
    return Array.from(this.registries.values())
  }

  getToolExecutions(): MCPToolExecution[] {
    return Array.from(this.toolExecutions.values())
  }

  getEvents(): MCPEvent[] {
    return [...this.events]
  }

  getLogs(): MCPLogEntry[] {
    return [...this.logs]
  }

  getConfiguration(): MCPConfiguration {
    return {
      global: this.config,
      services: Array.from(this.connections.values()).map(c => c.config),
      virtualServices: Array.from(this.virtualServices.values()).map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        version: s.version,
        category: s.category,
        transport: s.configuration.transport || { type: 'stdio', command: 'node', args: [] },
        tools: s.tools,
        resources: s.resources,
        prompts: s.prompts,
        configuration: s.configuration,
        metadata: s.metadata,
      })),
      registries: Array.from(this.registries.values()),
      templates: [],
      connections: Array.from(this.connections.values()),
      events: this.events,
      logs: this.logs,
      metrics: this.getMetrics(),
    }
  }
}