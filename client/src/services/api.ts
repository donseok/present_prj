import axios from 'axios'
import type { Project, Template, AnalyzedProjectInfo, BrowseResult } from '../types'

const api = axios.create({
  baseURL: '/api',
})

export const projectApi = {
  getAll: async (): Promise<Project[]> => {
    const response = await api.get('/projects')
    return response.data
  },

  getById: async (id: string): Promise<Project> => {
    const response = await api.get(`/projects/${id}`)
    return response.data
  },

  create: async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> => {
    const response = await api.post('/projects', project)
    return response.data
  },

  update: async (id: string, project: Partial<Project>): Promise<Project> => {
    const response = await api.put(`/projects/${id}`, project)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/projects/${id}`)
  },
}

export const templateApi = {
  getAll: async (): Promise<Template[]> => {
    const response = await api.get('/templates')
    return response.data
  },

  upload: async (file: File, documentType: string): Promise<Template> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('documentType', documentType)

    const response = await api.post('/templates/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/templates/${id}`)
  },
}

export const documentApi = {
  generate: async (projectId: string, templateId: string, format?: string): Promise<Blob> => {
    const response = await api.post(
      '/documents/generate',
      { projectId, templateId, format },
      { responseType: 'blob' }
    )
    return response.data
  },

  generatePdf: async (projectId: string, templateId: string): Promise<Blob> => {
    const response = await api.post(
      '/documents/generate-pdf',
      { projectId, templateId },
      { responseType: 'blob' }
    )
    return response.data
  },

  generateAndSave: async (
    projectId: string,
    templateId: string,
    savePath: string,
    format?: string
  ): Promise<{ success: boolean; filePath: string; filename: string }> => {
    const response = await api.post('/documents/generate-and-save', {
      projectId,
      templateId,
      savePath,
      format,
    })
    return response.data
  },
}

export const analyzeApi = {
  getDrives: async (): Promise<string[]> => {
    const response = await api.get('/analyze/drives')
    return response.data.drives
  },

  browse: async (path?: string): Promise<BrowseResult> => {
    const response = await api.get('/analyze/browse', { params: { path } })
    return response.data
  },

  analyzeFolder: async (folderPath: string): Promise<{ success: boolean; projectInfo?: AnalyzedProjectInfo; error?: string }> => {
    const response = await api.post('/analyze/folder', { folderPath })
    return response.data
  },
}

export const settingsApi = {
  get: async (): Promise<{ hasApiKey: boolean; claudeApiKey?: string }> => {
    const response = await api.get('/settings')
    return response.data
  },

  update: async (settings: { claudeApiKey?: string }): Promise<void> => {
    await api.put('/settings', settings)
  },

  validateApiKey: async (apiKey: string): Promise<{ valid: boolean; error?: string }> => {
    const response = await api.post('/settings/validate-api-key', { apiKey })
    return response.data
  },
}
