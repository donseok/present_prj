import { Router } from 'express'
import fs from 'fs/promises'
import path from 'path'
import { dataStore } from '../services/dataStore.js'
import { generateDocx } from '../generators/docx/generator.js'
import { generatePptx } from '../generators/pptx/generator.js'
import { generatePdf } from '../generators/pdf/generator.js'

const router = Router()

// Generate document
router.post('/generate', async (req, res) => {
  try {
    const { projectId, templateId, format } = req.body

    if (!projectId || !templateId) {
      return res.status(400).json({ error: 'projectId and templateId are required' })
    }

    const project = await dataStore.getProjectById(projectId)
    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    const template = await dataStore.getTemplateById(templateId)
    if (!template) {
      return res.status(404).json({ error: 'Template not found' })
    }

    let buffer: Buffer
    let contentType: string
    let filename: string

    // If format is specified, use it; otherwise use template format
    const outputFormat = format || template.format

    if (outputFormat === 'pdf') {
      buffer = await generatePdf(project, template)
      contentType = 'application/pdf'
      filename = `${project.name}_${template.documentType}.pdf`
    } else if (outputFormat === 'docx' || template.format === 'docx') {
      buffer = await generateDocx(project, template)
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      filename = `${project.name}_${template.documentType}.docx`
    } else {
      buffer = await generatePptx(project, template)
      contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      filename = `${project.name}_${template.documentType}.pptx`
    }

    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`)
    res.send(buffer)
  } catch (error) {
    console.error('Failed to generate document:', error)
    res.status(500).json({ error: 'Failed to generate document' })
  }
})

// Generate PDF directly (standalone endpoint)
router.post('/generate-pdf', async (req, res) => {
  try {
    const { projectId, templateId } = req.body

    if (!projectId || !templateId) {
      return res.status(400).json({ error: 'projectId and templateId are required' })
    }

    const project = await dataStore.getProjectById(projectId)
    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    const template = await dataStore.getTemplateById(templateId)
    if (!template) {
      return res.status(404).json({ error: 'Template not found' })
    }

    const buffer = await generatePdf(project, template)
    const filename = `${project.name}_${template.documentType}.pdf`

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`)
    res.send(buffer)
  } catch (error) {
    console.error('Failed to generate PDF:', error)
    res.status(500).json({ error: 'Failed to generate PDF' })
  }
})

// Generate and save document to specified folder
router.post('/generate-and-save', async (req, res) => {
  try {
    const { projectId, templateId, format, savePath } = req.body

    if (!projectId || !templateId || !savePath) {
      return res.status(400).json({ error: 'projectId, templateId, and savePath are required' })
    }

    const project = await dataStore.getProjectById(projectId)
    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    const template = await dataStore.getTemplateById(templateId)
    if (!template) {
      return res.status(404).json({ error: 'Template not found' })
    }

    // Verify save path exists
    try {
      await fs.access(savePath)
    } catch {
      return res.status(400).json({ error: 'Save path does not exist' })
    }

    let buffer: Buffer
    let filename: string
    const outputFormat = format || template.format

    if (outputFormat === 'pdf') {
      buffer = await generatePdf(project, template)
      filename = `${project.name}_${template.documentType}.pdf`
    } else if (outputFormat === 'docx' || template.format === 'docx') {
      buffer = await generateDocx(project, template)
      filename = `${project.name}_${template.documentType}.docx`
    } else {
      buffer = await generatePptx(project, template)
      filename = `${project.name}_${template.documentType}.pptx`
    }

    const filePath = path.join(savePath, filename)
    await fs.writeFile(filePath, buffer)

    res.json({ success: true, filePath, filename })
  } catch (error) {
    console.error('Failed to generate and save document:', error)
    res.status(500).json({ error: 'Failed to generate and save document' })
  }
})

export default router
