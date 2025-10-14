import { v4 as uuidv4 } from 'uuid'
import { AgentPlan, AgentTask, AgentMemory, AgentMemoryManager } from './types'

export class AgentPlanner {
  private plans: Map<string, AgentPlan> = new Map()
  private memoryManager: AgentMemoryManager

  constructor(memoryManager: AgentMemoryManager) {
    this.memoryManager = memoryManager
  }

  async createPlan(goal: string, description?: string): Promise<AgentPlan> {
    const planId = uuidv4()
    
    // Use reasoning to break down the goal into tasks
    const tasks = await this.decomposeGoal(goal, description)
    
    const plan: AgentPlan = {
      id: planId,
      goal,
      description: description || '',
      status: 'draft',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tasks,
      estimatedTotalDuration: this.calculateEstimatedDuration(tasks),
      metadata: {
        complexity: this.assessComplexity(goal),
        domain: this.identifyDomain(goal),
      },
    }

    this.plans.set(planId, plan)
    return plan
  }

  async updatePlan(planId: string, updates: Partial<AgentPlan>): Promise<AgentPlan | null> {
    const plan = this.plans.get(planId)
    if (!plan) {
      return null
    }

    const updatedPlan = {
      ...plan,
      ...updates,
      updatedAt: Date.now(),
    }

    this.plans.set(planId, updatedPlan)
    return updatedPlan
  }

  async addTaskToPlan(planId: string, task: Omit<AgentTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<AgentTask | null> {
    const plan = this.plans.get(planId)
    if (!plan) {
      return null
    }

    const newTask: AgentTask = {
      id: uuidv4(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...task,
    }

    plan.tasks.push(newTask)
    plan.updatedAt = Date.now()
    plan.estimatedTotalDuration = this.calculateEstimatedDuration(plan.tasks)

    return newTask
  }

  async removeTaskFromPlan(planId: string, taskId: string): Promise<boolean> {
    const plan = this.plans.get(planId)
    if (!plan) {
      return false
    }

    const taskIndex = plan.tasks.findIndex(task => task.id === taskId)
    if (taskIndex === -1) {
      return false
    }

    plan.tasks.splice(taskIndex, 1)
    plan.updatedAt = Date.now()
    plan.estimatedTotalDuration = this.calculateEstimatedDuration(plan.tasks)

    return true
  }

  async optimizePlan(planId: string): Promise<AgentPlan | null> {
    const plan = this.plans.get(planId)
    if (!plan) {
      return null
    }

    // Analyze task dependencies and optimize order
    const optimizedTasks = await this.optimizeTaskOrder(plan.tasks)
    
    // Identify parallel execution opportunities
    const parallelGroups = this.identifyParallelTasks(optimizedTasks)
    
    // Update plan with optimizations
    const optimizedPlan = {
      ...plan,
      tasks: optimizedTasks,
      metadata: {
        ...plan.metadata,
        parallelGroups,
        optimizationApplied: true,
      },
      updatedAt: Date.now(),
    }

    this.plans.set(planId, optimizedPlan)
    return optimizedPlan
  }

  async getPlan(planId: string): Promise<AgentPlan | null> {
    return this.plans.get(planId) || null
  }

  async getAllPlans(): Promise<AgentPlan[]> {
    return Array.from(this.plans.values())
  }

  async getActivePlans(): Promise<AgentPlan[]> {
    return Array.from(this.plans.values()).filter(plan => plan.status === 'active')
  }

  private async decomposeGoal(goal: string, description?: string): Promise<AgentTask[]> {
    const tasks: AgentTask[] = []
    
    // Use memory to find similar past experiences
    const similarMemories = await this.memoryManager.retrieveMemories(goal, 5)
    
    // Basic task decomposition based on common patterns
    const goalText = `${goal} ${description || ''}`.toLowerCase()
    
    // Research phase
    if (this.requiresResearch(goalText)) {
      tasks.push({
        id: uuidv4(),
        title: 'Research and Information Gathering',
        description: 'Gather relevant information and data for the goal',
        status: 'pending',
        priority: 'high',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        estimatedDuration: 30,
        tags: ['research', 'information-gathering'],
      })
    }

    // Analysis phase
    if (this.requiresAnalysis(goalText)) {
      tasks.push({
        id: uuidv4(),
        title: 'Analysis and Planning',
        description: 'Analyze gathered information and create detailed plan',
        status: 'pending',
        priority: 'high',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        estimatedDuration: 20,
        tags: ['analysis', 'planning'],
      })
    }

    // Implementation phase
    tasks.push({
      id: uuidv4(),
      title: 'Implementation',
      description: 'Execute the main implementation work',
      status: 'pending',
      priority: 'critical',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      estimatedDuration: 60,
      tags: ['implementation', 'execution'],
    })

    // Review phase
    if (this.requiresReview(goalText)) {
      tasks.push({
        id: uuidv4(),
        title: 'Review and Validation',
        description: 'Review results and validate against requirements',
        status: 'pending',
        priority: 'medium',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        estimatedDuration: 15,
        tags: ['review', 'validation'],
      })
    }

    // Documentation phase
    if (this.requiresDocumentation(goalText)) {
      tasks.push({
        id: uuidv4(),
        title: 'Documentation',
        description: 'Create documentation and record results',
        status: 'pending',
        priority: 'low',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        estimatedDuration: 10,
        tags: ['documentation'],
      })
    }

    // Set up dependencies
    this.setupTaskDependencies(tasks)

    return tasks
  }

  private requiresResearch(goalText: string): boolean {
    const researchKeywords = ['research', 'investigate', 'analyze', 'study', 'explore', 'find', 'discover']
    return researchKeywords.some(keyword => goalText.includes(keyword))
  }

  private requiresAnalysis(goalText: string): boolean {
    const analysisKeywords = ['analyze', 'evaluate', 'assess', 'compare', 'review', 'examine']
    return analysisKeywords.some(keyword => goalText.includes(keyword))
  }

  private requiresReview(goalText: string): boolean {
    const reviewKeywords = ['review', 'validate', 'verify', 'check', 'test', 'quality']
    return reviewKeywords.some(keyword => goalText.includes(keyword))
  }

  private requiresDocumentation(goalText: string): boolean {
    const docKeywords = ['document', 'record', 'write', 'create', 'report', 'summary']
    return docKeywords.some(keyword => goalText.includes(keyword))
  }

  private setupTaskDependencies(tasks: AgentTask[]): void {
    // Set up basic dependencies based on task order
    for (let i = 1; i < tasks.length; i++) {
      tasks[i].dependencies = [tasks[i - 1].id]
    }
  }

  private calculateEstimatedDuration(tasks: AgentTask[]): number {
    return tasks.reduce((total, task) => total + (task.estimatedDuration || 0), 0)
  }

  private assessComplexity(goal: string): 'low' | 'medium' | 'high' {
    const complexityIndicators = {
      low: ['simple', 'basic', 'quick', 'easy'],
      medium: ['moderate', 'standard', 'normal', 'typical'],
      high: ['complex', 'advanced', 'sophisticated', 'challenging', 'difficult'],
    }

    const goalLower = goal.toLowerCase()
    
    for (const [level, keywords] of Object.entries(complexityIndicators)) {
      if (keywords.some(keyword => goalLower.includes(keyword))) {
        return level as 'low' | 'medium' | 'high'
      }
    }

    // Default to medium complexity
    return 'medium'
  }

  private identifyDomain(goal: string): string {
    const domains = {
      'software': ['code', 'programming', 'software', 'development', 'app', 'website'],
      'data': ['data', 'analysis', 'database', 'statistics', 'research'],
      'communication': ['email', 'message', 'communication', 'presentation', 'report'],
      'creative': ['design', 'creative', 'art', 'writing', 'content'],
      'business': ['business', 'strategy', 'planning', 'management', 'process'],
      'technical': ['technical', 'system', 'infrastructure', 'configuration'],
    }

    const goalLower = goal.toLowerCase()
    
    for (const [domain, keywords] of Object.entries(domains)) {
      if (keywords.some(keyword => goalLower.includes(keyword))) {
        return domain
      }
    }

    return 'general'
  }

  private async optimizeTaskOrder(tasks: AgentTask[]): Promise<AgentTask[]> {
    // Sort tasks by priority and dependencies
    const sortedTasks = [...tasks].sort((a, b) => {
      // First by priority
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      if (priorityDiff !== 0) return priorityDiff

      // Then by estimated duration (shorter tasks first)
      return (a.estimatedDuration || 0) - (b.estimatedDuration || 0)
    })

    return sortedTasks
  }

  private identifyParallelTasks(tasks: AgentTask[]): string[][] {
    const parallelGroups: string[][] = []
    const processed = new Set<string>()

    for (const task of tasks) {
      if (processed.has(task.id)) continue

      const parallelGroup = [task.id]
      processed.add(task.id)

      // Find tasks that can run in parallel (no dependencies between them)
      for (const otherTask of tasks) {
        if (processed.has(otherTask.id)) continue
        
        const canRunInParallel = !this.hasDependency(task, otherTask) && 
                                !this.hasDependency(otherTask, task)
        
        if (canRunInParallel) {
          parallelGroup.push(otherTask.id)
          processed.add(otherTask.id)
        }
      }

      if (parallelGroup.length > 1) {
        parallelGroups.push(parallelGroup)
      }
    }

    return parallelGroups
  }

  private hasDependency(task1: AgentTask, task2: AgentTask): boolean {
    return task1.dependencies?.includes(task2.id) || false
  }
}