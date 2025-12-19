import { Router } from 'express'
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

export default router
