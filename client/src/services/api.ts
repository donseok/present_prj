import axios from 'axios'
import type { Project, Template } from '../types'

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
}
