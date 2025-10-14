import React, { useState, useEffect } from 'react'
import { Card, Grid, Group, Text, Badge, Progress, Button, Tabs, Stack, ActionIcon, Tooltip } from '@mantine/core'
import { IconBrain, IconTasks, IconMemory, IconTools, IconWorkflow, IconUsers, IconSettings, IconPlay, IconPause, IconRefresh } from '@tabler/icons-react'
import { AgentEngine, AgentState, AgentTask, AgentPlan, AgentMemory } from '../../packages/agent'

interface AgentDashboardProps {
  agent: AgentEngine
  onTaskClick?: (task: AgentTask) => void
  onPlanClick?: (plan: AgentPlan) => void
  onMemoryClick?: (memory: AgentMemory) => void
}

export function AgentDashboard({ agent, onTaskClick, onPlanClick, onMemoryClick }: AgentDashboardProps) {
  const [agentState, setAgentState] = useState<AgentState | null>(null)
  const [activeTab, setActiveTab] = useState<string>('overview')
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    const updateState = () => {
      setAgentState(agent.getState())
    }

    updateState()
    const interval = setInterval(updateState, 1000)

    return () => clearInterval(interval)
  }, [agent])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setAgentState(agent.getState())
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle': return 'blue'
      case 'thinking': return 'yellow'
      case 'acting': return 'green'
      case 'learning': return 'purple'
      case 'error': return 'red'
      default: return 'gray'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'idle': return <IconPause size={16} />
      case 'thinking': return <IconBrain size={16} />
      case 'acting': return <IconPlay size={16} />
      case 'learning': return <IconMemory size={16} />
      case 'error': return <IconSettings size={16} />
      default: return <IconRefresh size={16} />
    }
  }

  if (!agentState) {
    return (
      <Card>
        <Text>Loading agent state...</Text>
      </Card>
    )
  }

  return (
    <Stack spacing="md">
      {/* Header */}
      <Card>
        <Group position="apart">
          <Group>
            <IconBrain size={24} />
            <div>
              <Text size="lg" weight={600}>{agentState.name}</Text>
              <Text size="sm" color="dimmed">{agentState.description}</Text>
            </div>
          </Group>
          <Group>
            <Badge color={getStatusColor(agentState.status)} leftSection={getStatusIcon(agentState.status)}>
              {agentState.status.toUpperCase()}
            </Badge>
            <Tooltip label="Refresh">
              <ActionIcon loading={isRefreshing} onClick={handleRefresh}>
                <IconRefresh size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onTabChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="overview" icon={<IconBrain size={16} />}>Overview</Tabs.Tab>
          <Tabs.Tab value="tasks" icon={<IconTasks size={16} />}>Tasks</Tabs.Tab>
          <Tabs.Tab value="plans" icon={<IconWorkflow size={16} />}>Plans</Tabs.Tab>
          <Tabs.Tab value="memory" icon={<IconMemory size={16} />}>Memory</Tabs.Tab>
          <Tabs.Tab value="tools" icon={<IconTools size={16} />}>Tools</Tabs.Tab>
          <Tabs.Tab value="collaboration" icon={<IconUsers size={16} />}>Collaboration</Tabs.Tab>
        </Tabs.List>

        {/* Overview Tab */}
        <Tabs.Panel value="overview" pt="md">
          <Grid>
            <Grid.Col span={6}>
              <Card>
                <Text size="lg" weight={600} mb="md">Performance Metrics</Text>
                <Stack spacing="sm">
                  <div>
                    <Group position="apart">
                      <Text size="sm">Tasks Completed</Text>
                      <Text size="sm" weight={600}>{agentState.performance.tasksCompleted}</Text>
                    </Group>
                  </div>
                  <div>
                    <Group position="apart">
                      <Text size="sm">Success Rate</Text>
                      <Text size="sm" weight={600}>{(agentState.performance.successRate * 100).toFixed(1)}%</Text>
                    </Group>
                    <Progress value={agentState.performance.successRate * 100} size="sm" mt="xs" />
                  </div>
                  <div>
                    <Group position="apart">
                      <Text size="sm">Avg. Task Duration</Text>
                      <Text size="sm" weight={600}>{Math.round(agentState.performance.averageTaskDuration / 1000)}s</Text>
                    </Group>
                  </div>
                  <div>
                    <Group position="apart">
                      <Text size="sm">Learning Progress</Text>
                      <Text size="sm" weight={600}>{(agentState.performance.learningProgress * 100).toFixed(1)}%</Text>
                    </Group>
                    <Progress value={agentState.performance.learningProgress * 100} size="sm" mt="xs" />
                  </div>
                </Stack>
              </Card>
            </Grid.Col>

            <Grid.Col span={6}>
              <Card>
                <Text size="lg" weight={600} mb="md">Current Activity</Text>
                <Stack spacing="sm">
                  {agentState.currentTask && (
                    <div>
                      <Text size="sm" weight={600}>Current Task</Text>
                      <Text size="sm" color="dimmed">{agentState.currentTask.title}</Text>
                      <Badge size="sm" color="blue" mt="xs">
                        {agentState.currentTask.status}
                      </Badge>
                    </div>
                  )}
                  {agentState.currentPlan && (
                    <div>
                      <Text size="sm" weight={600}>Current Plan</Text>
                      <Text size="sm" color="dimmed">{agentState.currentPlan.goal}</Text>
                      <Badge size="sm" color="green" mt="xs">
                        {agentState.currentPlan.status}
                      </Badge>
                    </div>
                  )}
                  {!agentState.currentTask && !agentState.currentPlan && (
                    <Text size="sm" color="dimmed">No active tasks or plans</Text>
                  )}
                </Stack>
              </Card>
            </Grid.Col>

            <Grid.Col span={12}>
              <Card>
                <Text size="lg" weight={600} mb="md">Capabilities</Text>
                <Group spacing="sm">
                  {agentState.capabilities.map((capability) => (
                    <Badge
                      key={capability.name}
                      color={capability.enabled ? 'green' : 'gray'}
                      variant={capability.enabled ? 'filled' : 'outline'}
                    >
                      {capability.name} ({capability.level})
                    </Badge>
                  ))}
                </Group>
              </Card>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        {/* Tasks Tab */}
        <Tabs.Panel value="tasks" pt="md">
          <Card>
            <Text size="lg" weight={600} mb="md">Recent Tasks</Text>
            <Stack spacing="sm">
              {agentState.currentTask ? (
                <div
                  style={{ cursor: 'pointer', padding: '8px', border: '1px solid #e9ecef', borderRadius: '4px' }}
                  onClick={() => onTaskClick?.(agentState.currentTask!)}
                >
                  <Group position="apart">
                    <div>
                      <Text size="sm" weight={600}>{agentState.currentTask.title}</Text>
                      <Text size="xs" color="dimmed">{agentState.currentTask.description}</Text>
                    </div>
                    <Badge color="blue" size="sm">{agentState.currentTask.status}</Badge>
                  </Group>
                </div>
              ) : (
                <Text size="sm" color="dimmed">No active tasks</Text>
              )}
            </Stack>
          </Card>
        </Tabs.Panel>

        {/* Plans Tab */}
        <Tabs.Panel value="plans" pt="md">
          <Card>
            <Text size="lg" weight={600} mb="md">Active Plans</Text>
            <Stack spacing="sm">
              {agentState.currentPlan ? (
                <div
                  style={{ cursor: 'pointer', padding: '8px', border: '1px solid #e9ecef', borderRadius: '4px' }}
                  onClick={() => onPlanClick?.(agentState.currentPlan!)}
                >
                  <Group position="apart">
                    <div>
                      <Text size="sm" weight={600}>{agentState.currentPlan.goal}</Text>
                      <Text size="xs" color="dimmed">{agentState.currentPlan.description}</Text>
                    </div>
                    <Badge color="green" size="sm">{agentState.currentPlan.status}</Badge>
                  </Group>
                </div>
              ) : (
                <Text size="sm" color="dimmed">No active plans</Text>
              )}
            </Stack>
          </Card>
        </Tabs.Panel>

        {/* Memory Tab */}
        <Tabs.Panel value="memory" pt="md">
          <Card>
            <Text size="lg" weight={600} mb="md">Memory System</Text>
            <Stack spacing="sm">
              <Group position="apart">
                <Text size="sm">Total Memories</Text>
                <Text size="sm" weight={600}>{agentState.memories.length}</Text>
              </Group>
              <Group position="apart">
                <Text size="sm">Memory Types</Text>
                <Group spacing="xs">
                  {['fact', 'experience', 'preference', 'skill', 'context'].map(type => {
                    const count = agentState.memories.filter(m => m.type === type).length
                    return (
                      <Badge key={type} size="sm" variant="outline">
                        {type}: {count}
                      </Badge>
                    )
                  })}
                </Group>
              </Group>
            </Stack>
          </Card>
        </Tabs.Panel>

        {/* Tools Tab */}
        <Tabs.Panel value="tools" pt="md">
          <Card>
            <Text size="lg" weight={600} mb="md">Available Tools</Text>
            <Group spacing="sm">
              {agent.getCapabilities().map((capability) => (
                <Badge
                  key={capability.name}
                  color={capability.enabled ? 'blue' : 'gray'}
                  variant={capability.enabled ? 'filled' : 'outline'}
                >
                  {capability.name}
                </Badge>
              ))}
            </Group>
          </Card>
        </Tabs.Panel>

        {/* Collaboration Tab */}
        <Tabs.Panel value="collaboration" pt="md">
          <Card>
            <Text size="lg" weight={600} mb="md">Collaboration</Text>
            <Text size="sm" color="dimmed">Collaboration features coming soon...</Text>
          </Card>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  )
}