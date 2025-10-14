import { v4 as uuidv4 } from 'uuid'
import { AgentCollaboration, AgentCollaborationTask, AgentMessage, AgentEngine } from './types'

export class AgentCollaborationManager {
  private collaborations: Map<string, AgentCollaboration> = new Map()
  private messages: Map<string, AgentMessage[]> = new Map()
  private agentEngine: AgentEngine
  private isInitialized: boolean = false

  constructor(agentEngine: AgentEngine) {
    this.agentEngine = agentEngine
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    // Load existing collaborations
    await this.loadCollaborations()
    
    this.isInitialized = true
    console.log('Collaboration manager initialized')
  }

  async cleanup(): Promise<void> {
    // Save collaborations
    await this.saveCollaborations()
    this.isInitialized = false
  }

  async createCollaboration(participants: string[], goal: string): Promise<AgentCollaboration> {
    const collaboration: AgentCollaboration = {
      id: uuidv4(),
      participants,
      goal,
      status: 'planning',
      tasks: [],
      communication: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    this.collaborations.set(collaboration.id, collaboration)
    this.messages.set(collaboration.id, [])
    
    await this.saveCollaborations()
    
    // Send initial message
    await this.sendMessage(collaboration.id, 'system', 'all', 'notification', 
      `Collaboration started with goal: ${goal}`)
    
    console.log(`Created collaboration: ${collaboration.id}`)
    return collaboration
  }

  async addTaskToCollaboration(collaborationId: string, task: Omit<AgentCollaborationTask, 'id' | 'createdAt'>): Promise<AgentCollaborationTask | null> {
    const collaboration = this.collaborations.get(collaborationId)
    if (!collaboration) {
      return null
    }

    const newTask: AgentCollaborationTask = {
      id: uuidv4(),
      createdAt: Date.now(),
      ...task,
    }

    collaboration.tasks.push(newTask)
    collaboration.updatedAt = Date.now()
    
    await this.saveCollaborations()
    
    // Notify participants
    await this.sendMessage(collaborationId, 'system', 'all', 'notification',
      `New task added: ${newTask.description}`)
    
    return newTask
  }

  async updateTaskStatus(collaborationId: string, taskId: string, status: AgentCollaborationTask['status'], result?: any): Promise<boolean> {
    const collaboration = this.collaborations.get(collaborationId)
    if (!collaboration) {
      return false
    }

    const task = collaboration.tasks.find(t => t.id === taskId)
    if (!task) {
      return false
    }

    const oldStatus = task.status
    task.status = status
    if (result) {
      task.result = result
    }
    if (status === 'completed') {
      task.completedAt = Date.now()
    }

    collaboration.updatedAt = Date.now()
    await this.saveCollaborations()
    
    // Notify participants
    await this.sendMessage(collaborationId, 'system', 'all', 'notification',
      `Task status updated: ${task.description} - ${oldStatus} → ${status}`)
    
    return true
  }

  async assignTask(collaborationId: string, taskId: string, assignedTo: string): Promise<boolean> {
    const collaboration = this.collaborations.get(collaborationId)
    if (!collaboration) {
      return false
    }

    const task = collaboration.tasks.find(t => t.id === taskId)
    if (!task) {
      return false
    }

    task.assignedTo = assignedTo
    collaboration.updatedAt = Date.now()
    
    await this.saveCollaborations()
    
    // Notify the assignee
    await this.sendMessage(collaborationId, 'system', assignedTo, 'notification',
      `Task assigned to you: ${task.description}`)
    
    return true
  }

  async sendMessage(collaborationId: string, from: string, to: string, type: AgentMessage['type'], content: string, metadata?: any): Promise<AgentMessage> {
    const message: AgentMessage = {
      id: uuidv4(),
      from,
      to,
      type,
      content,
      metadata,
      createdAt: Date.now(),
    }

    const messages = this.messages.get(collaborationId) || []
    messages.push(message)
    this.messages.set(collaborationId, messages)

    const collaboration = this.collaborations.get(collaborationId)
    if (collaboration) {
      collaboration.communication.push(message)
      collaboration.updatedAt = Date.now()
    }

    await this.saveCollaborations()
    
    console.log(`Message sent in collaboration ${collaborationId}: ${from} → ${to}`)
    return message
  }

  async getMessages(collaborationId: string, limit?: number): Promise<AgentMessage[]> {
    const messages = this.messages.get(collaborationId) || []
    return limit ? messages.slice(-limit) : messages
  }

  async markMessageAsRead(collaborationId: string, messageId: string, reader: string): Promise<boolean> {
    const messages = this.messages.get(collaborationId)
    if (!messages) {
      return false
    }

    const message = messages.find(m => m.id === messageId)
    if (!message) {
      return false
    }

    message.readAt = Date.now()
    await this.saveCollaborations()
    
    return true
  }

  async getUnreadMessages(collaborationId: string, participant: string): Promise<AgentMessage[]> {
    const messages = this.messages.get(collaborationId) || []
    return messages.filter(m => 
      m.to === participant || m.to === 'all' && 
      !m.readAt
    )
  }

  async updateCollaborationStatus(collaborationId: string, status: AgentCollaboration['status']): Promise<boolean> {
    const collaboration = this.collaborations.get(collaborationId)
    if (!collaboration) {
      return false
    }

    collaboration.status = status
    collaboration.updatedAt = Date.now()
    
    await this.saveCollaborations()
    
    // Notify participants
    await this.sendMessage(collaborationId, 'system', 'all', 'notification',
      `Collaboration status updated: ${status}`)
    
    return true
  }

  async getCollaboration(collaborationId: string): Promise<AgentCollaboration | null> {
    return this.collaborations.get(collaborationId) || null
  }

  async getAllCollaborations(): Promise<AgentCollaboration[]> {
    return Array.from(this.collaborations.values())
  }

  async getCollaborationsByParticipant(participant: string): Promise<AgentCollaboration[]> {
    return Array.from(this.collaborations.values()).filter(c => 
      c.participants.includes(participant)
    )
  }

  async getActiveCollaborations(): Promise<AgentCollaboration[]> {
    return Array.from(this.collaborations.values()).filter(c => 
      c.status === 'active'
    )
  }

  async monitorCollaborations(): Promise<void> {
    const now = Date.now()
    const timeout = 24 * 60 * 60 * 1000 // 24 hours

    for (const collaboration of this.collaborations.values()) {
      if (collaboration.status === 'active' && now - collaboration.updatedAt > timeout) {
        // Check if all tasks are completed
        const allTasksCompleted = collaboration.tasks.every(task => 
          task.status === 'completed' || task.status === 'failed'
        )

        if (allTasksCompleted) {
          await this.updateCollaborationStatus(collaboration.id, 'completed')
          console.log(`Collaboration completed due to timeout: ${collaboration.id}`)
        }
      }
    }
  }

  async createTaskDependency(collaborationId: string, taskId: string, dependsOn: string): Promise<boolean> {
    const collaboration = this.collaborations.get(collaborationId)
    if (!collaboration) {
      return false
    }

    const task = collaboration.tasks.find(t => t.id === taskId)
    if (!task) {
      return false
    }

    if (!task.dependencies) {
      task.dependencies = []
    }

    if (!task.dependencies.includes(dependsOn)) {
      task.dependencies.push(dependsOn)
      collaboration.updatedAt = Date.now()
      await this.saveCollaborations()
      
      return true
    }

    return false
  }

  async getTaskDependencies(collaborationId: string, taskId: string): Promise<string[]> {
    const collaboration = this.collaborations.get(collaborationId)
    if (!collaboration) {
      return []
    }

    const task = collaboration.tasks.find(t => t.id === taskId)
    return task?.dependencies || []
  }

  async canExecuteTask(collaborationId: string, taskId: string): Promise<boolean> {
    const dependencies = await this.getTaskDependencies(collaborationId, taskId)
    if (dependencies.length === 0) {
      return true
    }

    const collaboration = this.collaborations.get(collaborationId)
    if (!collaboration) {
      return false
    }

    // Check if all dependencies are completed
    return dependencies.every(depId => {
      const depTask = collaboration.tasks.find(t => t.id === depId)
      return depTask?.status === 'completed'
    })
  }

  async getCollaborationProgress(collaborationId: string): Promise<{
    totalTasks: number
    completedTasks: number
    inProgressTasks: number
    failedTasks: number
    progressPercentage: number
  }> {
    const collaboration = this.collaborations.get(collaborationId)
    if (!collaboration) {
      return {
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        failedTasks: 0,
        progressPercentage: 0,
      }
    }

    const totalTasks = collaboration.tasks.length
    const completedTasks = collaboration.tasks.filter(t => t.status === 'completed').length
    const inProgressTasks = collaboration.tasks.filter(t => t.status === 'in_progress').length
    const failedTasks = collaboration.tasks.filter(t => t.status === 'failed').length
    const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      failedTasks,
      progressPercentage,
    }
  }

  async generateCollaborationReport(collaborationId: string): Promise<any> {
    const collaboration = this.collaborations.get(collaborationId)
    if (!collaboration) {
      return null
    }

    const progress = await this.getCollaborationProgress(collaborationId)
    const messages = this.messages.get(collaborationId) || []

    return {
      collaborationId: collaboration.id,
      goal: collaboration.goal,
      status: collaboration.status,
      participants: collaboration.participants,
      progress,
      tasks: collaboration.tasks.map(task => ({
        id: task.id,
        description: task.description,
        assignedTo: task.assignedTo,
        status: task.status,
        createdAt: task.createdAt,
        completedAt: task.completedAt,
        dependencies: task.dependencies || [],
      })),
      communication: {
        totalMessages: messages.length,
        messagesByType: this.groupMessagesByType(messages),
        recentMessages: messages.slice(-10),
      },
      timeline: {
        createdAt: collaboration.createdAt,
        updatedAt: collaboration.updatedAt,
        duration: Date.now() - collaboration.createdAt,
      },
    }
  }

  private groupMessagesByType(messages: AgentMessage[]): Record<string, number> {
    const groups: Record<string, number> = {}
    
    for (const message of messages) {
      groups[message.type] = (groups[message.type] || 0) + 1
    }
    
    return groups
  }

  private async loadCollaborations(): Promise<void> {
    // In a real implementation, this would load from persistent storage
    console.log('Loading collaborations from storage...')
  }

  private async saveCollaborations(): Promise<void> {
    // In a real implementation, this would save to persistent storage
    console.log('Saving collaborations to storage...')
  }
}