import { MCPServiceManager } from './service-manager'
import { MCPAgentIntegration } from './agent-integration'
import { VirtualMCPServiceFactory } from './virtual-services'
import { AgentEngine } from '../agent/engine'

/**
 * MCP Integration Manager
 * Provides a unified interface for MCP functionality
 */
export class MCPIntegrationManager {
  private serviceManager: MCPServiceManager
  private agentIntegration: MCPAgentIntegration | null = null
  private isInitialized: boolean = false

  constructor() {
    this.serviceManager = new MCPServiceManager({
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
  }

  async initialize(agent?: AgentEngine): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      // Initialize service manager
      await this.serviceManager.initialize()
      
      // Create and register virtual services
      await this.registerVirtualServices()
      
      // Initialize agent integration if agent is provided
      if (agent) {
        this.agentIntegration = new MCPAgentIntegration(agent, this.serviceManager)
        await this.agentIntegration.initialize()
      }
      
      this.isInitialized = true
      console.log('MCP Integration Manager initialized successfully')
    } catch (error) {
      console.error('Failed to initialize MCP Integration Manager:', error)
      throw error
    }
  }

  async cleanup(): Promise<void> {
    if (!this.isInitialized) {
      return
    }

    try {
      if (this.agentIntegration) {
        await this.agentIntegration.cleanup()
      }
      
      await this.serviceManager.cleanup()
      
      this.isInitialized = false
      console.log('MCP Integration Manager cleaned up')
    } catch (error) {
      console.error('Failed to cleanup MCP Integration Manager:', error)
    }
  }

  private async registerVirtualServices(): Promise<void> {
    const virtualServices = VirtualMCPServiceFactory.getAllVirtualServices()
    
    for (const serviceConfig of virtualServices) {
      try {
        await this.serviceManager.createVirtualService(serviceConfig)
        console.log(`Virtual service registered: ${serviceConfig.name}`)
      } catch (error) {
        console.error(`Failed to register virtual service ${serviceConfig.name}:`, error)
      }
    }
  }

  // Service Management
  async startService(serviceId: string) {
    return await this.serviceManager.startVirtualService(serviceId)
  }

  async stopService(serviceId: string) {
    return await this.serviceManager.stopVirtualService(serviceId)
  }

  async executeTool(serviceId: string, toolName: string, input: Record<string, any>) {
    return await this.serviceManager.executeTool(serviceId, toolName, input)
  }

  async checkHealth(serviceId: string) {
    return await this.serviceManager.checkServiceHealth(serviceId)
  }

  // Agent Integration
  async createAgentTask(serviceId: string, toolName: string, input: Record<string, any>) {
    if (!this.agentIntegration) {
      throw new Error('Agent integration not initialized')
    }
    return await this.agentIntegration.createMCPTask(serviceId, toolName, input)
  }

  async createAgentPlan(goal: string, services: string[]) {
    if (!this.agentIntegration) {
      throw new Error('Agent integration not initialized')
    }
    return await this.agentIntegration.createMCPPlan(goal, services)
  }

  // Discovery and Management
  async discoverServices() {
    return await this.serviceManager.discoverServices()
  }

  async getAvailableTools(serviceId?: string) {
    if (this.agentIntegration) {
      return await this.agentIntegration.getAvailableTools(serviceId)
    }
    return []
  }

  async monitorServices() {
    if (this.agentIntegration) {
      return await this.agentIntegration.monitorServices()
    }
    return new Map()
  }

  // Getters
  getServiceManager(): MCPServiceManager {
    return this.serviceManager
  }

  getAgentIntegration(): MCPAgentIntegration | null {
    return this.agentIntegration
  }

  isReady(): boolean {
    return this.isInitialized
  }

  getServices() {
    return this.serviceManager.getVirtualServices()
  }

  getConnections() {
    return this.serviceManager.getConnections()
  }

  getMetrics() {
    return this.serviceManager.getMetrics()
  }
}

// Global MCP integration instance
let globalMCPIntegration: MCPIntegrationManager | null = null

export async function initializeMCPIntegration(agent?: AgentEngine): Promise<MCPIntegrationManager> {
  if (!globalMCPIntegration) {
    globalMCPIntegration = new MCPIntegrationManager()
    await globalMCPIntegration.initialize(agent)
  }
  return globalMCPIntegration
}

export function getMCPIntegration(): MCPIntegrationManager | null {
  return globalMCPIntegration
}

export async function cleanupMCPIntegration(): Promise<void> {
  if (globalMCPIntegration) {
    await globalMCPIntegration.cleanup()
    globalMCPIntegration = null
  }
}