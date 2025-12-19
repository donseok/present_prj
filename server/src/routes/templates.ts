import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs/promises'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'
import { dataStore } from '../services/dataStore.js'
import { extractPlaceholders } from '../services/templateParser.js'
import type { Template } from '../types/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TEMPLATES_DIR = path.resolve(__dirname, '../../../templates/uploads')

// Ensure templates directory exists
fs.mkdir(TEMPLATES_DIR, { recursive: true }).catch(console.error)

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, TEMPLATES_DIR)
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`
    cb(null, uniqueName)
  },
})

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (ext === '.docx' || ext === '.pptx') {
      cb(null, true)
    } else {
      cb(new Error('Only .docx and .pptx files are allowed'))
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
})

const router = Router()

// Get all templates
router.get('/', async (_req, res) => {
  try {
    const templates = await dataStore.getTemplates()
    res.json(templates)
  } catch (error) {
    console.error('Failed to get templates:', error)
    res.status(500).json({ error: 'Failed to get templates' })
  }
})

// Upload template
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const ext = path.extname(req.file.originalname).toLowerCase()
    const format = ext === '.docx' ? 'docx' : 'pptx'

    // Extract placeholders from the template
    const placeholders = await extractPlaceholders(req.file.path, format)

    const template: Template = {
      id: uuidv4(),
      name: req.file.originalname,
      documentType: req.body.documentType || '기타',
      format,
      filePath: req.file.path,
      placeholders,
      createdAt: new Date().toISOString(),
    }

    const created = await dataStore.createTemplate(template)
    res.status(201).json(created)
  } catch (error) {
    console.error('Failed to upload template:', error)
    res.status(500).json({ error: 'Failed to upload template' })
  }
})

// Delete template
router.delete('/:id', async (req, res) => {
  try {
    const template = await dataStore.getTemplateById(req.params.id)
    if (template) {
      // Delete the file
      try {
        await fs.unlink(template.filePath)
      } catch {
        // File might already be deleted
      }
    }

    const deleted = await dataStore.deleteTemplate(req.params.id)
    if (!deleted) {
      return res.status(404).json({ error: 'Template not found' })
    }
    res.status(204).send()
  } catch (error) {
    console.error('Failed to delete template:', error)
    res.status(500).json({ error: 'Failed to delete template' })
  }
})

export default router
