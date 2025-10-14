import { MCPServerConfig, MCPTransportConfig, MCPServerStatus } from '../../../shared/types/mcp'

export interface MCPVirtualService {
  id: string
  name: string
  description: string
  version: string
  category: 'development' | 'testing' | 'demo' | 'production'
  capabilities: string[]
  tools: MCPVirtualTool[]
  resources: MCPVirtualResource[]
  prompts: MCPVirtualPrompt[]
  status: 'available' | 'running' | 'error' | 'stopped'
  configuration: Record<string, any>
  metadata: {
    author?: string
    homepage?: string
    repository?: string
    license?: string
    tags: string[]
    createdAt: number
    updatedAt: number
  }
}

export interface MCPVirtualTool {
  name: string
  description: string
  inputSchema: Record<string, any>
  outputSchema: Record<string, any>
  category: string
  examples: MCPToolExample[]
  isAsync: boolean
  timeout?: number
  retryPolicy?: {
    maxRetries: number
    backoffMultiplier: number
    maxDelay: number
  }
}

export interface MCPToolExample {
  name: string
  description: string
  input: Record<string, any>
  expectedOutput: Record<string, any>
}

export interface MCPVirtualResource {
  uri: string
  name: string
  description: string
  mimeType: string
  size?: number
  metadata: Record<string, any>
}

export interface MCPVirtualPrompt {
  name: string
  description: string
  arguments: Array<{
    name: string
    description: string
    required: boolean
    type: string
  }>
  template: string
  examples: Array<{
    name: string
    description: string
    arguments: Record<string, any>
    template: string
  }>
}

export interface MCPServiceConnection {
  id: string
  serviceId: string
  config: MCPServerConfig
  status: MCPServerStatus
  connectedAt: number
  lastActivity: number
  metrics: {
    totalRequests: number
    successfulRequests: number
    failedRequests: number
    averageResponseTime: number
    lastError?: string
  }
  health: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    lastCheck: number
    issues: string[]
  }
}

export interface MCPServiceRegistry {
  id: string
  name: string
  description: string
  url: string
  type: 'official' | 'community' | 'custom'
  services: MCPVirtualService[]
  lastUpdated: number
  isEnabled: boolean
}

export interface MCPIntegrationConfig {
  autoConnect: boolean
  maxConnections: number
  connectionTimeout: number
  retryAttempts: number
  healthCheckInterval: number
  logLevel: 'debug' | 'info' | 'warn' | 'error'
  enableMetrics: boolean
  enableCaching: boolean
  cacheTimeout: number
}

export interface MCPToolExecution {
  id: string
  toolName: string
  serviceId: string
  connectionId: string
  input: Record<string, any>
  output?: Record<string, any>
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  startedAt: number
  completedAt?: number
  duration?: number
  error?: string
  retryCount: number
  metadata: Record<string, any>
}

export interface MCPEvent {
  id: string
  type: 'connection' | 'disconnection' | 'tool_execution' | 'error' | 'health_check'
  serviceId: string
  connectionId?: string
  toolName?: string
  message: string
  data: Record<string, any>
  timestamp: number
  severity: 'info' | 'warning' | 'error' | 'critical'
}

export interface MCPMetrics {
  totalServices: number
  activeConnections: number
  totalToolExecutions: number
  successfulExecutions: number
  failedExecutions: number
  averageResponseTime: number
  uptime: number
  lastActivity: number
  topTools: Array<{
    name: string
    executions: number
    successRate: number
    averageTime: number
  }>
  topServices: Array<{
    id: string
    name: string
    connections: number
    executions: number
    successRate: number
  }>
}

export interface MCPVirtualServiceConfig {
  id: string
  name: string
  description: string
  version: string
  category: MCPVirtualService['category']
  transport: MCPTransportConfig
  tools: MCPVirtualTool[]
  resources: MCPVirtualResource[]
  prompts: MCPVirtualPrompt[]
  configuration: Record<string, any>
  metadata: MCPVirtualService['metadata']
}

export interface MCPServiceTemplate {
  id: string
  name: string
  description: string
  category: string
  template: MCPVirtualServiceConfig
  variables: Array<{
    name: string
    description: string
    type: string
    required: boolean
    defaultValue?: any
    validation?: {
      pattern?: string
      min?: number
      max?: number
      options?: string[]
    }
  }>
  examples: Array<{
    name: string
    description: string
    variables: Record<string, any>
  }>
}

export interface MCPDiscoveryResult {
  services: MCPVirtualService[]
  registries: MCPServiceRegistry[]
  templates: MCPServiceTemplate[]
  lastUpdated: number
}

export interface MCPHealthCheck {
  serviceId: string
  connectionId: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  responseTime: number
  lastCheck: number
  issues: string[]
  details: {
    transport: string
    version?: string
    capabilities: string[]
    tools: number
    resources: number
  }
}

export interface MCPLogEntry {
  id: string
  timestamp: number
  level: 'debug' | 'info' | 'warn' | 'error'
  serviceId: string
  connectionId?: string
  toolName?: string
  message: string
  data?: Record<string, any>
  error?: {
    name: string
    message: string
    stack?: string
  }
}

export interface MCPConfiguration {
  global: MCPIntegrationConfig
  services: MCPServerConfig[]
  virtualServices: MCPVirtualServiceConfig[]
  registries: MCPServiceRegistry[]
  templates: MCPServiceTemplate[]
  connections: MCPServiceConnection[]
  events: MCPEvent[]
  logs: MCPLogEntry[]
  metrics: MCPMetrics
}