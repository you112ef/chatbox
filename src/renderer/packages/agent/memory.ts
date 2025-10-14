import { v4 as uuidv4 } from 'uuid'
import { AgentMemory, AgentTask } from './types'

export class AgentMemoryManager {
  private memories: Map<string, AgentMemory> = new Map()
  private memoryIndex: Map<string, Set<string>> = new Map() // tag -> memory IDs
  private isInitialized: boolean = false

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    // Load existing memories from storage
    await this.loadMemories()
    
    this.isInitialized = true
    console.log('Memory manager initialized')
  }

  async cleanup(): Promise<void> {
    // Save memories to storage
    await this.saveMemories()
    this.isInitialized = false
  }

  async storeMemory(memory: Omit<AgentMemory, 'id' | 'createdAt' | 'lastAccessedAt' | 'accessCount'>): Promise<AgentMemory> {
    const newMemory: AgentMemory = {
      id: uuidv4(),
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      accessCount: 0,
      ...memory,
    }

    this.memories.set(newMemory.id, newMemory)
    
    // Update index
    if (newMemory.tags) {
      newMemory.tags.forEach(tag => {
        if (!this.memoryIndex.has(tag)) {
          this.memoryIndex.set(tag, new Set())
        }
        this.memoryIndex.get(tag)!.add(newMemory.id)
      })
    }

    await this.saveMemories()
    return newMemory
  }

  async retrieveMemories(query: string, limit: number = 10): Promise<AgentMemory[]> {
    const results: AgentMemory[] = []
    const queryLower = query.toLowerCase()

    // Search by content
    for (const memory of this.memories.values()) {
      if (memory.content.toLowerCase().includes(queryLower)) {
        results.push(memory)
        this.updateAccessStats(memory)
      }
    }

    // Search by tags
    if (this.memoryIndex.has(queryLower)) {
      const memoryIds = this.memoryIndex.get(queryLower)!
      for (const memoryId of memoryIds) {
        const memory = this.memories.get(memoryId)
        if (memory && !results.find(m => m.id === memoryId)) {
          results.push(memory)
          this.updateAccessStats(memory)
        }
      }
    }

    // Sort by relevance (importance + recency + access count)
    results.sort((a, b) => {
      const scoreA = this.calculateRelevanceScore(a)
      const scoreB = this.calculateRelevanceScore(b)
      return scoreB - scoreA
    })

    return results.slice(0, limit)
  }

  async storeExperience(task: AgentTask, result: any): Promise<void> {
    const experience = {
      type: 'experience' as const,
      content: `Task: ${task.title} - ${task.description}. Result: ${JSON.stringify(result)}`,
      importance: this.calculateImportance(task, result),
      tags: ['experience', 'task', task.priority],
      metadata: {
        taskId: task.id,
        taskType: task.title,
        success: task.status === 'completed',
        duration: task.completedAt && task.createdAt ? task.completedAt - task.createdAt : 0,
      },
    }

    await this.storeMemory(experience)
  }

  async storeFact(fact: string, importance: number = 0.5, tags: string[] = []): Promise<void> {
    const factMemory = {
      type: 'fact' as const,
      content: fact,
      importance,
      tags: ['fact', ...tags],
    }

    await this.storeMemory(factMemory)
  }

  async storePreference(key: string, value: any, importance: number = 0.7): Promise<void> {
    const preference = {
      type: 'preference' as const,
      content: `Preference: ${key} = ${JSON.stringify(value)}`,
      importance,
      tags: ['preference', key],
      metadata: { key, value },
    }

    await this.storeMemory(preference)
  }

  async storeSkill(skill: string, level: number, importance: number = 0.8): Promise<void> {
    const skillMemory = {
      type: 'skill' as const,
      content: `Skill: ${skill} (Level: ${level})`,
      importance,
      tags: ['skill', skill],
      metadata: { skill, level },
    }

    await this.storeMemory(skillMemory)
  }

  async storeContext(key: string, value: any, importance: number = 0.6): Promise<void> {
    const context = {
      type: 'context' as const,
      content: `Context: ${key} = ${JSON.stringify(value)}`,
      importance,
      tags: ['context', key],
      metadata: { key, value },
    }

    await this.storeMemory(context)
  }

  async consolidateMemories(): Promise<void> {
    const memories = Array.from(this.memories.values())
    
    // Remove very old, rarely accessed memories with low importance
    const cutoffTime = Date.now() - (30 * 24 * 60 * 60 * 1000) // 30 days
    const memoriesToRemove: string[] = []

    for (const memory of memories) {
      if (
        memory.createdAt < cutoffTime &&
        memory.accessCount < 2 &&
        memory.importance < 0.3
      ) {
        memoriesToRemove.push(memory.id)
      }
    }

    // Remove memories
    memoriesToRemove.forEach(id => {
      const memory = this.memories.get(id)
      if (memory) {
        // Remove from index
        if (memory.tags) {
          memory.tags.forEach(tag => {
            const index = this.memoryIndex.get(tag)
            if (index) {
              index.delete(id)
              if (index.size === 0) {
                this.memoryIndex.delete(tag)
              }
            }
          })
        }
        this.memories.delete(id)
      }
    })

    // Merge similar memories
    await this.mergeSimilarMemories()

    await this.saveMemories()
    console.log(`Memory consolidation completed. Removed ${memoriesToRemove.length} memories.`)
  }

  private async mergeSimilarMemories(): Promise<void> {
    const memories = Array.from(this.memories.values())
    const memoriesToMerge: string[][] = []

    // Find similar memories
    for (let i = 0; i < memories.length; i++) {
      for (let j = i + 1; j < memories.length; j++) {
        const memory1 = memories[i]
        const memory2 = memories[j]

        if (this.areMemoriesSimilar(memory1, memory2)) {
          const existingGroup = memoriesToMerge.find(group => group.includes(memory1.id))
          if (existingGroup) {
            if (!existingGroup.includes(memory2.id)) {
              existingGroup.push(memory2.id)
            }
          } else {
            memoriesToMerge.push([memory1.id, memory2.id])
          }
        }
      }
    }

    // Merge similar memories
    for (const group of memoriesToMerge) {
      if (group.length > 1) {
        await this.mergeMemoryGroup(group)
      }
    }
  }

  private areMemoriesSimilar(memory1: AgentMemory, memory2: AgentMemory): boolean {
    // Check if memories have similar content
    const content1 = memory1.content.toLowerCase()
    const content2 = memory2.content.toLowerCase()
    
    // Simple similarity check - can be enhanced with more sophisticated algorithms
    const words1 = content1.split(/\s+/)
    const words2 = content2.split(/\s+/)
    const commonWords = words1.filter(word => words2.includes(word))
    const similarity = commonWords.length / Math.max(words1.length, words2.length)
    
    return similarity > 0.7 && memory1.type === memory2.type
  }

  private async mergeMemoryGroup(memoryIds: string[]): Promise<void> {
    const memories = memoryIds.map(id => this.memories.get(id)).filter(Boolean) as AgentMemory[]
    
    if (memories.length < 2) return

    // Create merged memory
    const mergedContent = memories.map(m => m.content).join(' | ')
    const mergedImportance = Math.max(...memories.map(m => m.importance))
    const mergedTags = [...new Set(memories.flatMap(m => m.tags || []))]
    const mergedMetadata = Object.assign({}, ...memories.map(m => m.metadata || {}))

    const mergedMemory: AgentMemory = {
      id: uuidv4(),
      type: memories[0].type,
      content: mergedContent,
      importance: mergedImportance,
      createdAt: Math.min(...memories.map(m => m.createdAt)),
      lastAccessedAt: Math.max(...memories.map(m => m.lastAccessedAt)),
      accessCount: memories.reduce((sum, m) => sum + m.accessCount, 0),
      tags: mergedTags,
      metadata: mergedMetadata,
    }

    // Remove old memories
    memories.forEach(memory => {
      this.memories.delete(memory.id)
      if (memory.tags) {
        memory.tags.forEach(tag => {
          const index = this.memoryIndex.get(tag)
          if (index) {
            index.delete(memory.id)
          }
        })
      }
    })

    // Add merged memory
    this.memories.set(mergedMemory.id, mergedMemory)
    if (mergedMemory.tags) {
      mergedMemory.tags.forEach(tag => {
        if (!this.memoryIndex.has(tag)) {
          this.memoryIndex.set(tag, new Set())
        }
        this.memoryIndex.get(tag)!.add(mergedMemory.id)
      })
    }
  }

  private calculateImportance(task: AgentTask, result: any): number {
    let importance = 0.5 // Base importance

    // Increase importance based on task priority
    switch (task.priority) {
      case 'critical':
        importance += 0.3
        break
      case 'high':
        importance += 0.2
        break
      case 'medium':
        importance += 0.1
        break
    }

    // Increase importance for successful tasks
    if (task.status === 'completed') {
      importance += 0.2
    }

    // Increase importance for complex tasks (based on duration)
    if (task.actualDuration && task.actualDuration > 300000) { // 5 minutes
      importance += 0.1
    }

    return Math.min(importance, 1.0)
  }

  private calculateRelevanceScore(memory: AgentMemory): number {
    const now = Date.now()
    const age = now - memory.createdAt
    const recency = Math.exp(-age / (7 * 24 * 60 * 60 * 1000)) // 7 days decay
    const access = Math.log(1 + memory.accessCount) / 10 // Logarithmic access bonus
    
    return memory.importance * 0.5 + recency * 0.3 + access * 0.2
  }

  private updateAccessStats(memory: AgentMemory): void {
    memory.lastAccessedAt = Date.now()
    memory.accessCount++
  }

  private async loadMemories(): Promise<void> {
    try {
      // In a real implementation, this would load from persistent storage
      // For now, we'll start with an empty memory system
      console.log('Loading memories from storage...')
    } catch (error) {
      console.error('Failed to load memories:', error)
    }
  }

  private async saveMemories(): Promise<void> {
    try {
      // In a real implementation, this would save to persistent storage
      console.log('Saving memories to storage...')
    } catch (error) {
      console.error('Failed to save memories:', error)
    }
  }

  // Getters
  getAllMemories(): AgentMemory[] {
    return Array.from(this.memories.values())
  }

  getMemoryById(id: string): AgentMemory | undefined {
    return this.memories.get(id)
  }

  getMemoriesByType(type: AgentMemory['type']): AgentMemory[] {
    return Array.from(this.memories.values()).filter(memory => memory.type === type)
  }

  getMemoriesByTag(tag: string): AgentMemory[] {
    const memoryIds = this.memoryIndex.get(tag)
    if (!memoryIds) return []
    
    return Array.from(memoryIds)
      .map(id => this.memories.get(id))
      .filter(Boolean) as AgentMemory[]
  }
}