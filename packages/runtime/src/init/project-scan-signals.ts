/**
 * @file src/runtime/init/project-scan-signals.ts
 * @author michaeljou
 */

import { access, readFile } from 'node:fs/promises'
import path from 'node:path'

import { resolveProjectConfigPath } from '@infra/core/paths.js'
import type { ProjectRepositoryConfig } from '@infra/project/project-config.js'

export type ProjectScanSignals = {
  projectPath: string
  repositoryCount: number
  structure: {
    repositoryLayout: 'single-repo' | 'multi-repo' | 'docs-heavy' | 'mixed'
    hasMonorepoMarkers: boolean
    hasNestedRepositories: boolean
    keyPaths: string[]
  }
  stack: {
    languages: string[]
    packageManagers: string[]
    runtimeHints: string[]
    frameworkHints: string[]
  }
  workflow: {
    hasTests: boolean
    hasDocsEmphasis: boolean
    hasCiConfig: boolean
    likelyProjectType: 'standard-software' | 'fast-bugfix' | 'docs-heavy' | 'mixed'
  }
  health: {
    missingProjectConfig: boolean
    missingFoundation: boolean
    missingRecommendedBindings: string[]
    brokenRepositoryRefs: string[]
  }
  integrations: {
    hasBeads: boolean
    hasSuperpowers: boolean
    hasPlatforms: string[]
    hasSkills: string[]
    hasMcpServers: string[]
  }
  scannedAt: string
}

type CollectProjectScanSignalsInput = {
  projectRoot: string
  repositories: ProjectRepositoryConfig[]
  scannedAt?: string
}

async function fileExists(targetPath: string): Promise<boolean> {
  try {
    await access(targetPath)
    return true
  } catch {
    return false
  }
}

async function readPackageJsonFrameworkHints(projectRoot: string): Promise<string[]> {
  const packageJsonPath = path.join(projectRoot, 'package.json')

  if (!(await fileExists(packageJsonPath))) {
    return []
  }

  try {
    const raw = await readFile(packageJsonPath, 'utf8')
    const parsed = JSON.parse(raw) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }
    const dependencyNames = new Set([
      ...Object.keys(parsed.dependencies ?? {}),
      ...Object.keys(parsed.devDependencies ?? {}),
    ])
    const frameworkHints: string[] = []

    if (dependencyNames.has('react')) {
      frameworkHints.push('react')
    }
    if (dependencyNames.has('next')) {
      frameworkHints.push('nextjs')
    }
    if (dependencyNames.has('vite')) {
      frameworkHints.push('vite')
    }

    return frameworkHints
  } catch {
    return []
  }
}

export async function collectProjectScanSignals(
  input: CollectProjectScanSignalsInput,
): Promise<ProjectScanSignals> {
  const [hasPnpmWorkspace, hasTurboJson, hasDocsDir, hasTestsDir, hasGithubWorkflows, hasPackageJson, hasPnpmLock, hasPyproject, hasCargoToml, hasGoMod, hasProjectConfig, frameworkHints] = await Promise.all([
    fileExists(path.join(input.projectRoot, 'pnpm-workspace.yaml')),
    fileExists(path.join(input.projectRoot, 'turbo.json')),
    fileExists(path.join(input.projectRoot, 'docs')),
    fileExists(path.join(input.projectRoot, 'tests')),
    fileExists(path.join(input.projectRoot, '.github', 'workflows')),
    fileExists(path.join(input.projectRoot, 'package.json')),
    fileExists(path.join(input.projectRoot, 'pnpm-lock.yaml')),
    fileExists(path.join(input.projectRoot, 'pyproject.toml')),
    fileExists(path.join(input.projectRoot, 'Cargo.toml')),
    fileExists(path.join(input.projectRoot, 'go.mod')),
    fileExists(resolveProjectConfigPath(input.projectRoot)),
    readPackageJsonFrameworkHints(input.projectRoot),
  ])

  const keyPaths = [
    hasPnpmWorkspace ? 'pnpm-workspace.yaml' : null,
    hasTurboJson ? 'turbo.json' : null,
    hasDocsDir ? 'docs/' : null,
    hasTestsDir ? 'tests/' : null,
    hasGithubWorkflows ? '.github/workflows/' : null,
    hasPackageJson ? 'package.json' : null,
    hasPnpmLock ? 'pnpm-lock.yaml' : null,
    hasPyproject ? 'pyproject.toml' : null,
    hasCargoToml ? 'Cargo.toml' : null,
    hasGoMod ? 'go.mod' : null,
  ].filter((item): item is string => Boolean(item))

  const hasNestedRepositories = input.repositories.some((repository) => repository.path !== '.')
  const repositoryLayout = hasDocsDir && input.repositories.length === 1 && !hasPackageJson
    ? 'docs-heavy'
    : input.repositories.length > 1
      ? 'multi-repo'
      : hasDocsDir && hasPackageJson
        ? 'mixed'
        : 'single-repo'

  const languages = [
    hasPackageJson ? 'typescript' : null,
    hasPyproject ? 'python' : null,
    hasCargoToml ? 'rust' : null,
    hasGoMod ? 'go' : null,
  ].filter((item): item is string => Boolean(item))

  const packageManagers = [
    hasPnpmWorkspace || hasPnpmLock ? 'pnpm' : null,
    hasPackageJson && !hasPnpmWorkspace && !hasPnpmLock ? 'npm' : null,
  ].filter((item): item is string => Boolean(item))

  const runtimeHints = [
    hasPackageJson ? 'node' : null,
    hasPyproject ? 'python' : null,
    hasCargoToml ? 'rust' : null,
    hasGoMod ? 'go' : null,
  ].filter((item): item is string => Boolean(item))

  const likelyProjectType = hasDocsDir && !hasTestsDir && !hasPackageJson
    ? 'docs-heavy'
    : hasTestsDir && input.repositories.length === 1
      ? 'standard-software'
      : input.repositories.length > 1
        ? 'mixed'
        : 'fast-bugfix'

  return {
    projectPath: input.projectRoot,
    repositoryCount: input.repositories.length,
    structure: {
      repositoryLayout,
      hasMonorepoMarkers: hasPnpmWorkspace || hasTurboJson,
      hasNestedRepositories,
      keyPaths,
    },
    stack: {
      languages,
      packageManagers,
      runtimeHints,
      frameworkHints,
    },
    workflow: {
      hasTests: hasTestsDir,
      hasDocsEmphasis: hasDocsDir,
      hasCiConfig: hasGithubWorkflows,
      likelyProjectType,
    },
    health: {
      missingProjectConfig: !hasProjectConfig,
      missingFoundation: false,
      missingRecommendedBindings: [],
      brokenRepositoryRefs: [],
    },
    integrations: {
      hasBeads: false,
      hasSuperpowers: false,
      hasPlatforms: [],
      hasSkills: [],
      hasMcpServers: [],
    },
    scannedAt: input.scannedAt ?? new Date().toISOString(),
  }
}
