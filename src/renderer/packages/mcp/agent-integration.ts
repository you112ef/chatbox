import { AgentEngine } from '../agent/engine'
import { MCPServiceManager } from './service-manager'
import { MCPVirtualService, MCPServiceConnection, MCPToolExecution } from './enhanced-types'

export class MCPAgentIntegration {
  private agent: AgentEngine
  private mcpServiceManager: MCPServiceManager
  private isInitialized: boolean = false

  constructor(agent: AgentEngine, mcpServiceManager: MCPServiceManager) {
    this.agent = agent
    this.mcpServiceManager = mcpServiceManager
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      // Register MCP tools with the agent
      await this.registerMCPTools()
      
      // Set up event listeners
      this.setupEventListeners()
      
      this.isInitialized = true
      console.log('MCP Agent Integration initialized')
    } catch (error) {
      console.error('Failed to initialize MCP Agent Integration:', error)
      throw error
    }
  }

  async cleanup(): Promise<void> {
    if (!this.isInitialized) {
      return
    }

    this.isInitialized = false
    console.log('MCP Agent Integration cleaned up')
  }

  private async registerMCPTools(): Promise<void> {
    // Register MCP service management tools
    await this.agent.toolManager.registerTool({
      name: 'mcp_list_services',
      description: 'List all available MCP services',
      parameters: {
        category: { type: 'string', description: 'Filter by service category', required: false },
        status: { type: 'string', description: 'Filter by service status', required: false },
      },
      execute: async (args) => {
        const services = this.mcpServiceManager.getVirtualServices()
        let filteredServices = services

        if (args.category) {
          filteredServices = filteredServices.filter(s => s.category === args.category)
        }

        if (args.status) {
          filteredServices = filteredServices.filter(s => s.status === args.status)
        }

        return {
          services: filteredServices.map(service => ({
            id: service.id,
            name: service.name,
            description: service.description,
            version: service.version,
            category: service.category,
            status: service.status,
            capabilities: service.capabilities,
            toolsCount: service.tools.length,
          })),
          total: filteredServices.length,
        }
      },
      category: 'mcp',
      capabilities: ['service_management', 'discovery'],
    })

    await this.agent.toolManager.registerTool({
      name: 'mcp_start_service',
      description: 'Start an MCP service',
      parameters: {
        serviceId: { type: 'string', description: 'ID of the service to start', required: true },
      },
      execute: async (args) => {
        const connection = await this.mcpServiceManager.startVirtualService(args.serviceId)
        return {
          success: true,
          connectionId: connection.id,
          serviceId: connection.serviceId,
          status: connection.status.state,
          connectedAt: connection.connectedAt,
        }
      },
      category: 'mcp',
      capabilities: ['service_management', 'connection'],
    })

    await this.agent.toolManager.registerTool({
      name: 'mcp_stop_service',
      description: 'Stop an MCP service',
      parameters: {
        serviceId: { type: 'string', description: 'ID of the service to stop', required: true },
      },
      execute: async (args) => {
        await this.mcpServiceManager.stopVirtualService(args.serviceId)
        return {
          success: true,
          serviceId: args.serviceId,
          message: 'Service stopped successfully',
        }
      },
      category: 'mcp',
      capabilities: ['service_management', 'connection'],
    })

    await this.agent.toolManager.registerTool({
      name: 'mcp_execute_tool',
      description: 'Execute a tool from an MCP service',
      parameters: {
        serviceId: { type: 'string', description: 'ID of the service', required: true },
        toolName: { type: 'string', description: 'Name of the tool to execute', required: true },
        input: { type: 'object', description: 'Tool input parameters', required: true },
      },
      execute: async (args) => {
        const result = await this.mcpServiceManager.executeTool(
          args.serviceId,
          args.toolName,
          args.input
        )
        return {
          success: true,
          result,
          serviceId: args.serviceId,
          toolName: args.toolName,
        }
      },
      category: 'mcp',
      capabilities: ['tool_execution', 'service_interaction'],
    })

    await this.agent.toolManager.registerTool({
      name: 'mcp_get_service_tools',
      description: 'Get available tools from an MCP service',
      parameters: {
        serviceId: { type: 'string', description: 'ID of the service', required: true },
      },
      execute: async (args) => {
        const services = this.mcpServiceManager.getVirtualServices()
        const service = services.find(s => s.id === args.serviceId)
        
        if (!service) {
          throw new Error(`Service not found: ${args.serviceId}`)
        }

        return {
          serviceId: service.id,
          serviceName: service.name,
          tools: service.tools.map(tool => ({
            name: tool.name,
            description: tool.description,
            category: tool.category,
            isAsync: tool.isAsync,
            timeout: tool.timeout,
            inputSchema: tool.inputSchema,
            outputSchema: tool.outputSchema,
            examples: tool.examples,
          })),
          totalTools: service.tools.length,
        }
      },
      category: 'mcp',
      capabilities: ['service_discovery', 'tool_discovery'],
    })

    await this.agent.toolManager.registerTool({
      name: 'mcp_check_health',
      description: 'Check health status of an MCP service',
      parameters: {
        serviceId: { type: 'string', description: 'ID of the service to check', required: true },
      },
      execute: async (args) => {
        const healthCheck = await this.mcpServiceManager.checkServiceHealth(args.serviceId)
        return {
          serviceId: healthCheck.serviceId,
          status: healthCheck.status,
          responseTime: healthCheck.responseTime,
          lastCheck: healthCheck.lastCheck,
          issues: healthCheck.issues,
          details: healthCheck.details,
        }
      },
      category: 'mcp',
      capabilities: ['health_monitoring', 'service_diagnostics'],
    })

    await this.agent.toolManager.registerTool({
      name: 'mcp_get_metrics',
      description: 'Get MCP service metrics and statistics',
      parameters: {},
      execute: async () => {
        const metrics = this.mcpServiceManager.getMetrics()
        return {
          totalServices: metrics.totalServices,
          activeConnections: metrics.activeConnections,
          totalToolExecutions: metrics.totalToolExecutions,
          successfulExecutions: metrics.successfulExecutions,
          failedExecutions: metrics.failedExecutions,
          averageResponseTime: metrics.averageResponseTime,
          uptime: metrics.uptime,
          lastActivity: metrics.lastActivity,
          topTools: metrics.topTools,
          topServices: metrics.topServices,
        }
      },
      category: 'mcp',
      capabilities: ['metrics', 'analytics', 'monitoring'],
    })

    // Register dynamic tools for each MCP service
    await this.registerDynamicMCPTools()
  }

  private async registerDynamicMCPTools(): Promise<void> {
    const services = this.mcpServiceManager.getVirtualServices()
    
    for (const service of services) {
      for (const tool of service.tools) {
        const toolName = `mcp_${service.id}_${tool.name}`
        
        await this.agent.toolManager.registerTool({
          name: toolName,
          description: `${tool.description} (from ${service.name})`,
          parameters: tool.inputSchema,
          execute: async (args) => {
            return await this.mcpServiceManager.executeTool(service.id, tool.name, args)
          },
          category: 'mcp',
          capabilities: tool.category ? [tool.category] : ['mcp_tool'],
        })
      }
    }
  }

  private setupEventListeners(): void {
    // Listen to MCP service events and forward to agent
    this.mcpServiceManager.on('virtual_service_created', (service) => {
      console.log(`MCP service created: ${service.name}`)
      // Re-register dynamic tools when new service is created
      this.registerDynamicMCPTools().catch(console.error)
    })

    this.mcpServiceManager.on('service_connected', (connection) => {
      console.log(`MCP service connected: ${connection.serviceId}`)
      // Notify agent about new connection
      this.agent.emit('mcp_service_connected', connection)
    })

    this.mcpServiceManager.on('service_disconnected', ({ connectionId }) => {
      console.log(`MCP service disconnected: ${connectionId}`)
      // Notify agent about disconnection
      this.agent.emit('mcp_service_disconnected', { connectionId })
    })

    this.mcpServiceManager.on('tool_execution_completed', (execution) => {
      console.log(`MCP tool executed: ${execution.toolName}`)
      // Notify agent about tool execution
      this.agent.emit('mcp_tool_executed', execution)
    })

    this.mcpServiceManager.on('tool_execution_failed', (execution) => {
      console.log(`MCP tool failed: ${execution.toolName}`)
      // Notify agent about tool failure
      this.agent.emit('mcp_tool_failed', execution)
    })

    this.mcpServiceManager.on('health_check_completed', (healthCheck) => {
      console.log(`MCP health check completed: ${healthCheck.serviceId}`)
      // Notify agent about health status
      this.agent.emit('mcp_health_checked', healthCheck)
    })
  }

  // Agent task integration methods
  async createMCPTask(serviceId: string, toolName: string, input: Record<string, any>) {
    const service = this.mcpServiceManager.getVirtualServices().find(s => s.id === serviceId)
    if (!service) {
      throw new Error(`Service not found: ${serviceId}`)
    }

    const tool = service.tools.find(t => t.name === toolName)
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`)
    }

    const task = {
      id: `mcp-task-${Date.now()}`,
      title: `Execute ${toolName} from ${service.name}`,
      description: `Execute ${tool.description} using MCP service ${service.name}`,
      status: 'pending' as const,
      priority: 'medium' as const,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metadata: {
        serviceId,
        toolName,
        input,
        type: 'mcp_tool_execution',
      },
    }

    return await this.agent.executeTask(task)
  }

  async createMCPPlan(goal: string, services: string[]) {
    const plan = await this.agent.createPlan(goal, `Execute using MCP services: ${services.join(', ')}`)
    
    // Add MCP-specific tasks to the plan
    for (const serviceId of services) {
      const service = this.mcpServiceManager.getVirtualServices().find(s => s.id === serviceId)
      if (service) {
        // Add a task for each tool in the service
        for (const tool of service.tools) {
          await this.agent.planner.addTaskToPlan(plan.id, {
            title: `Use ${tool.name} from ${service.name}`,
            description: tool.description,
            status: 'pending',
            priority: 'medium',
            metadata: {
              serviceId,
              toolName: tool.name,
              type: 'mcp_tool',
            },
          })
        }
      }
    }

    return plan
  }

  // Service discovery and management
  async discoverAndConnectServices(): Promise<MCPServiceConnection[]> {
    const services = await this.mcpServiceManager.discoverServices()
    const connections: MCPServiceConnection[] = []

    for (const service of services) {
      if (service.status === 'available') {
        try {
          const connection = await this.mcpServiceManager.startVirtualService(service.id)
          connections.push(connection)
        } catch (error) {
          console.error(`Failed to start service ${service.name}:`, error)
        }
      }
    }

    return connections
  }

  async getServiceCapabilities(serviceId: string): Promise<string[]> {
    const service = this.mcpServiceManager.getVirtualServices().find(s => s.id === serviceId)
    return service?.capabilities || []
  }

  async getAvailableTools(serviceId?: string): Promise<Array<{ serviceId: string; toolName: string; description: string }>> {
    const services = serviceId 
      ? this.mcpServiceManager.getVirtualServices().filter(s => s.id === serviceId)
      : this.mcpServiceManager.getVirtualServices()

    const tools: Array<{ serviceId: string; toolName: string; description: string }> = []

    for (const service of services) {
      for (const tool of service.tools) {
        tools.push({
          serviceId: service.id,
          toolName: tool.name,
          description: tool.description,
        })
      }
    }

    return tools
  }

  // Health monitoring
  async monitorServices(): Promise<Map<string, any>> {
    const services = this.mcpServiceManager.getVirtualServices()
    const healthStatus = new Map()

    for (const service of services) {
      if (service.status === 'running') {
        try {
          const healthCheck = await this.mcpServiceManager.checkServiceHealth(service.id)
          healthStatus.set(service.id, healthCheck)
        } catch (error) {
          healthStatus.set(service.id, {
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }
    }

    return healthStatus
  }

  // Getters
  getMCPServiceManager(): MCPServiceManager {
    return this.mcpServiceManager
  }

  getAgent(): AgentEngine {
    return this.agent
  }

  isIntegrationReady(): boolean {
    return this.isInitialized
  }
}