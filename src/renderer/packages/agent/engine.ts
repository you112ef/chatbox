import { v4 as uuidv4 } from 'uuid'
import { AgentState, AgentTask, AgentPlan, AgentMemory, AgentCapability, AgentReasoningChain, AgentWorkflow, AgentCollaboration } from './types'
import { AgentMemoryManager } from './memory'
import { AgentPlanner } from './planner'
import { AgentReasoner } from './reasoner'
import { AgentToolManager } from './tools'
import { AgentWorkflowEngine } from './workflow'
import { AgentCollaborationManager } from './collaboration'

export class AgentEngine {
  private state: AgentState
  private memoryManager: AgentMemoryManager
  private planner: AgentPlanner
  private reasoner: AgentReasoner
  private toolManager: AgentToolManager
  private workflowEngine: AgentWorkflowEngine
  private collaborationManager: AgentCollaborationManager
  private isRunning: boolean = false
  private eventListeners: Map<string, Function[]> = new Map()

  constructor(initialState?: Partial<AgentState>) {
    this.state = {
      id: uuidv4(),
      name: 'Advanced AI Agent',
      description: 'An advanced AI agent with autonomous capabilities',
      status: 'idle',
      capabilities: this.getDefaultCapabilities(),
      memories: [],
      context: {},
      preferences: {},
      performance: {
        tasksCompleted: 0,
        successRate: 0,
        averageTaskDuration: 0,
        learningProgress: 0,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...initialState,
    }

    this.memoryManager = new AgentMemoryManager()
    this.planner = new AgentPlanner(this.memoryManager)
    this.reasoner = new AgentReasoner(this.memoryManager)
    this.toolManager = new AgentToolManager()
    this.workflowEngine = new AgentWorkflowEngine(this)
    this.collaborationManager = new AgentCollaborationManager(this)
  }

  private getDefaultCapabilities(): AgentCapability[] {
    return [
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
    ]
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Agent is already running')
    }

    this.isRunning = true
    this.state.status = 'idle'
    this.emit('started', this.state)

    // Initialize subsystems
    await this.memoryManager.initialize()
    await this.toolManager.initialize()
    await this.workflowEngine.initialize()
    await this.collaborationManager.initialize()

    // Start background processes
    this.startBackgroundProcesses()

    console.log('Agent engine started successfully')
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return
    }

    this.isRunning = false
    this.state.status = 'idle'

    // Stop background processes
    this.stopBackgroundProcesses()

    // Cleanup subsystems
    await this.memoryManager.cleanup()
    await this.toolManager.cleanup()
    await this.workflowEngine.cleanup()
    await this.collaborationManager.cleanup()

    this.emit('stopped', this.state)
    console.log('Agent engine stopped')
  }

  async executeTask(task: AgentTask): Promise<any> {
    if (!this.isRunning) {
      throw new Error('Agent is not running')
    }

    this.state.status = 'acting'
    this.state.currentTask = task
    this.emit('task_started', task)

    try {
      // Update task status
      task.status = 'in_progress'
      task.updatedAt = Date.now()

      // Use reasoning to understand the task
      const reasoningChain = await this.reasoner.analyzeTask(task)
      this.emit('reasoning_completed', reasoningChain)

      // Execute the task using appropriate tools
      const result = await this.executeTaskWithTools(task, reasoningChain)

      // Update task status
      task.status = 'completed'
      task.completedAt = Date.now()
      task.result = result

      // Update performance metrics
      this.updatePerformanceMetrics(task)

      // Store experience in memory
      await this.memoryManager.storeExperience(task, result)

      this.state.status = 'idle'
      this.state.currentTask = undefined
      this.emit('task_completed', task)

      return result
    } catch (error) {
      task.status = 'failed'
      task.error = error instanceof Error ? error.message : 'Unknown error'
      task.updatedAt = Date.now()

      this.state.status = 'error'
      this.emit('task_failed', task, error)

      throw error
    }
  }

  async createPlan(goal: string, description?: string): Promise<AgentPlan> {
    const plan = await this.planner.createPlan(goal, description)
    this.emit('plan_created', plan)
    return plan
  }

  async executePlan(planId: string): Promise<void> {
    const plan = await this.planner.getPlan(planId)
    if (!plan) {
      throw new Error('Plan not found')
    }

    this.state.currentPlan = plan
    this.state.status = 'acting'
    this.emit('plan_started', plan)

    try {
      for (const task of plan.tasks) {
        if (task.status === 'pending') {
          await this.executeTask(task)
        }
      }

      plan.status = 'completed'
      plan.completedAt = Date.now()
      this.state.status = 'idle'
      this.state.currentPlan = undefined
      this.emit('plan_completed', plan)
    } catch (error) {
      plan.status = 'failed'
      this.state.status = 'error'
      this.emit('plan_failed', plan, error)
      throw error
    }
  }

  async learnFromExperience(experience: any): Promise<void> {
    await this.memoryManager.storeExperience(experience)
    this.state.performance.learningProgress += 0.1
    this.emit('learning_updated', this.state.performance)
  }

  async collaborate(participants: string[], goal: string): Promise<AgentCollaboration> {
    const collaboration = await this.collaborationManager.createCollaboration(participants, goal)
    this.emit('collaboration_started', collaboration)
    return collaboration
  }

  private async executeTaskWithTools(task: AgentTask, reasoningChain: AgentReasoningChain): Promise<any> {
    // Determine which tools to use based on task requirements
    const requiredTools = this.analyzeTaskRequirements(task, reasoningChain)
    
    // Execute tools in sequence or parallel as needed
    const results = []
    for (const toolName of requiredTools) {
      const tool = this.toolManager.getTool(toolName)
      if (tool) {
        const result = await tool.execute(task)
        results.push(result)
      }
    }

    return results
  }

  private analyzeTaskRequirements(task: AgentTask, reasoningChain: AgentReasoningChain): string[] {
    const tools: string[] = []
    
    // Analyze task description and reasoning to determine required tools
    const taskText = `${task.title} ${task.description}`.toLowerCase()
    
    if (taskText.includes('file') || taskText.includes('document')) {
      tools.push('file_manager')
    }
    
    if (taskText.includes('web') || taskText.includes('search') || taskText.includes('url')) {
      tools.push('web_search')
    }
    
    if (taskText.includes('code') || taskText.includes('programming') || taskText.includes('script')) {
      tools.push('code_executor')
    }
    
    if (taskText.includes('email') || taskText.includes('message')) {
      tools.push('communication')
    }
    
    // Add reasoning-based tool selection
    for (const step of reasoningChain.steps) {
      if (step.type === 'action' && step.content.includes('tool')) {
        const toolName = this.extractToolNameFromReasoning(step.content)
        if (toolName) {
          tools.push(toolName)
        }
      }
    }

    return [...new Set(tools)] // Remove duplicates
  }

  private extractToolNameFromReasoning(content: string): string | null {
    // Simple extraction logic - can be enhanced
    const toolMatch = content.match(/use\s+(\w+)\s+tool/i)
    return toolMatch ? toolMatch[1] : null
  }

  private updatePerformanceMetrics(task: AgentTask): void {
    this.state.performance.tasksCompleted++
    
    if (task.completedAt && task.createdAt) {
      const duration = task.completedAt - task.createdAt
      this.state.performance.averageTaskDuration = 
        (this.state.performance.averageTaskDuration + duration) / 2
    }
    
    // Update success rate
    const completedTasks = this.state.performance.tasksCompleted
    const successfulTasks = completedTasks - (task.status === 'failed' ? 1 : 0)
    this.state.performance.successRate = successfulTasks / completedTasks
  }

  private startBackgroundProcesses(): void {
    // Start memory consolidation
    setInterval(() => {
      this.memoryManager.consolidateMemories()
    }, 60000) // Every minute

    // Start workflow execution
    setInterval(() => {
      this.workflowEngine.executeScheduledWorkflows()
    }, 30000) // Every 30 seconds

    // Start collaboration monitoring
    setInterval(() => {
      this.collaborationManager.monitorCollaborations()
    }, 10000) // Every 10 seconds
  }

  private stopBackgroundProcesses(): void {
    // Background processes will be stopped when intervals are cleared
  }

  // Event system
  on(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(listener)
  }

  off(event: string, listener: Function): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(listener => listener(data))
    }
  }

  // Getters
  getState(): AgentState {
    return { ...this.state }
  }

  getCapabilities(): AgentCapability[] {
    return [...this.state.capabilities]
  }

  getMemories(): AgentMemory[] {
    return [...this.state.memories]
  }

  isAgentRunning(): boolean {
    return this.isRunning
  }
}