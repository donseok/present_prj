import express from 'express'
import cors from 'cors'
import projectRoutes from './routes/projects.js'
import templateRoutes from './routes/templates.js'
import documentRoutes from './routes/documents.js'
import analyzeRoutes from './routes/analyze.js'

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

// Routes
app.use('/api/projects', projectRoutes)
app.use('/api/templates', templateRoutes)
app.use('/api/documents', documentRoutes)
app.use('/api/analyze', analyzeRoutes)

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
