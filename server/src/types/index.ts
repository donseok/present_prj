export interface TeamMember {
  name: string
  role: string
  responsibility: string
}

export interface Milestone {
  name: string
  date: string
  deliverables: string
}

export interface Requirement {
  id: string
  category: string
  description: string
  priority: 'high' | 'medium' | 'low'
}

export interface Project {
  id: string
  name: string
  client: string
  description: string
  scope: string
  startDate: string
  endDate: string
  status: string
  team: TeamMember[]
  milestones: Milestone[]
  requirements: {
    functional: Requirement[]
    nonFunctional: Requirement[]
  }
  createdAt: string
  updatedAt: string
}

export interface Template {
  id: string
  name: string
  documentType: string
  format: 'docx' | 'pptx'
  filePath: string
  placeholders: string[]
  createdAt: string
}

export interface DataStore {
  projects: Project[]
  templates: Template[]
  settings?: AppSettings
}

export interface AppSettings {
  claudeApiKey?: string
}

export interface AnalyzedProjectInfo {
  name: string
  client: string
  description: string
  scope: string
  startDate: string
  endDate: string
  status: string
  team: TeamMember[]
  milestones: Milestone[]
  requirements: {
    functional: Requirement[]
    nonFunctional: Requirement[]
  }
  analyzedFiles: string[]
  confidence: number
}

export interface FolderAnalysisResult {
  success: boolean
  projectInfo?: AnalyzedProjectInfo
  error?: string
}
