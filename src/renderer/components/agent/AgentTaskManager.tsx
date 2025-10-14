import React, { useState, useEffect } from 'react'
import { 
  Card, 
  Group, 
  Text, 
  Badge, 
  Button, 
  Stack, 
  TextInput, 
  Textarea, 
  Select, 
  NumberInput, 
  Modal, 
  ActionIcon, 
  Tooltip,
  Progress,
  Timeline,
  Divider
} from '@mantine/core'
import { 
  IconPlus, 
  IconEdit, 
  IconTrash, 
  IconPlay, 
  IconPause, 
  IconCheck, 
  IconX, 
  IconClock,
  IconFlag,
  IconBrain,
  IconTools
} from '@tabler/icons-react'
import { AgentEngine, AgentTask, AgentPlan } from '../../packages/agent'

interface AgentTaskManagerProps {
  agent: AgentEngine
  onTaskUpdate?: (task: AgentTask) => void
  onPlanUpdate?: (plan: AgentPlan) => void
}

export function AgentTaskManager({ agent, onTaskUpdate, onPlanUpdate }: AgentTaskManagerProps) {
  const [tasks, setTasks] = useState<AgentTask[]>([])
  const [plans, setPlans] = useState<AgentPlan[]>([])
  const [selectedTask, setSelectedTask] = useState<AgentTask | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<AgentPlan | null>(null)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false)
  const [isCreatingTask, setIsCreatingTask] = useState(false)
  const [isCreatingPlan, setIsCreatingPlan] = useState(false)

  // Task form state
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as AgentTask['priority'],
    estimatedDuration: 30,
    tags: [] as string[],
  })

  // Plan form state
  const [planForm, setPlanForm] = useState({
    goal: '',
    description: '',
  })

  useEffect(() => {
    loadTasks()
    loadPlans()
  }, [agent])

  const loadTasks = async () => {
    // In a real implementation, this would load tasks from the agent
    setTasks([])
  }

  const loadPlans = async () => {
    // In a real implementation, this would load plans from the agent
    setPlans([])
  }

  const handleCreateTask = async () => {
    if (!taskForm.title.trim()) return

    setIsCreatingTask(true)
    try {
      const newTask: AgentTask = {
        id: `task-${Date.now()}`,
        title: taskForm.title,
        description: taskForm.description,
        status: 'pending',
        priority: taskForm.priority,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        estimatedDuration: taskForm.estimatedDuration,
        tags: taskForm.tags,
      }

      // In a real implementation, this would create the task through the agent
      setTasks(prev => [newTask, ...prev])
      setIsTaskModalOpen(false)
      setTaskForm({ title: '', description: '', priority: 'medium', estimatedDuration: 30, tags: [] })
    } catch (error) {
      console.error('Failed to create task:', error)
    } finally {
      setIsCreatingTask(false)
    }
  }

  const handleCreatePlan = async () => {
    if (!planForm.goal.trim()) return

    setIsCreatingPlan(true)
    try {
      const newPlan: AgentPlan = {
        id: `plan-${Date.now()}`,
        goal: planForm.goal,
        description: planForm.description,
        status: 'draft',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tasks: [],
      }

      // In a real implementation, this would create the plan through the agent
      setPlans(prev => [newPlan, ...prev])
      setIsPlanModalOpen(false)
      setPlanForm({ goal: '', description: '' })
    } catch (error) {
      console.error('Failed to create plan:', error)
    } finally {
      setIsCreatingPlan(false)
    }
  }

  const handleExecuteTask = async (task: AgentTask) => {
    try {
      await agent.executeTask(task)
      onTaskUpdate?.(task)
    } catch (error) {
      console.error('Failed to execute task:', error)
    }
  }

  const handleExecutePlan = async (plan: AgentPlan) => {
    try {
      await agent.executePlan(plan.id)
      onPlanUpdate?.(plan)
    } catch (error) {
      console.error('Failed to execute plan:', error)
    }
  }

  const getPriorityColor = (priority: AgentTask['priority']) => {
    switch (priority) {
      case 'critical': return 'red'
      case 'high': return 'orange'
      case 'medium': return 'blue'
      case 'low': return 'gray'
      default: return 'gray'
    }
  }

  const getStatusColor = (status: AgentTask['status']) => {
    switch (status) {
      case 'pending': return 'gray'
      case 'in_progress': return 'blue'
      case 'completed': return 'green'
      case 'failed': return 'red'
      case 'cancelled': return 'gray'
      default: return 'gray'
    }
  }

  const getStatusIcon = (status: AgentTask['status']) => {
    switch (status) {
      case 'pending': return <IconClock size={16} />
      case 'in_progress': return <IconPlay size={16} />
      case 'completed': return <IconCheck size={16} />
      case 'failed': return <IconX size={16} />
      case 'cancelled': return <IconPause size={16} />
      default: return <IconClock size={16} />
    }
  }

  return (
    <Stack spacing="md">
      {/* Header */}
      <Card>
        <Group position="apart">
          <div>
            <Text size="lg" weight={600}>Task & Plan Management</Text>
            <Text size="sm" color="dimmed">Manage agent tasks and execution plans</Text>
          </div>
          <Group>
            <Button
              leftIcon={<IconPlus size={16} />}
              onClick={() => setIsTaskModalOpen(true)}
            >
              New Task
            </Button>
            <Button
              leftIcon={<IconBrain size={16} />}
              variant="outline"
              onClick={() => setIsPlanModalOpen(true)}
            >
              New Plan
            </Button>
          </Group>
        </Group>
      </Card>

      {/* Tasks */}
      <Card>
        <Text size="lg" weight={600} mb="md">Tasks</Text>
        <Stack spacing="sm">
          {tasks.length === 0 ? (
            <Text size="sm" color="dimmed">No tasks available</Text>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                style={{
                  padding: '12px',
                  border: '1px solid #e9ecef',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
                onClick={() => setSelectedTask(task)}
              >
                <Group position="apart">
                  <div style={{ flex: 1 }}>
                    <Group spacing="xs" mb="xs">
                      <Text size="sm" weight={600}>{task.title}</Text>
                      <Badge
                        size="sm"
                        color={getPriorityColor(task.priority)}
                        leftSection={<IconFlag size={12} />}
                      >
                        {task.priority}
                      </Badge>
                      <Badge
                        size="sm"
                        color={getStatusColor(task.status)}
                        leftSection={getStatusIcon(task.status)}
                      >
                        {task.status}
                      </Badge>
                    </Group>
                    <Text size="xs" color="dimmed" mb="xs">{task.description}</Text>
                    <Group spacing="xs">
                      {task.estimatedDuration && (
                        <Badge size="xs" variant="outline" leftSection={<IconClock size={10} />}>
                          {task.estimatedDuration}m
                        </Badge>
                      )}
                      {task.tags?.map((tag) => (
                        <Badge key={tag} size="xs" variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </Group>
                  </div>
                  <Group spacing="xs">
                    {task.status === 'pending' && (
                      <Tooltip label="Execute Task">
                        <ActionIcon
                          color="green"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleExecuteTask(task)
                          }}
                        >
                          <IconPlay size={16} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                    <Tooltip label="Edit Task">
                      <ActionIcon
                        color="blue"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedTask(task)
                        }}
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Delete Task">
                      <ActionIcon
                        color="red"
                        onClick={(e) => {
                          e.stopPropagation()
                          setTasks(prev => prev.filter(t => t.id !== task.id))
                        }}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Group>
              </div>
            ))
          )}
        </Stack>
      </Card>

      {/* Plans */}
      <Card>
        <Text size="lg" weight={600} mb="md">Plans</Text>
        <Stack spacing="sm">
          {plans.length === 0 ? (
            <Text size="sm" color="dimmed">No plans available</Text>
          ) : (
            plans.map((plan) => (
              <div
                key={plan.id}
                style={{
                  padding: '12px',
                  border: '1px solid #e9ecef',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
                onClick={() => setSelectedPlan(plan)}
              >
                <Group position="apart">
                  <div style={{ flex: 1 }}>
                    <Group spacing="xs" mb="xs">
                      <Text size="sm" weight={600}>{plan.goal}</Text>
                      <Badge
                        size="sm"
                        color={plan.status === 'active' ? 'green' : 'blue'}
                      >
                        {plan.status}
                      </Badge>
                    </Group>
                    <Text size="xs" color="dimmed" mb="xs">{plan.description}</Text>
                    <Group spacing="xs">
                      <Badge size="xs" variant="outline">
                        {plan.tasks.length} tasks
                      </Badge>
                      {plan.estimatedTotalDuration && (
                        <Badge size="xs" variant="outline" leftSection={<IconClock size={10} />}>
                          {Math.round(plan.estimatedTotalDuration / 60)}m
                        </Badge>
                      )}
                    </Group>
                  </div>
                  <Group spacing="xs">
                    {plan.status === 'draft' && (
                      <Tooltip label="Execute Plan">
                        <ActionIcon
                          color="green"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleExecutePlan(plan)
                          }}
                        >
                          <IconPlay size={16} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                    <Tooltip label="Edit Plan">
                      <ActionIcon
                        color="blue"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedPlan(plan)
                        }}
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Delete Plan">
                      <ActionIcon
                        color="red"
                        onClick={(e) => {
                          e.stopPropagation()
                          setPlans(prev => prev.filter(p => p.id !== plan.id))
                        }}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Group>
              </div>
            ))
          )}
        </Stack>
      </Card>

      {/* Task Modal */}
      <Modal
        opened={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="Create New Task"
        size="md"
      >
        <Stack spacing="md">
          <TextInput
            label="Task Title"
            placeholder="Enter task title"
            value={taskForm.title}
            onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
            required
          />
          <Textarea
            label="Description"
            placeholder="Enter task description"
            value={taskForm.description}
            onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
            minRows={3}
          />
          <Group grow>
            <Select
              label="Priority"
              data={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'critical', label: 'Critical' },
              ]}
              value={taskForm.priority}
              onChange={(value) => setTaskForm(prev => ({ ...prev, priority: value as AgentTask['priority'] }))}
            />
            <NumberInput
              label="Estimated Duration (minutes)"
              value={taskForm.estimatedDuration}
              onChange={(value) => setTaskForm(prev => ({ ...prev, estimatedDuration: value || 30 }))}
              min={1}
              max={1440}
            />
          </Group>
          <Group position="right">
            <Button variant="outline" onClick={() => setIsTaskModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateTask}
              loading={isCreatingTask}
              disabled={!taskForm.title.trim()}
            >
              Create Task
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Plan Modal */}
      <Modal
        opened={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        title="Create New Plan"
        size="md"
      >
        <Stack spacing="md">
          <TextInput
            label="Plan Goal"
            placeholder="Enter plan goal"
            value={planForm.goal}
            onChange={(e) => setPlanForm(prev => ({ ...prev, goal: e.target.value }))}
            required
          />
          <Textarea
            label="Description"
            placeholder="Enter plan description"
            value={planForm.description}
            onChange={(e) => setPlanForm(prev => ({ ...prev, description: e.target.value }))}
            minRows={3}
          />
          <Group position="right">
            <Button variant="outline" onClick={() => setIsPlanModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreatePlan}
              loading={isCreatingPlan}
              disabled={!planForm.goal.trim()}
            >
              Create Plan
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}