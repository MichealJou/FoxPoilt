import type { ReactNode } from 'react'

import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Flex,
  List,
  Progress,
  Row,
  Space,
  Table,
  Tag,
  Timeline,
  Typography,
} from 'antd'
import { ArrowRight, ChevronRight } from 'lucide-react'

import type { DesktopPageId } from '@desktop/lib/desktop-pages.js'
import type { getDesktopViewModel } from '@desktop/lib/mock-data.js'
import type { DesktopRuntimeStatus } from '@desktop/lib/tauri-status.js'

const { Paragraph, Text } = Typography

type DesktopViewModel = ReturnType<typeof getDesktopViewModel>

function statusColor(status: string) {
  if (status === 'ready' || status === 'success') {
    return 'success'
  }

  if (status === 'degraded' || status === 'queued' || status === 'warning') {
    return 'warning'
  }

  if (status === 'unavailable' || status === 'danger') {
    return 'error'
  }

  if (status === 'running' || status === 'analyzing' || status === 'implementing') {
    return 'processing'
  }

  return 'default'
}

function issueStatus(severity: string): 'error' | 'warning' | 'info' {
  if (severity === 'danger') {
    return 'error'
  }

  if (severity === 'warning') {
    return 'warning'
  }

  return 'info'
}

function Panel({
  description,
  extra,
  title,
  children,
  className,
}: {
  description?: string
  extra?: ReactNode
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <Card
      className={className ? `foxpilot-panel ${className}` : 'foxpilot-panel'}
      title={
        <div className="foxpilot-panel-heading">
          <div className="foxpilot-panel-title">{title}</div>
          {description ? <div className="foxpilot-panel-description">{description}</div> : null}
        </div>
      }
      extra={extra}
      styles={{
        header: { padding: '16px 18px 0', minHeight: 0, borderBottom: 'none' },
        body: { padding: '16px 18px 18px' },
      }}
    >
      {children}
    </Card>
  )
}

export function PageContent({
  page,
  runtimeStatus,
  viewModel,
}: {
  page: DesktopPageId
  runtimeStatus?: DesktopRuntimeStatus
  viewModel: DesktopViewModel
}) {
  const platformRegistry = viewModel.controlPlane.registries[0]?.items ?? []
  const taskRows = viewModel.tasks.rows
  const taskCounts = {
    active: taskRows.filter((item) => item.status === 'analyzing' || item.status === 'implementing')
      .length,
    blocked: taskRows.filter((item) => item.status === 'awaiting_plan_confirm').length,
    queued: taskRows.filter((item) => item.status === 'todo').length,
  }

  switch (page) {
    case 'dashboard':
      return (
        <Flex vertical gap={12}>
          <Row gutter={[12, 12]}>
            {viewModel.dashboardStats.map((stat) => (
              <Col key={stat.label} xs={24} md={12} xl={6}>
                <Panel className="foxpilot-panel-stat" title={stat.label}>
                  <div className="foxpilot-stat-value">{stat.value}</div>
                  <Text className="foxpilot-subtle-text">{stat.delta}</Text>
                </Panel>
              </Col>
            ))}
          </Row>

          <Row gutter={[12, 12]}>
            <Col xs={24} xl={15}>
              <Panel
                title={viewModel.focusQueueTitle}
                description={viewModel.focusQueueDescription}
                extra={<Text className="foxpilot-subtle-text">{viewModel.focusQueue.length}</Text>}
              >
                <Table
                  size="small"
                  pagination={false}
                  rowKey="title"
                  className="foxpilot-flat-table"
                  columns={[
                    {
                      title: 'Priority',
                      dataIndex: 'priority',
                      key: 'priority',
                      width: 96,
                      render: (value: string) => (
                        <Tag bordered={false} color={value === 'P0' ? 'error' : 'warning'}>
                          {value}
                        </Tag>
                      ),
                    },
                    {
                      title: 'Title',
                      dataIndex: 'title',
                      key: 'title',
                      render: (value: string) => <Text strong>{value}</Text>,
                    },
                    { title: 'Stage', dataIndex: 'stage', key: 'stage', width: 120 },
                    { title: 'Platform', dataIndex: 'platform', key: 'platform', width: 140 },
                  ]}
                  dataSource={viewModel.focusQueue}
                />
              </Panel>
            </Col>

            <Col xs={24} xl={9}>
              <Flex vertical gap={12}>
                <Panel title={viewModel.anomalyTitle} description={viewModel.anomalyDescription}>
                  <Flex vertical gap={10}>
                    {viewModel.healthIssues.map((issue) => (
                      <Alert
                        key={issue.title}
                        message={issue.title}
                        description={issue.detail}
                        type={issueStatus(issue.severity)}
                        showIcon
                        className="foxpilot-flat-alert"
                      />
                    ))}
                  </Flex>
                </Panel>

                <Panel title="平台概览" description="当前平台接入与健康状态。">
                  <List
                    split={false}
                    dataSource={platformRegistry}
                    renderItem={(item) => (
                      <List.Item className="foxpilot-list-row">
                        <List.Item.Meta title={item.name} description={item.detail} />
                        <Tag bordered={false} color={statusColor(item.status)}>
                          {item.status}
                        </Tag>
                      </List.Item>
                    )}
                  />
                </Panel>
              </Flex>
            </Col>
          </Row>
        </Flex>
      )

    case 'workspace':
      return (
        <Row gutter={[12, 12]}>
          <Col xs={24} xl={11}>
            <Panel title={viewModel.workspace.title} description={viewModel.workspace.description}>
              <Descriptions column={1} size="small" className="foxpilot-flat-descriptions">
                <Descriptions.Item label={viewModel.workspace.fieldRoot}>
                  <Text code>{viewModel.workspace.root}</Text>
                </Descriptions.Item>
                <Descriptions.Item label={viewModel.workspace.fieldProfile}>
                  {viewModel.workspace.profile}
                </Descriptions.Item>
                <Descriptions.Item label={viewModel.workspace.fieldExecutor}>
                  {viewModel.workspace.executorStrategy}
                </Descriptions.Item>
                <Descriptions.Item label={viewModel.workspace.fieldRepositories}>
                  {viewModel.workspace.repositories}
                </Descriptions.Item>
              </Descriptions>
            </Panel>
          </Col>

          <Col xs={24} xl={13}>
            <Flex vertical gap={12}>
              <Panel
                title={viewModel.workspace.scanTitle}
                description={viewModel.workspace.scanDescription}
              >
                <Flex wrap gap={8}>
                  {viewModel.workspace.scanSignals.map((signal) => (
                    <Tag key={signal} bordered={false} className="foxpilot-inline-tag">
                      {signal}
                    </Tag>
                  ))}
                </Flex>
              </Panel>

              <Panel title="建议动作" description="先把项目接管和执行策略确认清楚。">
                <Flex vertical gap={10}>
                  {['重新扫描当前工作区', '预览 Profile 推荐结果', '打开 project.json'].map(
                    (action) => (
                      <Button key={action} block className="foxpilot-flat-action">
                        <span>{action}</span>
                        <ChevronRight className="size-4" />
                      </Button>
                    ),
                  )}
                </Flex>
              </Panel>
            </Flex>
          </Col>
        </Row>
      )

    case 'tasks':
      return (
        <Row gutter={[12, 12]}>
          <Col xs={24} xl={17}>
            <Panel title={viewModel.tasks.title} description={viewModel.tasks.description}>
              <Table
                pagination={false}
                rowKey="title"
                className="foxpilot-flat-table"
                columns={[
                  {
                    title: viewModel.tasks.headers[0],
                    dataIndex: 'title',
                    key: 'title',
                    render: (value: string) => <Text strong>{value}</Text>,
                  },
                  {
                    title: viewModel.tasks.headers[1],
                    dataIndex: 'source',
                    key: 'source',
                    width: 108,
                  },
                  {
                    title: viewModel.tasks.headers[2],
                    dataIndex: 'status',
                    key: 'status',
                    width: 168,
                    render: (value: string) => (
                      <Tag bordered={false} color={statusColor(value)}>
                        {value}
                      </Tag>
                    ),
                  },
                  {
                    title: viewModel.tasks.headers[3],
                    dataIndex: 'owner',
                    key: 'owner',
                    width: 152,
                  },
                  {
                    title: viewModel.tasks.headers[4],
                    dataIndex: 'priority',
                    key: 'priority',
                    width: 92,
                    render: (value: string) => (
                      <Tag
                        bordered={false}
                        color={value === 'P0' ? 'error' : value === 'P1' ? 'warning' : 'default'}
                      >
                        {value}
                      </Tag>
                    ),
                  },
                ]}
                dataSource={taskRows}
              />
            </Panel>
          </Col>

          <Col xs={24} xl={7}>
            <Flex vertical gap={12}>
              <Panel title="任务摘要" description="按当前状态压缩成三个判断入口。">
                <Flex vertical gap={14}>
                  <div>
                    <div className="foxpilot-metric-label">活跃任务</div>
                    <div className="foxpilot-metric-value">{taskCounts.active}</div>
                  </div>
                  <div>
                    <div className="foxpilot-metric-label">待确认</div>
                    <div className="foxpilot-metric-value">{taskCounts.blocked}</div>
                  </div>
                  <div>
                    <div className="foxpilot-metric-label">排队中</div>
                    <div className="foxpilot-metric-value">{taskCounts.queued}</div>
                  </div>
                </Flex>
              </Panel>

              <Panel title="任务流动" description="当前优先级分配。">
                <Progress
                  percent={72}
                  showInfo={false}
                  strokeColor="#88b7ff"
                  trailColor="rgba(255,255,255,0.08)"
                />
                <Paragraph className="!mb-0 !mt-3 foxpilot-subtle-text">
                  {'重点任务主要集中在 design -> implement 两段。'}
                </Paragraph>
              </Panel>
            </Flex>
          </Col>
        </Row>
      )

    case 'runs':
      return (
        <Row gutter={[12, 12]}>
          <Col xs={24} xl={15}>
            <Panel title={viewModel.runs.title} description={viewModel.runs.description}>
              <Timeline
                items={viewModel.runs.timeline.map((item, index) => ({
                  color:
                    item.status === 'success'
                      ? 'green'
                      : item.status === 'queued'
                        ? 'orange'
                        : item.status === 'running'
                          ? 'blue'
                          : 'gray',
                  children: (
                    <Flex align="center" justify="space-between" gap={16}>
                      <div>
                        <Text strong>{item.stage}</Text>
                        <br />
                        <Text className="foxpilot-subtle-text">
                          {item.role} · {item.platform}
                        </Text>
                      </div>
                      <Space>
                        <Tag bordered={false} color={statusColor(item.status)}>
                          {item.status}
                        </Tag>
                        {index < viewModel.runs.timeline.length - 1 ? (
                          <ArrowRight className="size-4 text-[color:var(--color-muted-foreground)]" />
                        ) : null}
                      </Space>
                    </Flex>
                  ),
                }))}
              />
            </Panel>
          </Col>

          <Col xs={24} xl={9}>
            <Flex vertical gap={12}>
              <Panel title="当前交接" description="本轮最关键的阶段 handoff。">
                <List
                  split={false}
                  dataSource={viewModel.runs.timeline.slice(0, 3)}
                  renderItem={(item) => (
                    <List.Item className="foxpilot-list-row">
                      <List.Item.Meta
                        title={item.stage}
                        description={`${item.role} -> ${item.platform}`}
                      />
                      <Tag bordered={false} color={statusColor(item.status)}>
                        {item.status}
                      </Tag>
                    </List.Item>
                  )}
                />
              </Panel>

              <Panel title="建议下一步" description="优先把验证和修复入口衔接好。">
                <Flex vertical gap={10}>
                  {['打开运行详情', '查看阶段交接', '导出执行摘要'].map((action) => (
                    <Button key={action} block className="foxpilot-flat-action">
                      <span>{action}</span>
                      <ChevronRight className="size-4" />
                    </Button>
                  ))}
                </Flex>
              </Panel>
            </Flex>
          </Col>
        </Row>
      )

    case 'events':
      return (
        <Flex vertical gap={12}>
          <Row gutter={[12, 12]}>
            {viewModel.events.groups.map((group) => (
              <Col key={group.title} xs={24} lg={8}>
                <Panel className="foxpilot-panel-stat" title={group.title}>
                  <div className="foxpilot-stat-value">{group.count}</div>
                  <Paragraph className="!mb-0 foxpilot-subtle-text">{group.detail}</Paragraph>
                </Panel>
              </Col>
            ))}
          </Row>

          <Panel title="最近事件趋势" description="事件按来源聚合后直接显示判断结论。">
            <List
              split={false}
              dataSource={viewModel.events.groups}
              renderItem={(group) => (
                <List.Item className="foxpilot-list-row">
                  <List.Item.Meta title={group.title} description={group.detail} />
                  <Tag bordered={false} className="foxpilot-inline-tag">
                    {group.count}
                  </Tag>
                </List.Item>
              )}
            />
          </Panel>
        </Flex>
      )

    case 'control-plane':
      return (
        <Row gutter={[12, 12]}>
          {viewModel.controlPlane.registries.map((registry) => (
            <Col key={registry.title} xs={24} xl={8}>
              <Panel title={registry.title} description={registry.description}>
                <List
                  split={false}
                  dataSource={registry.items}
                  renderItem={(item) => (
                    <List.Item className="foxpilot-list-row">
                      <List.Item.Meta title={item.name} description={item.detail} />
                      <Tag bordered={false} color={statusColor(item.status)}>
                        {item.status}
                      </Tag>
                    </List.Item>
                  )}
                />
              </Panel>
            </Col>
          ))}
        </Row>
      )

    case 'health':
      return (
        <Row gutter={[12, 12]}>
          <Col xs={24} xl={14}>
            <Panel title={viewModel.health.title} description={viewModel.health.description}>
              <Flex vertical gap={10}>
                {viewModel.healthIssues.map((issue) => (
                  <Alert
                    key={issue.title}
                    message={issue.title}
                    description={issue.detail}
                    type={issueStatus(issue.severity)}
                    showIcon
                    className="foxpilot-flat-alert"
                  />
                ))}
              </Flex>
            </Panel>
          </Col>

          <Col xs={24} xl={10}>
            <Flex vertical gap={12}>
              <Panel
                title={viewModel.health.runtimeLabel}
                description={viewModel.health.runtimeDescription}
              >
                <Space wrap>
                  <Tag
                    bordered={false}
                    color={runtimeStatus?.shell === 'tauri' ? 'success' : 'default'}
                  >
                    {runtimeStatus?.shell === 'tauri' ? 'Tauri' : 'Web Preview'}
                  </Tag>
                  <Tag bordered={false} className="foxpilot-inline-tag">
                    {runtimeStatus?.runtime ?? 'shared-runtime-core'}
                  </Tag>
                </Space>
                <Paragraph className="!mb-0 !mt-3 foxpilot-subtle-text">
                  {viewModel.health.appearanceDescription}
                </Paragraph>
              </Panel>

              <Panel
                title={viewModel.health.suggestedActionsTitle}
                description={viewModel.health.suggestedActionsDescription}
              >
                <Flex vertical gap={10}>
                  {viewModel.health.suggestedActions.map((action) => (
                    <Button key={action} block className="foxpilot-flat-action">
                      <span>{action}</span>
                      <ChevronRight className="size-4" />
                    </Button>
                  ))}
                </Flex>
              </Panel>
            </Flex>
          </Col>
        </Row>
      )
  }
}
