import { v4 as uuidv4 } from 'uuid'
import { AgentReasoningChain, AgentReasoningStep, AgentTask, AgentMemory, AgentMemoryManager } from './types'

export class AgentReasoner {
  private memoryManager: AgentMemoryManager
  private reasoningChains: Map<string, AgentReasoningChain> = new Map()

  constructor(memoryManager: AgentMemoryManager) {
    this.memoryManager = memoryManager
  }

  async analyzeTask(task: AgentTask): Promise<AgentReasoningChain> {
    const chainId = uuidv4()
    const steps: AgentReasoningStep[] = []

    // Step 1: Observation - Understand what the task requires
    const observationStep = await this.createObservationStep(task)
    steps.push(observationStep)

    // Step 2: Analysis - Break down the task components
    const analysisStep = await this.createAnalysisStep(task, observationStep)
    steps.push(analysisStep)

    // Step 3: Hypothesis - Generate possible approaches
    const hypothesisStep = await this.createHypothesisStep(task, analysisStep)
    steps.push(hypothesisStep)

    // Step 4: Evaluation - Assess the best approach
    const evaluationStep = await this.createEvaluationStep(task, hypothesisStep)
    steps.push(evaluationStep)

    // Step 5: Conclusion - Decide on the approach
    const conclusionStep = await this.createConclusionStep(task, evaluationStep)
    steps.push(conclusionStep)

    // Step 6: Action - Define specific actions to take
    const actionStep = await this.createActionStep(task, conclusionStep)
    steps.push(actionStep)

    const reasoningChain: AgentReasoningChain = {
      id: chainId,
      goal: task.title,
      steps,
      conclusion: conclusionStep.content,
      confidence: this.calculateOverallConfidence(steps),
      createdAt: Date.now(),
    }

    this.reasoningChains.set(chainId, reasoningChain)
    return reasoningChain
  }

  async reasonAboutProblem(problem: string, context?: any): Promise<AgentReasoningChain> {
    const chainId = uuidv4()
    const steps: AgentReasoningStep[] = []

    // Step 1: Problem Understanding
    const understandingStep: AgentReasoningStep = {
      id: uuidv4(),
      type: 'observation',
      content: `Understanding the problem: ${problem}`,
      confidence: 0.8,
      reasoning: 'Analyzing the problem statement to understand what needs to be solved',
      createdAt: Date.now(),
    }
    steps.push(understandingStep)

    // Step 2: Context Analysis
    const contextStep: AgentReasoningStep = {
      id: uuidv4(),
      type: 'analysis',
      content: `Context analysis: ${JSON.stringify(context || {})}`,
      confidence: 0.7,
      reasoning: 'Examining the context and constraints around the problem',
      createdAt: Date.now(),
    }
    steps.push(contextStep)

    // Step 3: Solution Generation
    const solutionStep: AgentReasoningStep = {
      id: uuidv4(),
      type: 'hypothesis',
      content: await this.generateSolutionHypotheses(problem, context),
      confidence: 0.6,
      reasoning: 'Generating possible solutions based on problem understanding',
      createdAt: Date.now(),
    }
    steps.push(solutionStep)

    // Step 4: Solution Evaluation
    const evaluationStep: AgentReasoningStep = {
      id: uuidv4(),
      type: 'evaluation',
      content: await this.evaluateSolutions(solutionStep.content, problem),
      confidence: 0.7,
      reasoning: 'Evaluating the feasibility and effectiveness of proposed solutions',
      createdAt: Date.now(),
    }
    steps.push(evaluationStep)

    // Step 5: Final Recommendation
    const recommendationStep: AgentReasoningStep = {
      id: uuidv4(),
      type: 'conclusion',
      content: await this.generateRecommendation(evaluationStep.content),
      confidence: 0.8,
      reasoning: 'Synthesizing the analysis into a final recommendation',
      createdAt: Date.now(),
    }
    steps.push(recommendationStep)

    const reasoningChain: AgentReasoningChain = {
      id: chainId,
      goal: problem,
      steps,
      conclusion: recommendationStep.content,
      confidence: this.calculateOverallConfidence(steps),
      createdAt: Date.now(),
    }

    this.reasoningChains.set(chainId, reasoningChain)
    return reasoningChain
  }

  async selfReflect(reasoningChain: AgentReasoningChain): Promise<AgentReasoningChain> {
    const reflectionStep: AgentReasoningStep = {
      id: uuidv4(),
      type: 'evaluation',
      content: await this.performSelfReflection(reasoningChain),
      confidence: 0.9,
      reasoning: 'Reflecting on the reasoning process to identify potential improvements',
      createdAt: Date.now(),
    }

    const updatedChain = {
      ...reasoningChain,
      steps: [...reasoningChain.steps, reflectionStep],
      updatedAt: Date.now(),
    }

    this.reasoningChains.set(reasoningChain.id, updatedChain)
    return updatedChain
  }

  private async createObservationStep(task: AgentTask): Promise<AgentReasoningStep> {
    const content = `Task: ${task.title}\nDescription: ${task.description}\nPriority: ${task.priority}\nTags: ${task.tags?.join(', ') || 'none'}`
    
    return {
      id: uuidv4(),
      type: 'observation',
      content,
      confidence: 0.9,
      reasoning: 'Observing and understanding the task requirements',
      createdAt: Date.now(),
    }
  }

  private async createAnalysisStep(task: AgentTask, observationStep: AgentReasoningStep): Promise<AgentReasoningStep> {
    // Retrieve relevant memories for context
    const relevantMemories = await this.memoryManager.retrieveMemories(task.title, 3)
    
    const content = `Analysis of task components:\n` +
      `- Task type: ${this.identifyTaskType(task)}\n` +
      `- Complexity: ${this.assessTaskComplexity(task)}\n` +
      `- Required skills: ${this.identifyRequiredSkills(task)}\n` +
      `- Relevant past experiences: ${relevantMemories.length} found\n` +
      `- Estimated effort: ${task.estimatedDuration || 'unknown'} minutes`

    return {
      id: uuidv4(),
      type: 'analysis',
      content,
      confidence: 0.8,
      reasoning: 'Breaking down the task into its components and analyzing requirements',
      evidence: relevantMemories.map(m => m.id),
      createdAt: Date.now(),
    }
  }

  private async createHypothesisStep(task: AgentTask, analysisStep: AgentReasoningStep): Promise<AgentReasoningStep> {
    const approaches = await this.generateApproaches(task)
    
    const content = `Possible approaches:\n${approaches.map((approach, index) => 
      `${index + 1}. ${approach}`).join('\n')}`

    return {
      id: uuidv4(),
      type: 'hypothesis',
      content,
      confidence: 0.7,
      reasoning: 'Generating multiple possible approaches to solve the task',
      alternatives: approaches,
      createdAt: Date.now(),
    }
  }

  private async createEvaluationStep(task: AgentTask, hypothesisStep: AgentReasoningStep): Promise<AgentReasoningStep> {
    const evaluation = await this.evaluateApproaches(hypothesisStep.alternatives || [], task)
    
    const content = `Evaluation of approaches:\n${evaluation}`

    return {
      id: uuidv4(),
      type: 'evaluation',
      content,
      confidence: 0.8,
      reasoning: 'Evaluating the pros and cons of each approach',
      createdAt: Date.now(),
    }
  }

  private async createConclusionStep(task: AgentTask, evaluationStep: AgentReasoningStep): Promise<AgentReasoningStep> {
    const bestApproach = await this.selectBestApproach(evaluationStep.content)
    
    const content = `Selected approach: ${bestApproach}\n` +
      `Reasoning: This approach was selected based on efficiency, feasibility, and alignment with task requirements.`

    return {
      id: uuidv4(),
      type: 'conclusion',
      content,
      confidence: 0.8,
      reasoning: 'Concluding on the best approach based on evaluation',
      createdAt: Date.now(),
    }
  }

  private async createActionStep(task: AgentTask, conclusionStep: AgentReasoningStep): Promise<AgentReasoningStep> {
    const actions = await this.generateSpecificActions(task, conclusionStep.content)
    
    const content = `Specific actions to take:\n${actions.map((action, index) => 
      `${index + 1}. ${action}`).join('\n')}`

    return {
      id: uuidv4(),
      type: 'action',
      content,
      confidence: 0.9,
      reasoning: 'Defining specific, actionable steps to execute the chosen approach',
      createdAt: Date.now(),
    }
  }

  private identifyTaskType(task: AgentTask): string {
    const title = task.title.toLowerCase()
    const description = task.description.toLowerCase()
    const text = `${title} ${description}`

    if (text.includes('research') || text.includes('investigate')) return 'Research'
    if (text.includes('analyze') || text.includes('evaluate')) return 'Analysis'
    if (text.includes('create') || text.includes('build') || text.includes('develop')) return 'Creation'
    if (text.includes('fix') || text.includes('debug') || text.includes('resolve')) return 'Problem Solving'
    if (text.includes('organize') || text.includes('structure')) return 'Organization'
    if (text.includes('communicate') || text.includes('present')) return 'Communication'
    
    return 'General'
  }

  private assessTaskComplexity(task: AgentTask): string {
    const indicators = {
      low: ['simple', 'basic', 'quick', 'easy', 'straightforward'],
      medium: ['moderate', 'standard', 'normal', 'typical', 'regular'],
      high: ['complex', 'advanced', 'sophisticated', 'challenging', 'difficult', 'intricate'],
    }

    const text = `${task.title} ${task.description}`.toLowerCase()
    
    for (const [level, keywords] of Object.entries(indicators)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return level
      }
    }

    return 'medium'
  }

  private identifyRequiredSkills(task: AgentTask): string[] {
    const skills: string[] = []
    const text = `${task.title} ${task.description}`.toLowerCase()

    if (text.includes('code') || text.includes('programming')) skills.push('Programming')
    if (text.includes('data') || text.includes('analysis')) skills.push('Data Analysis')
    if (text.includes('design') || text.includes('creative')) skills.push('Design')
    if (text.includes('research') || text.includes('investigate')) skills.push('Research')
    if (text.includes('communication') || text.includes('present')) skills.push('Communication')
    if (text.includes('web') || text.includes('search')) skills.push('Web Research')
    if (text.includes('file') || text.includes('document')) skills.push('File Management')

    return skills.length > 0 ? skills : ['General Problem Solving']
  }

  private async generateApproaches(task: AgentTask): Promise<string[]> {
    const approaches: string[] = []
    const taskType = this.identifyTaskType(task)

    switch (taskType) {
      case 'Research':
        approaches.push('Use web search to gather information')
        approaches.push('Query knowledge base for relevant data')
        approaches.push('Analyze existing documents and resources')
        break
      case 'Analysis':
        approaches.push('Break down the problem into smaller components')
        approaches.push('Use data analysis tools and techniques')
        approaches.push('Apply systematic analysis methodology')
        break
      case 'Creation':
        approaches.push('Start with a basic prototype and iterate')
        approaches.push('Use existing templates and modify as needed')
        approaches.push('Build from scratch with careful planning')
        break
      case 'Problem Solving':
        approaches.push('Identify root cause and address systematically')
        approaches.push('Use trial and error with careful documentation')
        approaches.push('Seek help from knowledge base or external resources')
        break
      default:
        approaches.push('Apply systematic problem-solving approach')
        approaches.push('Break down into smaller, manageable tasks')
        approaches.push('Use available tools and resources effectively')
    }

    return approaches
  }

  private async evaluateApproaches(approaches: string[], task: AgentTask): Promise<string> {
    const evaluations: string[] = []

    for (const approach of approaches) {
      const evaluation = this.evaluateApproach(approach, task)
      evaluations.push(`- ${approach}: ${evaluation}`)
    }

    return evaluations.join('\n')
  }

  private evaluateApproach(approach: string, task: AgentTask): string {
    // Simple evaluation based on keywords and task characteristics
    const approachLower = approach.toLowerCase()
    const taskText = `${task.title} ${task.description}`.toLowerCase()

    let score = 0
    let reasons: string[] = []

    // Check alignment with task type
    if (taskText.includes('research') && approachLower.includes('search')) {
      score += 2
      reasons.push('aligns with research needs')
    }

    if (taskText.includes('analysis') && approachLower.includes('analysis')) {
      score += 2
      reasons.push('matches analysis requirements')
    }

    if (taskText.includes('create') && approachLower.includes('build')) {
      score += 2
      reasons.push('supports creation goals')
    }

    // Check for systematic approach
    if (approachLower.includes('systematic') || approachLower.includes('methodology')) {
      score += 1
      reasons.push('provides structured approach')
    }

    // Check for tool usage
    if (approachLower.includes('tool') || approachLower.includes('resource')) {
      score += 1
      reasons.push('leverages available resources')
    }

    const quality = score >= 3 ? 'High' : score >= 2 ? 'Medium' : 'Low'
    return `${quality} (${reasons.join(', ')})`
  }

  private async selectBestApproach(evaluation: string): Promise<string> {
    // Simple selection based on evaluation text
    const lines = evaluation.split('\n')
    const highQualityApproaches = lines.filter(line => line.includes('High'))
    
    if (highQualityApproaches.length > 0) {
      return highQualityApproaches[0].split(':')[0].trim()
    }

    const mediumQualityApproaches = lines.filter(line => line.includes('Medium'))
    if (mediumQualityApproaches.length > 0) {
      return mediumQualityApproaches[0].split(':')[0].trim()
    }

    return lines[0]?.split(':')[0].trim() || 'Systematic approach'
  }

  private async generateSpecificActions(task: AgentTask, approach: string): Promise<string[]> {
    const actions: string[] = []
    const approachLower = approach.toLowerCase()

    if (approachLower.includes('web search')) {
      actions.push('Perform web search using available search tools')
      actions.push('Analyze and filter search results')
      actions.push('Extract relevant information')
    }

    if (approachLower.includes('knowledge base')) {
      actions.push('Query knowledge base for relevant information')
      actions.push('Review and synthesize retrieved data')
    }

    if (approachLower.includes('analysis')) {
      actions.push('Break down the problem into components')
      actions.push('Apply appropriate analysis techniques')
      actions.push('Document findings and insights')
    }

    if (approachLower.includes('create') || approachLower.includes('build')) {
      actions.push('Plan the structure and components')
      actions.push('Implement the solution step by step')
      actions.push('Test and validate the result')
    }

    // Always include these general actions
    actions.push('Monitor progress and adjust approach as needed')
    actions.push('Document the process and results')

    return actions
  }

  private async generateSolutionHypotheses(problem: string, context: any): Promise<string> {
    const hypotheses = [
      'Apply systematic problem-solving methodology',
      'Break down the problem into smaller components',
      'Use available tools and resources effectively',
      'Seek additional information if needed',
      'Iterate and refine the solution',
    ]

    return hypotheses.map((hyp, index) => `${index + 1}. ${hyp}`).join('\n')
  }

  private async evaluateSolutions(solutions: string, problem: string): Promise<string> {
    return 'Evaluating solutions based on feasibility, effectiveness, and resource requirements. ' +
           'Each solution will be assessed for its alignment with the problem requirements and available capabilities.'
  }

  private async generateRecommendation(evaluation: string): Promise<string> {
    return 'Based on the analysis, I recommend proceeding with a systematic approach that breaks down the problem into manageable components and leverages available tools and resources effectively.'
  }

  private async performSelfReflection(chain: AgentReasoningChain): Promise<string> {
    const reflection = [
      'Reviewing the reasoning process for completeness and accuracy',
      'Identifying any potential gaps or biases in the analysis',
      'Considering alternative perspectives that might have been missed',
      'Evaluating the confidence levels assigned to each step',
      'Looking for opportunities to improve future reasoning processes',
    ]

    return reflection.join('\n')
  }

  private calculateOverallConfidence(steps: AgentReasoningStep[]): number {
    if (steps.length === 0) return 0
    
    const totalConfidence = steps.reduce((sum, step) => sum + step.confidence, 0)
    return totalConfidence / steps.length
  }

  // Getters
  getReasoningChain(id: string): AgentReasoningChain | undefined {
    return this.reasoningChains.get(id)
  }

  getAllReasoningChains(): AgentReasoningChain[] {
    return Array.from(this.reasoningChains.values())
  }
}