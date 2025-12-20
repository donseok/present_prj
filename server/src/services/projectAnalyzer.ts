import fs from 'fs/promises'
import path from 'path'
import type { AnalyzedProjectInfo, FolderAnalysisResult } from '../types/index.js'

// 분석할 파일 패턴들
const ANALYSIS_PATTERNS = {
  readme: ['README.md', 'README.txt', 'README', 'readme.md'],
  packageJson: ['package.json'],
  pomXml: ['pom.xml'],
  buildGradle: ['build.gradle', 'build.gradle.kts'],
  changelog: ['CHANGELOG.md', 'CHANGELOG', 'HISTORY.md'],
  contributing: ['CONTRIBUTING.md'],
  license: ['LICENSE', 'LICENSE.md'],
  gitConfig: ['.git/config'],
  envExample: ['.env.example', '.env.sample'],
  // 추가된 문서 패턴
  prd: ['PRD.md', 'prd.md', 'PRD.txt', 'docs/PRD.md', 'docs/prd.md', 'documentation/PRD.md'],
  claudeMd: ['CLAUDE.md', 'claude.md', '.claude/CLAUDE.md'],
  wbs: ['WBS.md', 'wbs.md', 'WBS.xlsx', 'wbs.xlsx', 'docs/WBS.md', 'docs/wbs.md'],
}

// 디렉토리 구조 분석에서 제외할 패턴
const EXCLUDE_DIRS = ['node_modules', '.git', 'dist', 'build', '.next', '__pycache__', '.venv', 'venv', 'target']

interface FileContent {
  path: string
  content: string
}

interface ParsedPackageJson {
  name?: string
  description?: string
  version?: string
  author?: string | { name?: string }
  contributors?: Array<string | { name?: string; email?: string }>
  scripts?: Record<string, string>
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  repository?: string | { url?: string }
}

interface ParsedPomXml {
  name?: string
  description?: string
  groupId?: string
  artifactId?: string
  version?: string
}

async function collectProjectFiles(folderPath: string): Promise<FileContent[]> {
  const files: FileContent[] = []

  // 주요 설정 파일들 수집
  for (const [, patterns] of Object.entries(ANALYSIS_PATTERNS)) {
    for (const pattern of patterns) {
      const filePath = path.join(folderPath, pattern)
      try {
        const content = await fs.readFile(filePath, 'utf-8')
        files.push({ path: pattern, content: content.slice(0, 10000) }) // 10KB 제한
      } catch {
        // 파일이 없으면 무시
      }
    }
  }

  return files
}

async function getDirectoryStructure(folderPath: string, depth = 2): Promise<string[]> {
  const structure: string[] = []

  async function traverse(currentPath: string, currentDepth: number) {
    if (currentDepth > depth) return

    try {
      const entries = await fs.readdir(currentPath, { withFileTypes: true })
      const filtered = entries.filter(e => !EXCLUDE_DIRS.includes(e.name) && !e.name.startsWith('.'))

      for (const entry of filtered.slice(0, 50)) {
        const relativePath = path.relative(folderPath, path.join(currentPath, entry.name))
        structure.push(relativePath + (entry.isDirectory() ? '/' : ''))

        if (entry.isDirectory()) {
          await traverse(path.join(currentPath, entry.name), currentDepth + 1)
        }
      }
    } catch {
      // 디렉토리 접근 오류 무시
    }
  }

  await traverse(folderPath, 0)
  return structure
}

// package.json 파싱
function parsePackageJson(content: string): ParsedPackageJson | null {
  try {
    return JSON.parse(content) as ParsedPackageJson
  } catch {
    return null
  }
}

// README.md에서 정보 추출
function parseReadme(content: string): { title?: string; description?: string; features?: string[] } {
  const result: { title?: string; description?: string; features?: string[] } = {}

  // 제목 추출 (첫 번째 # 또는 첫 줄)
  const titleMatch = content.match(/^#\s+(.+)$/m)
  if (titleMatch) {
    result.title = titleMatch[1].trim()
  }

  // 설명 추출 (제목 다음 단락)
  const lines = content.split('\n')
  let descriptionStart = -1
  let inDescription = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // 제목 줄 건너뛰기
    if (line.startsWith('#') && !inDescription) {
      descriptionStart = i + 1
      continue
    }

    // 배지 라인 건너뛰기
    if (line.includes('![') || line.includes('[![')) {
      if (descriptionStart === i) descriptionStart = i + 1
      continue
    }

    // 빈 줄 건너뛰기
    if (!line && descriptionStart === i) {
      descriptionStart = i + 1
      continue
    }

    // 설명 시작
    if (descriptionStart > 0 && i >= descriptionStart && line && !line.startsWith('#')) {
      if (!inDescription) {
        result.description = line
        inDescription = true
      } else if (!line.startsWith('-') && !line.startsWith('*') && !line.startsWith('#')) {
        result.description += ' ' + line
      } else {
        break
      }
    }

    // 다음 섹션 시작하면 종료
    if (inDescription && (line.startsWith('#') || line.startsWith('## '))) {
      break
    }
  }

  // 기능 목록 추출 (Features, 주요 기능 등의 섹션)
  const featuresMatch = content.match(/##?\s*(Features|기능|주요\s*기능|특징)[\s\S]*?((?:\n[-*]\s+.+)+)/i)
  if (featuresMatch) {
    const featureLines = featuresMatch[2].match(/[-*]\s+(.+)/g)
    if (featureLines) {
      result.features = featureLines.map(line => line.replace(/^[-*]\s+/, '').trim()).slice(0, 10)
    }
  }

  return result
}

// pom.xml 파싱 (간단한 정규식 기반)
function parsePomXml(content: string): ParsedPomXml {
  const result: ParsedPomXml = {}

  const nameMatch = content.match(/<name>([^<]+)<\/name>/)
  if (nameMatch) result.name = nameMatch[1].trim()

  const descMatch = content.match(/<description>([^<]+)<\/description>/)
  if (descMatch) result.description = descMatch[1].trim()

  const groupMatch = content.match(/<groupId>([^<]+)<\/groupId>/)
  if (groupMatch) result.groupId = groupMatch[1].trim()

  const artifactMatch = content.match(/<artifactId>([^<]+)<\/artifactId>/)
  if (artifactMatch) result.artifactId = artifactMatch[1].trim()

  const versionMatch = content.match(/<version>([^<]+)<\/version>/)
  if (versionMatch) result.version = versionMatch[1].trim()

  return result
}

// build.gradle 파싱
function parseBuildGradle(content: string): { name?: string; description?: string; group?: string; version?: string } {
  const result: { name?: string; description?: string; group?: string; version?: string } = {}

  // rootProject.name 또는 settings.gradle에서 이름
  const nameMatch = content.match(/rootProject\.name\s*=\s*['"]([^'"]+)['"]/)
  if (nameMatch) result.name = nameMatch[1]

  const groupMatch = content.match(/group\s*=\s*['"]([^'"]+)['"]/)
  if (groupMatch) result.group = groupMatch[1]

  const versionMatch = content.match(/version\s*=\s*['"]([^'"]+)['"]/)
  if (versionMatch) result.version = versionMatch[1]

  const descMatch = content.match(/description\s*=\s*['"]([^'"]+)['"]/)
  if (descMatch) result.description = descMatch[1]

  return result
}

// PRD (Product Requirements Document) 파싱
interface ParsedPrd {
  title?: string
  overview?: string
  objectives?: string[]
  features?: string[]
  requirements?: string[]
  userStories?: string[]
  scope?: string
}

function parsePrd(content: string): ParsedPrd {
  const result: ParsedPrd = {}

  // 제목 추출
  const titleMatch = content.match(/^#\s+(.+)$/m)
  if (titleMatch) {
    result.title = titleMatch[1].trim()
  }

  // 개요/Overview 추출
  const overviewMatch = content.match(/##?\s*(개요|Overview|Summary|Introduction)[\s\S]*?\n([\s\S]*?)(?=\n##|\n#|$)/i)
  if (overviewMatch) {
    result.overview = overviewMatch[2].trim().split('\n').filter(l => l.trim()).slice(0, 5).join(' ')
  }

  // 목표/Objectives 추출
  const objectivesMatch = content.match(/##?\s*(목표|Objectives|Goals)[\s\S]*?((?:\n[-*]\s+.+)+)/i)
  if (objectivesMatch) {
    const lines = objectivesMatch[2].match(/[-*]\s+(.+)/g)
    if (lines) {
      result.objectives = lines.map(l => l.replace(/^[-*]\s+/, '').trim()).slice(0, 10)
    }
  }

  // 기능 요구사항 추출
  const featuresMatch = content.match(/##?\s*(기능|Features|Functional\s*Requirements|주요\s*기능)[\s\S]*?((?:\n[-*]\s+.+)+)/i)
  if (featuresMatch) {
    const lines = featuresMatch[2].match(/[-*]\s+(.+)/g)
    if (lines) {
      result.features = lines.map(l => l.replace(/^[-*]\s+/, '').trim()).slice(0, 15)
    }
  }

  // 요구사항 추출
  const requirementsMatch = content.match(/##?\s*(요구사항|Requirements|Specs|Specifications)[\s\S]*?((?:\n[-*]\s+.+)+)/i)
  if (requirementsMatch) {
    const lines = requirementsMatch[2].match(/[-*]\s+(.+)/g)
    if (lines) {
      result.requirements = lines.map(l => l.replace(/^[-*]\s+/, '').trim()).slice(0, 15)
    }
  }

  // 사용자 스토리 추출
  const userStoriesMatch = content.match(/##?\s*(사용자\s*스토리|User\s*Stories|Use\s*Cases)[\s\S]*?((?:\n[-*]\s+.+)+)/i)
  if (userStoriesMatch) {
    const lines = userStoriesMatch[2].match(/[-*]\s+(.+)/g)
    if (lines) {
      result.userStories = lines.map(l => l.replace(/^[-*]\s+/, '').trim()).slice(0, 10)
    }
  }

  // 범위 추출
  const scopeMatch = content.match(/##?\s*(범위|Scope|Project\s*Scope)[\s\S]*?\n([\s\S]*?)(?=\n##|\n#|$)/i)
  if (scopeMatch) {
    result.scope = scopeMatch[2].trim().split('\n').filter(l => l.trim()).slice(0, 5).join('\n')
  }

  return result
}

// CLAUDE.md 파싱 (프로젝트 컨텍스트 및 지침)
interface ParsedClaudeMd {
  projectOverview?: string
  architecture?: string
  conventions?: string[]
  importantNotes?: string[]
  techStack?: string[]
}

function parseClaudeMd(content: string): ParsedClaudeMd {
  const result: ParsedClaudeMd = {}

  // 프로젝트 개요 추출
  const overviewMatch = content.match(/##?\s*(Project\s*Overview|프로젝트\s*개요|Overview)[\s\S]*?\n([\s\S]*?)(?=\n##|\n#|$)/i)
  if (overviewMatch) {
    result.projectOverview = overviewMatch[2].trim().split('\n').filter(l => l.trim()).slice(0, 5).join(' ')
  }

  // 아키텍처 정보 추출
  const archMatch = content.match(/##?\s*(Architecture|아키텍처|구조|Structure)[\s\S]*?\n([\s\S]*?)(?=\n##|\n#|$)/i)
  if (archMatch) {
    result.architecture = archMatch[2].trim().split('\n').filter(l => l.trim()).slice(0, 5).join('\n')
  }

  // 컨벤션/규칙 추출
  const conventionsMatch = content.match(/##?\s*(Conventions|규칙|컨벤션|Coding\s*Standards)[\s\S]*?((?:\n[-*]\s+.+)+)/i)
  if (conventionsMatch) {
    const lines = conventionsMatch[2].match(/[-*]\s+(.+)/g)
    if (lines) {
      result.conventions = lines.map(l => l.replace(/^[-*]\s+/, '').trim()).slice(0, 10)
    }
  }

  // 중요 노트 추출
  const notesMatch = content.match(/##?\s*(Important|중요|Notes|주의사항)[\s\S]*?((?:\n[-*]\s+.+)+)/i)
  if (notesMatch) {
    const lines = notesMatch[2].match(/[-*]\s+(.+)/g)
    if (lines) {
      result.importantNotes = lines.map(l => l.replace(/^[-*]\s+/, '').trim()).slice(0, 10)
    }
  }

  // 기술 스택 추출
  const techMatch = content.match(/##?\s*(Tech\s*Stack|기술\s*스택|Technologies|Development\s*Commands)[\s\S]*?((?:\n[-*]\s+.+)+)/i)
  if (techMatch) {
    const lines = techMatch[2].match(/[-*]\s+(.+)/g)
    if (lines) {
      result.techStack = lines.map(l => l.replace(/^[-*]\s+/, '').trim()).slice(0, 10)
    }
  }

  return result
}

// WBS (Work Breakdown Structure) 파싱
interface ParsedWbs {
  phases?: Array<{ name: string; tasks?: string[] }>
  milestones?: Array<{ name: string; description?: string }>
  deliverables?: string[]
}

function parseWbs(content: string): ParsedWbs {
  const result: ParsedWbs = {}
  const phases: Array<{ name: string; tasks?: string[] }> = []
  const milestones: Array<{ name: string; description?: string }> = []

  // 마크다운 형식의 WBS 파싱
  // Phase/단계 추출
  const phaseMatches = content.matchAll(/##?\s*(Phase\s*\d+|단계\s*\d+|[\d]+\.\s*[^\n]+)[\s\S]*?((?:\n[-*]\s+.+)+)?/gi)
  for (const match of phaseMatches) {
    const phase: { name: string; tasks?: string[] } = {
      name: match[1].trim()
    }
    if (match[2]) {
      const taskLines = match[2].match(/[-*]\s+(.+)/g)
      if (taskLines) {
        phase.tasks = taskLines.map(l => l.replace(/^[-*]\s+/, '').trim())
      }
    }
    phases.push(phase)
  }

  // 마일스톤 추출
  const milestoneMatch = content.match(/##?\s*(마일스톤|Milestones?)[\s\S]*?((?:\n[-*]\s+.+)+)/i)
  if (milestoneMatch) {
    const lines = milestoneMatch[2].match(/[-*]\s+(.+)/g)
    if (lines) {
      lines.forEach(line => {
        const text = line.replace(/^[-*]\s+/, '').trim()
        milestones.push({ name: text })
      })
    }
  }

  // 산출물/Deliverables 추출
  const deliverablesMatch = content.match(/##?\s*(산출물|Deliverables?|Outputs?)[\s\S]*?((?:\n[-*]\s+.+)+)/i)
  if (deliverablesMatch) {
    const lines = deliverablesMatch[2].match(/[-*]\s+(.+)/g)
    if (lines) {
      result.deliverables = lines.map(l => l.replace(/^[-*]\s+/, '').trim()).slice(0, 15)
    }
  }

  if (phases.length > 0) result.phases = phases.slice(0, 10)
  if (milestones.length > 0) result.milestones = milestones.slice(0, 10)

  return result
}

// 프로젝트 타입 감지
function detectProjectType(files: FileContent[], structure: string[]): string {
  const fileNames = files.map(f => f.path.toLowerCase())
  const structureStr = structure.join(' ').toLowerCase()

  if (fileNames.includes('package.json')) {
    if (structureStr.includes('src/app') || structureStr.includes('app/')) {
      if (structureStr.includes('next.config')) return 'Next.js'
      if (structureStr.includes('nuxt.config')) return 'Nuxt.js'
    }
    if (structureStr.includes('src/components') || structureStr.includes('components/')) {
      const pkgFile = files.find(f => f.path === 'package.json')
      if (pkgFile) {
        if (pkgFile.content.includes('"react"')) return 'React'
        if (pkgFile.content.includes('"vue"')) return 'Vue.js'
        if (pkgFile.content.includes('"@angular/core"')) return 'Angular'
        if (pkgFile.content.includes('"svelte"')) return 'Svelte'
      }
    }
    if (structureStr.includes('src/') && !structureStr.includes('components')) {
      const pkgFile = files.find(f => f.path === 'package.json')
      if (pkgFile?.content.includes('"express"')) return 'Express.js'
      if (pkgFile?.content.includes('"fastify"')) return 'Fastify'
      if (pkgFile?.content.includes('"nestjs"') || pkgFile?.content.includes('"@nestjs/core"')) return 'NestJS'
    }
    return 'Node.js'
  }

  if (fileNames.includes('pom.xml')) {
    return 'Java (Maven)'
  }

  if (fileNames.some(f => f.includes('build.gradle'))) {
    return 'Java (Gradle)'
  }

  if (structureStr.includes('.py') || structureStr.includes('requirements.txt') || structureStr.includes('setup.py')) {
    if (structureStr.includes('django') || structureStr.includes('manage.py')) return 'Django'
    if (structureStr.includes('flask')) return 'Flask'
    if (structureStr.includes('fastapi')) return 'FastAPI'
    return 'Python'
  }

  if (structureStr.includes('.go') || structureStr.includes('go.mod')) {
    return 'Go'
  }

  if (structureStr.includes('.rs') || structureStr.includes('cargo.toml')) {
    return 'Rust'
  }

  return '알 수 없음'
}

// PRD 정보를 포함한 요구사항 추출
function extractRequirementsWithPrd(
  readmeInfo: ReturnType<typeof parseReadme>,
  prdInfo: ParsedPrd,
  projectType: string
): {
  functional: Array<{ id: string; category: string; description: string; priority: 'high' | 'medium' | 'low' }>
  nonFunctional: Array<{ id: string; category: string; description: string; priority: 'high' | 'medium' | 'low' }>
} {
  const functional: Array<{ id: string; category: string; description: string; priority: 'high' | 'medium' | 'low' }> = []
  const nonFunctional: Array<{ id: string; category: string; description: string; priority: 'high' | 'medium' | 'low' }> = []
  let frIndex = 1

  // PRD에서 기능 요구사항 추출 (우선순위 높음)
  if (prdInfo.features && prdInfo.features.length > 0) {
    prdInfo.features.forEach((feature, idx) => {
      functional.push({
        id: `FR-${String(frIndex++).padStart(3, '0')}`,
        category: 'PRD 기능',
        description: feature,
        priority: idx < 5 ? 'high' : 'medium'
      })
    })
  }

  // PRD 요구사항에서 추출
  if (prdInfo.requirements && prdInfo.requirements.length > 0) {
    prdInfo.requirements.forEach((req) => {
      functional.push({
        id: `FR-${String(frIndex++).padStart(3, '0')}`,
        category: 'PRD 요구사항',
        description: req,
        priority: 'medium'
      })
    })
  }

  // PRD 사용자 스토리에서 추출
  if (prdInfo.userStories && prdInfo.userStories.length > 0) {
    prdInfo.userStories.forEach((story) => {
      functional.push({
        id: `FR-${String(frIndex++).padStart(3, '0')}`,
        category: '사용자 스토리',
        description: story,
        priority: 'medium'
      })
    })
  }

  // PRD 목표에서 추출
  if (prdInfo.objectives && prdInfo.objectives.length > 0) {
    prdInfo.objectives.forEach((obj) => {
      functional.push({
        id: `FR-${String(frIndex++).padStart(3, '0')}`,
        category: '프로젝트 목표',
        description: obj,
        priority: 'high'
      })
    })
  }

  // README 기능에서 요구사항 추출 (PRD에 없는 경우 보완)
  if (readmeInfo.features && functional.length === 0) {
    readmeInfo.features.forEach((feature, idx) => {
      functional.push({
        id: `FR-${String(frIndex++).padStart(3, '0')}`,
        category: '주요 기능',
        description: feature,
        priority: idx < 3 ? 'high' : 'medium'
      })
    })
  }

  // 프로젝트 타입에 따른 비기능 요구사항 추가
  let nfrIndex = 1
  if (projectType.includes('React') || projectType.includes('Vue') || projectType.includes('Angular')) {
    nonFunctional.push({
      id: `NFR-${String(nfrIndex++).padStart(3, '0')}`,
      category: '성능',
      description: '페이지 로딩 시간 3초 이내',
      priority: 'high'
    })
    nonFunctional.push({
      id: `NFR-${String(nfrIndex++).padStart(3, '0')}`,
      category: '호환성',
      description: '최신 브라우저 지원 (Chrome, Firefox, Safari, Edge)',
      priority: 'medium'
    })
  }

  if (projectType.includes('Express') || projectType.includes('NestJS') || projectType.includes('FastAPI')) {
    nonFunctional.push({
      id: `NFR-${String(nfrIndex++).padStart(3, '0')}`,
      category: '성능',
      description: 'API 응답 시간 500ms 이내',
      priority: 'high'
    })
    nonFunctional.push({
      id: `NFR-${String(nfrIndex++).padStart(3, '0')}`,
      category: '보안',
      description: 'API 인증 및 권한 관리',
      priority: 'high'
    })
  }

  return { functional, nonFunctional }
}

// WBS에서 마일스톤 추출
function extractMilestonesFromWbs(wbsInfo: ParsedWbs): Array<{ name: string; date: string; deliverables: string }> {
  const milestones: Array<{ name: string; date: string; deliverables: string }> = []

  // WBS 마일스톤에서 추출
  if (wbsInfo.milestones && wbsInfo.milestones.length > 0) {
    wbsInfo.milestones.forEach(ms => {
      milestones.push({
        name: ms.name,
        date: '',
        deliverables: ms.description || ''
      })
    })
  }

  // WBS 단계(Phase)에서 마일스톤 생성
  if (wbsInfo.phases && wbsInfo.phases.length > 0) {
    wbsInfo.phases.forEach(phase => {
      milestones.push({
        name: phase.name,
        date: '',
        deliverables: phase.tasks ? phase.tasks.join(', ') : ''
      })
    })
  }

  // 산출물에서 마일스톤 생성
  if (wbsInfo.deliverables && wbsInfo.deliverables.length > 0 && milestones.length === 0) {
    wbsInfo.deliverables.forEach(del => {
      milestones.push({
        name: `산출물: ${del}`,
        date: '',
        deliverables: ''
      })
    })
  }

  return milestones
}

// 팀 정보 추출 (package.json contributors 등에서)
function extractTeam(pkg: ParsedPackageJson | null): Array<{ name: string; role: string; responsibility: string }> {
  const team: Array<{ name: string; role: string; responsibility: string }> = []

  if (pkg?.author) {
    const authorName = typeof pkg.author === 'string' ? pkg.author : pkg.author.name
    if (authorName) {
      team.push({
        name: authorName,
        role: '프로젝트 리더',
        responsibility: '프로젝트 총괄'
      })
    }
  }

  if (pkg?.contributors && Array.isArray(pkg.contributors)) {
    pkg.contributors.slice(0, 5).forEach((contributor, idx) => {
      const name = typeof contributor === 'string' ? contributor : contributor.name
      if (name) {
        team.push({
          name,
          role: '개발자',
          responsibility: `개발 참여 (${idx + 1})`
        })
      }
    })
  }

  return team
}

// 로컬 패턴 매칭 기반 프로젝트 분석 (API 비용 없음)
export async function analyzeProjectFolder(
  folderPath: string
): Promise<FolderAnalysisResult> {
  try {
    // 폴더 존재 확인
    const stats = await fs.stat(folderPath)
    if (!stats.isDirectory()) {
      return { success: false, error: '유효한 폴더 경로가 아닙니다.' }
    }

    // 파일 수집
    const files = await collectProjectFiles(folderPath)
    const directoryStructure = await getDirectoryStructure(folderPath)

    if (files.length === 0) {
      return {
        success: false,
        error: '분석할 수 있는 파일을 찾을 수 없습니다. README.md, package.json 등의 파일이 필요합니다.'
      }
    }

    // 각 파일 파싱
    let packageJson: ParsedPackageJson | null = null
    let readmeInfo: ReturnType<typeof parseReadme> = {}
    let pomXml: ParsedPomXml = {}
    let gradleInfo: ReturnType<typeof parseBuildGradle> = {}
    let prdInfo: ParsedPrd = {}
    let claudeMdInfo: ParsedClaudeMd = {}
    let wbsInfo: ParsedWbs = {}

    for (const file of files) {
      const lowerPath = file.path.toLowerCase()
      if (file.path === 'package.json') {
        packageJson = parsePackageJson(file.content)
      } else if (lowerPath.includes('readme')) {
        readmeInfo = parseReadme(file.content)
      } else if (file.path === 'pom.xml') {
        pomXml = parsePomXml(file.content)
      } else if (lowerPath.includes('build.gradle')) {
        gradleInfo = parseBuildGradle(file.content)
      } else if (lowerPath.includes('prd')) {
        prdInfo = parsePrd(file.content)
      } else if (lowerPath.includes('claude.md')) {
        claudeMdInfo = parseClaudeMd(file.content)
      } else if (lowerPath.includes('wbs')) {
        wbsInfo = parseWbs(file.content)
      }
    }

    // 프로젝트 타입 감지
    const projectType = detectProjectType(files, directoryStructure)

    // 프로젝트 이름 결정 (우선순위: PRD > package.json > pom.xml > gradle > readme > 폴더명)
    const projectName =
      prdInfo.title ||
      packageJson?.name ||
      pomXml.name ||
      pomXml.artifactId ||
      gradleInfo.name ||
      readmeInfo.title ||
      path.basename(folderPath)

    // 설명 결정 (PRD 개요 > CLAUDE.md 개요 > README 설명 등)
    const description =
      prdInfo.overview ||
      claudeMdInfo.projectOverview ||
      readmeInfo.description ||
      packageJson?.description ||
      pomXml.description ||
      gradleInfo.description ||
      `${projectType} 프로젝트`

    // 요구사항 추출 (PRD 정보 포함)
    const requirements = extractRequirementsWithPrd(readmeInfo, prdInfo, projectType)

    // 팀 정보 추출
    const team = extractTeam(packageJson)

    // 마일스톤 추출 (WBS에서)
    const milestones = extractMilestonesFromWbs(wbsInfo)

    // 범위 생성 (PRD 범위 포함)
    const scopeParts: string[] = []
    scopeParts.push(`프로젝트 유형: ${projectType}`)
    if (packageJson?.version || pomXml.version || gradleInfo.version) {
      scopeParts.push(`버전: ${packageJson?.version || pomXml.version || gradleInfo.version}`)
    }
    if (packageJson?.dependencies) {
      const depCount = Object.keys(packageJson.dependencies).length
      scopeParts.push(`의존성: ${depCount}개`)
    }
    // PRD에서 범위 정보 추가
    if (prdInfo.scope) {
      scopeParts.push(`\n프로젝트 범위:\n${prdInfo.scope}`)
    }
    // CLAUDE.md에서 아키텍처 정보 추가
    if (claudeMdInfo.architecture) {
      scopeParts.push(`\n아키텍처:\n${claudeMdInfo.architecture}`)
    }
    // 기술 스택 추가
    if (claudeMdInfo.techStack && claudeMdInfo.techStack.length > 0) {
      scopeParts.push(`\n기술 스택: ${claudeMdInfo.techStack.join(', ')}`)
    }
    scopeParts.push(`\n분석된 파일: ${files.length}개`)

    // 결과 생성
    const projectInfo: AnalyzedProjectInfo = {
      name: projectName,
      client: pomXml.groupId || gradleInfo.group || '',
      description,
      scope: scopeParts.join('\n'),
      startDate: '',
      endDate: '',
      status: '진행중',
      team,
      milestones,
      requirements,
      confidence: files.length >= 3 ? 0.8 : files.length >= 2 ? 0.6 : 0.4,
      analyzedFiles: files.map(f => f.path)
    }

    return { success: true, projectInfo }

  } catch (error) {
    console.error('Project analysis error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '프로젝트 분석 중 오류가 발생했습니다.'
    }
  }
}

export async function listDirectory(dirPath: string): Promise<{ name: string, isDirectory: boolean }[]> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true })
    return entries
      .filter(e => !e.name.startsWith('.') || e.name === '..')
      .map(e => ({
        name: e.name,
        isDirectory: e.isDirectory()
      }))
      .sort((a, b) => {
        // 디렉토리 먼저, 그 다음 이름순
        if (a.isDirectory && !b.isDirectory) return -1
        if (!a.isDirectory && b.isDirectory) return 1
        return a.name.localeCompare(b.name)
      })
  } catch (error) {
    console.error('List directory error:', error)
    return []
  }
}

export async function getDrives(): Promise<string[]> {
  // Windows 드라이브 목록
  const drives: string[] = []
  const letters = 'CDEFGHIJKLMNOPQRSTUVWXYZ'

  for (const letter of letters) {
    try {
      await fs.access(`${letter}:\\`)
      drives.push(`${letter}:\\`)
    } catch {
      // 드라이브 없음
    }
  }

  return drives
}
