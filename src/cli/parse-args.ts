export type CliArgs = {
  command?: string
  subcommand?: string
  help: boolean
  path?: string
  name?: string
  workspaceRoot?: string
  mode: 'interactive' | 'non-interactive'
  noScan: boolean
  title?: string
  description?: string
  priority: 'P0' | 'P1' | 'P2' | 'P3'
  taskType: 'generic' | 'frontend' | 'backend' | 'cross_repo' | 'docs' | 'init'
  repository?: string
  status?: 'todo' | 'analyzing' | 'awaiting_plan_confirm' | 'executing' | 'awaiting_result_confirm' | 'done' | 'blocked' | 'cancelled'
  id?: string
}

export function parseArgs(argv: string[]): CliArgs {
  const [command] = argv
  const subcommand = command === 'task' ? argv[1] : undefined
  const rest = command === 'task' ? argv.slice(2) : argv.slice(1)
  let path: string | undefined
  let name: string | undefined
  let workspaceRoot: string | undefined
  let mode: 'interactive' | 'non-interactive' = 'interactive'
  let noScan = false
  let title: string | undefined
  let description: string | undefined
  let priority: 'P0' | 'P1' | 'P2' | 'P3' = 'P2'
  let taskType: 'generic' | 'frontend' | 'backend' | 'cross_repo' | 'docs' | 'init' = 'generic'
  let repository: string | undefined
  let id: string | undefined
  let status:
    | 'todo'
    | 'analyzing'
    | 'awaiting_plan_confirm'
    | 'executing'
    | 'awaiting_result_confirm'
    | 'done'
    | 'blocked'
    | 'cancelled'
    | undefined

  for (let index = 0; index < rest.length; index += 1) {
    const value = rest[index]

    if (value === '--path') {
      path = rest[index + 1]
      index += 1
      continue
    }

    if (value === '--name') {
      name = rest[index + 1]
      index += 1
      continue
    }

    if (value === '--title') {
      title = rest[index + 1]
      index += 1
      continue
    }

    if (value === '--description') {
      description = rest[index + 1]
      index += 1
      continue
    }

    if (value === '--workspace-root') {
      workspaceRoot = rest[index + 1]
      index += 1
      continue
    }

    if (value === '--mode') {
      const nextValue = rest[index + 1]
      if (nextValue === 'interactive' || nextValue === 'non-interactive') {
        mode = nextValue
      }
      index += 1
      continue
    }

    if (value === '--no-scan') {
      noScan = true
    }

    if (value === '--priority') {
      const nextValue = rest[index + 1]
      if (nextValue === 'P0' || nextValue === 'P1' || nextValue === 'P2' || nextValue === 'P3') {
        priority = nextValue
      }
      index += 1
      continue
    }

    if (value === '--task-type') {
      const nextValue = rest[index + 1]
      if (
        nextValue === 'generic' ||
        nextValue === 'frontend' ||
        nextValue === 'backend' ||
        nextValue === 'cross_repo' ||
        nextValue === 'docs' ||
        nextValue === 'init'
      ) {
        taskType = nextValue
      }
      index += 1
      continue
    }

    if (value === '--repository') {
      repository = rest[index + 1]
      index += 1
      continue
    }

    if (value === '--id') {
      id = rest[index + 1]
      index += 1
      continue
    }

    if (value === '--status') {
      const nextValue = rest[index + 1]
      if (
        nextValue === 'todo' ||
        nextValue === 'analyzing' ||
        nextValue === 'awaiting_plan_confirm' ||
        nextValue === 'executing' ||
        nextValue === 'awaiting_result_confirm' ||
        nextValue === 'done' ||
        nextValue === 'blocked' ||
        nextValue === 'cancelled'
      ) {
        status = nextValue
      }
      index += 1
    }
  }

  return {
    command,
    subcommand,
    help: rest.includes('--help') || rest.includes('-h'),
    path,
    name,
    workspaceRoot,
    mode,
    noScan,
    title,
    description,
    priority,
    taskType,
    repository,
    status,
    id,
  }
}
