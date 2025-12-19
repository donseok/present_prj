import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { dataStore } from '../services/dataStore.js'
import type { Project } from '../types/index.js'

const router = Router()

// Get all projects
router.get('/', async (_req, res) => {
  try {
    const projects = await dataStore.getProjects()
    res.json(projects)
  } catch (error) {
    console.error('Failed to get projects:', error)
    res.status(500).json({ error: 'Failed to get projects' })
  }
})

// Get project by ID
router.get('/:id', async (req, res) => {
  try {
    const project = await dataStore.getProjectById(req.params.id)
    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }
    res.json(project)
  } catch (error) {
    console.error('Failed to get project:', error)
    res.status(500).json({ error: 'Failed to get project' })
  }
})

// Create project
router.post('/', async (req, res) => {
  try {
    const now = new Date().toISOString()
    const project: Project = {
      ...req.body,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    }
    const created = await dataStore.createProject(project)
    res.status(201).json(created)
  } catch (error) {
    console.error('Failed to create project:', error)
    res.status(500).json({ error: 'Failed to create project' })
  }
})

// Update project
router.put('/:id', async (req, res) => {
  try {
    const updated = await dataStore.updateProject(req.params.id, req.body)
    if (!updated) {
      return res.status(404).json({ error: 'Project not found' })
    }
    res.json(updated)
  } catch (error) {
    console.error('Failed to update project:', error)
    res.status(500).json({ error: 'Failed to update project' })
  }
})

// Delete project
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await dataStore.deleteProject(req.params.id)
    if (!deleted) {
      return res.status(404).json({ error: 'Project not found' })
    }
    res.status(204).send()
  } catch (error) {
    console.error('Failed to delete project:', error)
    res.status(500).json({ error: 'Failed to delete project' })
  }
})

export default router
