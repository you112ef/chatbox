import { v4 as uuidv4 } from 'uuid'
import { AgentWorkflow, AgentWorkflowStep, AgentWorkflowTrigger, AgentEngine } from './types'

export class AgentWorkflowEngine {
  private workflows: Map<string, AgentWorkflow> = new Map()
  private runningWorkflows: Set<string> = new Set()
  private agentEngine: AgentEngine
  private isInitialized: boolean = false

  constructor(agentEngine: AgentEngine) {
    this.agentEngine = agentEngine
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    // Load existing workflows
    await this.loadWorkflows()
    
    // Register built-in workflows
    await this.registerBuiltInWorkflows()
    
    this.isInitialized = true
    console.log('Workflow engine initialized')
  }

  async cleanup(): Promise<void> {
    // Stop all running workflows
    this.runningWorkflows.forEach(workflowId => {
      this.stopWorkflow(workflowId)
    })
    
    this.workflows.clear()
    this.isInitialized = false
  }

  async createWorkflow(workflow: Omit<AgentWorkflow, 'id' | 'createdAt' | 'updatedAt' | 'executionCount' | 'successRate'>): Promise<AgentWorkflow> {
    const newWorkflow: AgentWorkflow = {
      id: uuidv4(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      executionCount: 0,
      successRate: 0,
      ...workflow,
    }

    this.workflows.set(newWorkflow.id, newWorkflow)
    await this.saveWorkflows()
    
    console.log(`Created workflow: ${newWorkflow.name}`)
    return newWorkflow
  }

  async updateWorkflow(workflowId: string, updates: Partial<AgentWorkflow>): Promise<AgentWorkflow | null> {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) {
      return null
    }

    const updatedWorkflow = {
      ...workflow,
      ...updates,
      updatedAt: Date.now(),
    }

    this.workflows.set(workflowId, updatedWorkflow)
    await this.saveWorkflows()
    
    return updatedWorkflow
  }

  async deleteWorkflow(workflowId: string): Promise<boolean> {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) {
      return false
    }

    // Stop workflow if it's running
    if (this.runningWorkflows.has(workflowId)) {
      this.stopWorkflow(workflowId)
    }

    this.workflows.delete(workflowId)
    await this.saveWorkflows()
    
    console.log(`Deleted workflow: ${workflow.name}`)
    return true
  }

  async executeWorkflow(workflowId: string, context?: any): Promise<any> {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`)
    }

    if (workflow.status !== 'active') {
      throw new Error(`Workflow is not active: ${workflowId}`)
    }

    this.runningWorkflows.add(workflowId)
    workflow.executionCount++
    workflow.lastExecutedAt = Date.now()

    try {
      const result = await this.executeWorkflowSteps(workflow, context || {})
      
      // Update success rate
      const successCount = Math.floor(workflow.executionCount * workflow.successRate)
      workflow.successRate = (successCount + 1) / workflow.executionCount
      
      await this.saveWorkflows()
      console.log(`Workflow executed successfully: ${workflow.name}`)
      
      return result
    } catch (error) {
      // Update success rate
      const successCount = Math.floor(workflow.executionCount * workflow.successRate)
      workflow.successRate = successCount / workflow.executionCount
      
      await this.saveWorkflows()
      console.error(`Workflow execution failed: ${workflow.name}`, error)
      
      throw error
    } finally {
      this.runningWorkflows.delete(workflowId)
    }
  }

  async stopWorkflow(workflowId: string): Promise<boolean> {
    if (!this.runningWorkflows.has(workflowId)) {
      return false
    }

    this.runningWorkflows.delete(workflowId)
    console.log(`Stopped workflow: ${workflowId}`)
    return true
  }

  async executeScheduledWorkflows(): Promise<void> {
    const now = Date.now()
    
    for (const workflow of this.workflows.values()) {
      if (workflow.status !== 'active') continue
      
      for (const trigger of workflow.triggers) {
        if (!trigger.enabled) continue
        
        if (trigger.type === 'schedule' && this.shouldTriggerSchedule(trigger, now)) {
          try {
            await this.executeWorkflow(workflow.id)
          } catch (error) {
            console.error(`Scheduled workflow execution failed: ${workflow.name}`, error)
          }
        }
      }
    }
  }

  getWorkflow(workflowId: string): AgentWorkflow | null {
    return this.workflows.get(workflowId) || null
  }

  getAllWorkflows(): AgentWorkflow[] {
    return Array.from(this.workflows.values())
  }

  getActiveWorkflows(): AgentWorkflow[] {
    return Array.from(this.workflows.values()).filter(w => w.status === 'active')
  }

  getRunningWorkflows(): string[] {
    return Array.from(this.runningWorkflows)
  }

  private async executeWorkflowSteps(workflow: AgentWorkflow, context: any): Promise<any> {
    const results: any[] = []
    const stepResults: Map<string, any> = new Map()
    
    // Create execution context
    const executionContext = {
      ...context,
      workflowId: workflow.id,
      workflowName: workflow.name,
      stepResults,
    }

    // Execute steps in order
    for (const step of workflow.steps) {
      try {
        const result = await this.executeStep(step, executionContext)
        stepResults.set(step.id, result)
        results.push(result)
      } catch (error) {
        if (step.errorHandling === 'fail') {
          throw error
        } else if (step.errorHandling === 'retry' && step.retryCount && step.retryCount < (step.maxRetries || 3)) {
          step.retryCount++
          // Retry the step
          const result = await this.executeStep(step, executionContext)
          stepResults.set(step.id, result)
          results.push(result)
        } else if (step.errorHandling === 'skip') {
          console.warn(`Skipping failed step: ${step.name}`)
          continue
        } else {
          // Continue with next step
          console.warn(`Step failed but continuing: ${step.name}`, error)
        }
      }
    }

    return {
      workflowId: workflow.id,
      results,
      stepResults: Object.fromEntries(stepResults),
    }
  }

  private async executeStep(step: AgentWorkflowStep, context: any): Promise<any> {
    switch (step.type) {
      case 'condition':
        return await this.executeConditionStep(step, context)
      
      case 'action':
        return await this.executeActionStep(step, context)
      
      case 'loop':
        return await this.executeLoopStep(step, context)
      
      case 'parallel':
        return await this.executeParallelStep(step, context)
      
      case 'wait':
        return await this.executeWaitStep(step, context)
      
      default:
        throw new Error(`Unknown step type: ${step.type}`)
    }
  }

  private async executeConditionStep(step: AgentWorkflowStep, context: any): Promise<any> {
    const { condition, trueSteps, falseSteps } = step.parameters
    
    // Evaluate condition
    const conditionResult = this.evaluateCondition(condition, context)
    
    if (conditionResult) {
      // Execute true steps
      if (trueSteps && trueSteps.length > 0) {
        const results = []
        for (const stepId of trueSteps) {
          const nextStep = this.findStepById(stepId, context.workflowId)
          if (nextStep) {
            const result = await this.executeStep(nextStep, context)
            results.push(result)
          }
        }
        return { condition: true, results }
      }
    } else {
      // Execute false steps
      if (falseSteps && falseSteps.length > 0) {
        const results = []
        for (const stepId of falseSteps) {
          const nextStep = this.findStepById(stepId, context.workflowId)
          if (nextStep) {
            const result = await this.executeStep(nextStep, context)
            results.push(result)
          }
        }
        return { condition: false, results }
      }
    }
    
    return { condition: conditionResult }
  }

  private async executeActionStep(step: AgentWorkflowStep, context: any): Promise<any> {
    const { tool, parameters } = step.parameters
    
    if (tool) {
      // Execute tool
      return await this.agentEngine.toolManager.executeTool(tool, { ...parameters, ...context })
    } else {
      // Execute custom action
      return await this.executeCustomAction(step.parameters, context)
    }
  }

  private async executeLoopStep(step: AgentWorkflowStep, context: any): Promise<any> {
    const { condition, steps, maxIterations = 100 } = step.parameters
    const results = []
    let iteration = 0
    
    while (iteration < maxIterations) {
      const conditionResult = this.evaluateCondition(condition, { ...context, iteration })
      
      if (!conditionResult) break
      
      const iterationResults = []
      for (const stepId of steps) {
        const loopStep = this.findStepById(stepId, context.workflowId)
        if (loopStep) {
          const result = await this.executeStep(loopStep, { ...context, iteration })
          iterationResults.push(result)
        }
      }
      
      results.push({ iteration, results: iterationResults })
      iteration++
    }
    
    return { iterations: iteration, results }
  }

  private async executeParallelStep(step: AgentWorkflowStep, context: any): Promise<any> {
    const { steps } = step.parameters
    
    const promises = steps.map(async (stepId: string) => {
      const parallelStep = this.findStepById(stepId, context.workflowId)
      if (parallelStep) {
        return await this.executeStep(parallelStep, context)
      }
      return null
    })
    
    const results = await Promise.all(promises)
    return { parallel: true, results }
  }

  private async executeWaitStep(step: AgentWorkflowStep, context: any): Promise<any> {
    const { duration, condition } = step.parameters
    
    if (duration) {
      await new Promise(resolve => setTimeout(resolve, duration * 1000))
      return { waited: duration }
    }
    
    if (condition) {
      const startTime = Date.now()
      const timeout = step.parameters.timeout || 30000 // 30 seconds default
      
      while (Date.now() - startTime < timeout) {
        if (this.evaluateCondition(condition, context)) {
          return { waited: Date.now() - startTime, conditionMet: true }
        }
        await new Promise(resolve => setTimeout(resolve, 100)) // Check every 100ms
      }
      
      return { waited: Date.now() - startTime, conditionMet: false, timeout: true }
    }
    
    return { waited: 0 }
  }

  private evaluateCondition(condition: any, context: any): boolean {
    if (typeof condition === 'string') {
      // Simple string condition evaluation
      return this.evaluateStringCondition(condition, context)
    }
    
    if (typeof condition === 'object' && condition.operator) {
      // Complex condition evaluation
      return this.evaluateComplexCondition(condition, context)
    }
    
    return Boolean(condition)
  }

  private evaluateStringCondition(condition: string, context: any): boolean {
    // Simple template evaluation
    const evaluated = condition.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return context[key] || match
    })
    
    // Basic boolean evaluation
    return evaluated === 'true' || evaluated === '1' || evaluated === 'yes'
  }

  private evaluateComplexCondition(condition: any, context: any): boolean {
    const { operator, left, right } = condition
    
    const leftValue = this.getConditionValue(left, context)
    const rightValue = this.getConditionValue(right, context)
    
    switch (operator) {
      case 'eq':
        return leftValue === rightValue
      case 'ne':
        return leftValue !== rightValue
      case 'gt':
        return leftValue > rightValue
      case 'lt':
        return leftValue < rightValue
      case 'gte':
        return leftValue >= rightValue
      case 'lte':
        return leftValue <= rightValue
      case 'contains':
        return String(leftValue).includes(String(rightValue))
      case 'in':
        return Array.isArray(rightValue) && rightValue.includes(leftValue)
      default:
        return false
    }
  }

  private getConditionValue(value: any, context: any): any {
    if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
      const key = value.slice(2, -2)
      return context[key]
    }
    return value
  }

  private async executeCustomAction(parameters: any, context: any): Promise<any> {
    const { action, ...args } = parameters
    
    switch (action) {
      case 'log':
        console.log('Workflow log:', args.message)
        return { logged: args.message }
      
      case 'set_variable':
        context[args.name] = args.value
        return { variable: args.name, value: args.value }
      
      case 'increment':
        const currentValue = context[args.name] || 0
        context[args.name] = currentValue + (args.amount || 1)
        return { variable: args.name, value: context[args.name] }
      
      default:
        return { action, args }
    }
  }

  private findStepById(stepId: string, workflowId: string): AgentWorkflowStep | null {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) return null
    
    return workflow.steps.find(step => step.id === stepId) || null
  }

  private shouldTriggerSchedule(trigger: AgentWorkflowTrigger, now: number): boolean {
    const { schedule } = trigger.parameters
    
    if (schedule.type === 'interval') {
      const lastExecution = trigger.parameters.lastExecution || 0
      return now - lastExecution >= schedule.interval * 1000
    }
    
    if (schedule.type === 'cron') {
      // Simple cron-like evaluation (can be enhanced)
      return this.evaluateCronExpression(schedule.expression, now)
    }
    
    return false
  }

  private evaluateCronExpression(expression: string, now: number): boolean {
    // Simple cron evaluation - can be enhanced with a proper cron library
    const date = new Date(now)
    const [minute, hour, day, month, weekday] = expression.split(' ')
    
    return (
      this.matchesCronField(minute, date.getMinutes()) &&
      this.matchesCronField(hour, date.getHours()) &&
      this.matchesCronField(day, date.getDate()) &&
      this.matchesCronField(month, date.getMonth() + 1) &&
      this.matchesCronField(weekday, date.getDay())
    )
  }

  private matchesCronField(field: string, value: number): boolean {
    if (field === '*') return true
    if (field.includes(',')) {
      return field.split(',').map(Number).includes(value)
    }
    if (field.includes('-')) {
      const [start, end] = field.split('-').map(Number)
      return value >= start && value <= end
    }
    if (field.includes('/')) {
      const [base, step] = field.split('/').map(Number)
      return value % step === base % step
    }
    return Number(field) === value
  }

  private async registerBuiltInWorkflows(): Promise<void> {
    // Daily Report Workflow
    await this.createWorkflow({
      name: 'Daily Report Generator',
      description: 'Generate daily activity reports',
      steps: [
        {
          id: uuidv4(),
          name: 'Collect Data',
          type: 'action',
          parameters: {
            tool: 'data_analyzer',
            parameters: { analysisType: 'summary' },
          },
        },
        {
          id: uuidv4(),
          name: 'Generate Report',
          type: 'action',
          parameters: {
            tool: 'ai_model',
            parameters: {
              task: 'generate',
              prompt: 'Generate a daily activity report',
            },
          },
        },
        {
          id: uuidv4(),
          name: 'Send Report',
          type: 'action',
          parameters: {
            tool: 'communication',
            parameters: {
              type: 'email',
              subject: 'Daily Report',
            },
          },
        },
      ],
      triggers: [
        {
          type: 'schedule',
          parameters: {
            schedule: { type: 'cron', expression: '0 9 * * *' }, // 9 AM daily
          },
          enabled: true,
        },
      ],
      status: 'active',
    })

    // File Backup Workflow
    await this.createWorkflow({
      name: 'File Backup',
      description: 'Backup important files',
      steps: [
        {
          id: uuidv4(),
          name: 'List Files',
          type: 'action',
          parameters: {
            tool: 'file_manager',
            parameters: { action: 'list', path: '/important' },
          },
        },
        {
          id: uuidv4(),
          name: 'Create Backup',
          type: 'action',
          parameters: {
            tool: 'file_manager',
            parameters: { action: 'create', path: '/backup' },
          },
        },
      ],
      triggers: [
        {
          type: 'schedule',
          parameters: {
            schedule: { type: 'interval', interval: 3600 }, // Every hour
          },
          enabled: true,
        },
      ],
      status: 'active',
    })
  }

  private async loadWorkflows(): Promise<void> {
    // In a real implementation, this would load from persistent storage
    console.log('Loading workflows from storage...')
  }

  private async saveWorkflows(): Promise<void> {
    // In a real implementation, this would save to persistent storage
    console.log('Saving workflows to storage...')
  }
}