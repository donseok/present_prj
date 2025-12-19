import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import type { DataStore, Project, Template } from '../types/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_FILE = path.resolve(__dirname, '../../../data/store.json')

const defaultData: DataStore = {
  projects: [],
  templates: [],
}

async function ensureDataFile(): Promise<void> {
  try {
    await fs.access(DATA_FILE)
  } catch {
    const dataDir = path.dirname(DATA_FILE)
    await fs.mkdir(dataDir, { recursive: true })
    await fs.writeFile(DATA_FILE, JSON.stringify(defaultData, null, 2))
  }
}

async function readData(): Promise<DataStore> {
  await ensureDataFile()
  const content = await fs.readFile(DATA_FILE, 'utf-8')
  return JSON.parse(content)
}

async function writeData(data: DataStore): Promise<void> {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2))
}

export const dataStore = {
  // Projects
  async getProjects(): Promise<Project[]> {
    const data = await readData()
    return data.projects
  },

  async getProjectById(id: string): Promise<Project | undefined> {
    const data = await readData()
    return data.projects.find((p) => p.id === id)
  },

  async createProject(project: Project): Promise<Project> {
    const data = await readData()
    data.projects.push(project)
    await writeData(data)
    return project
  },

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined> {
    const data = await readData()
    const index = data.projects.findIndex((p) => p.id === id)
    if (index === -1) return undefined

    data.projects[index] = { ...data.projects[index], ...updates, updatedAt: new Date().toISOString() }
    await writeData(data)
    return data.projects[index]
  },

  async deleteProject(id: string): Promise<boolean> {
    const data = await readData()
    const index = data.projects.findIndex((p) => p.id === id)
    if (index === -1) return false

    data.projects.splice(index, 1)
    await writeData(data)
    return true
  },

  // Templates
  async getTemplates(): Promise<Template[]> {
    const data = await readData()
    return data.templates
  },

  async getTemplateById(id: string): Promise<Template | undefined> {
    const data = await readData()
    return data.templates.find((t) => t.id === id)
  },

  async createTemplate(template: Template): Promise<Template> {
    const data = await readData()
    data.templates.push(template)
    await writeData(data)
    return template
  },

  async deleteTemplate(id: string): Promise<boolean> {
    const data = await readData()
    const index = data.templates.findIndex((t) => t.id === id)
    if (index === -1) return false

    data.templates.splice(index, 1)
    await writeData(data)
    return true
  },
}
