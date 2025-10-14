// Export all agent types
export * from './types'

// Export core agent engine
export { AgentEngine } from './engine'

// Export agent subsystems
export { AgentMemoryManager } from './memory'
export { AgentPlanner } from './planner'
export { AgentReasoner } from './reasoner'
export { AgentToolManager } from './tools'
export { AgentWorkflowEngine } from './workflow'
export { AgentCollaborationManager } from './collaboration'

// Export agent factory for easy initialization
export class AgentFactory {
  static async createAgent(config?: {
    name?: string
    description?: string
    capabilities?: any[]
    preferences?: Record<string, any>
  }): Promise<AgentEngine> {
    const agent = new AgentEngine(config)
    await agent.start()
    return agent
  }

  static async createAdvancedAgent(): Promise<AgentEngine> {
    return this.createAgent({
      name: 'Advanced AI Agent',
      description: 'A fully capable AI agent with autonomous reasoning, planning, and tool usage',
      capabilities: [
        {
          name: 'reasoning',
          description: 'Advanced reasoning and problem-solving capabilities',
          category: 'reasoning',
          level: 'expert',
          enabled: true,
        },
        {
          name: 'planning',
          description: 'Strategic planning and task decomposition',
          category: 'planning',
          level: 'expert',
          enabled: true,
        },
        {
          name: 'tool_use',
          description: 'Tool usage and system integration',
          category: 'tool_use',
          level: 'expert',
          enabled: true,
        },
        {
          name: 'memory',
          description: 'Persistent memory and learning',
          category: 'memory',
          level: 'expert',
          enabled: true,
        },
        {
          name: 'communication',
          description: 'Natural language communication',
          category: 'communication',
          level: 'expert',
          enabled: true,
        },
        {
          name: 'learning',
          description: 'Continuous learning and adaptation',
          category: 'learning',
          level: 'expert',
          enabled: true,
        },
      ],
    })
  }
}