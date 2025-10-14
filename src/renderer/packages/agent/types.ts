export interface AgentTask {
  id: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'critical'
  createdAt: number
  updatedAt: number
  completedAt?: number
  subtasks?: AgentTask[]
  parentTaskId?: string
  dependencies?: string[]
  estimatedDuration?: number // in minutes
  actualDuration?: number // in minutes
  tags?: string[]
  metadata?: Record<string, any>
  result?: any
  error?: string
}

export interface AgentPlan {
  id: string
  goal: string
  description: string
  status: 'draft' | 'active' | 'completed' | 'failed' | 'cancelled'
  createdAt: number
  updatedAt: number
  completedAt?: number
  tasks: AgentTask[]
  estimatedTotalDuration?: number
  actualDuration?: number
  successRate?: number
  metadata?: Record<string, any>
}

export interface AgentMemory {
  id: string
  type: 'fact' | 'experience' | 'preference' | 'skill' | 'context'
  content: string
  importance: number // 0-1
  createdAt: number
  lastAccessedAt: number
  accessCount: number
  tags?: string[]
  metadata?: Record<string, any>
  relatedMemories?: string[]
}

export interface AgentCapability {
  name: string
  description: string
  category: 'reasoning' | 'tool_use' | 'memory' | 'planning' | 'communication' | 'learning'
  level: 'basic' | 'intermediate' | 'advanced' | 'expert'
  enabled: boolean
  parameters?: Record<string, any>
}

export interface AgentState {
  id: string
  name: string
  description: string
  status: 'idle' | 'thinking' | 'acting' | 'learning' | 'error'
  currentTask?: AgentTask
  currentPlan?: AgentPlan
  capabilities: AgentCapability[]
  memories: AgentMemory[]
  context: Record<string, any>
  preferences: Record<string, any>
  performance: {
    tasksCompleted: number
    successRate: number
    averageTaskDuration: number
    learningProgress: number
  }
  createdAt: number
  updatedAt: number
}

export interface AgentReasoningStep {
  id: string
  type: 'observation' | 'analysis' | 'hypothesis' | 'evaluation' | 'conclusion' | 'action'
  content: string
  confidence: number // 0-1
  reasoning: string
  evidence?: string[]
  alternatives?: string[]
  createdAt: number
}

export interface AgentReasoningChain {
  id: string
  goal: string
  steps: AgentReasoningStep[]
  conclusion?: string
  confidence: number
  createdAt: number
  completedAt?: number
}

export interface AgentTool {
  name: string
  description: string
  parameters: Record<string, any>
  execute: (args: any) => Promise<any>
  category: 'file' | 'web' | 'code' | 'system' | 'ai' | 'communication'
  capabilities: string[]
}

export interface AgentWorkflow {
  id: string
  name: string
  description: string
  steps: AgentWorkflowStep[]
  triggers: AgentWorkflowTrigger[]
  status: 'active' | 'inactive' | 'error'
  createdAt: number
  updatedAt: number
  lastExecutedAt?: number
  executionCount: number
  successRate: number
}

export interface AgentWorkflowStep {
  id: string
  name: string
  type: 'condition' | 'action' | 'loop' | 'parallel' | 'wait'
  parameters: Record<string, any>
  nextSteps?: string[]
  errorHandling?: 'continue' | 'retry' | 'fail' | 'skip'
  retryCount?: number
  maxRetries?: number
}

export interface AgentWorkflowTrigger {
  type: 'schedule' | 'event' | 'condition' | 'manual'
  parameters: Record<string, any>
  enabled: boolean
}

export interface AgentCollaboration {
  id: string
  participants: string[] // agent IDs
  goal: string
  status: 'planning' | 'active' | 'completed' | 'failed'
  tasks: AgentCollaborationTask[]
  communication: AgentMessage[]
  createdAt: number
  updatedAt: number
}

export interface AgentCollaborationTask {
  id: string
  assignedTo: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  dependencies?: string[]
  result?: any
  createdAt: number
  completedAt?: number
}

export interface AgentMessage {
  id: string
  from: string
  to: string
  type: 'task_update' | 'request' | 'response' | 'notification' | 'error'
  content: string
  metadata?: Record<string, any>
  createdAt: number
  readAt?: number
}