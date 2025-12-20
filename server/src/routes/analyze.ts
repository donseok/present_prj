import { Router } from 'express'
import path from 'path'
import os from 'os'
import { analyzeProjectFolder, listDirectory, getDrives } from '../services/projectAnalyzer.js'

const router = Router()

// GET /api/analyze/drives - Windows 드라이브 목록
router.get('/drives', async (_req, res) => {
  try {
    const drives = await getDrives()
    res.json({ drives })
  } catch (error) {
    console.error('Get drives error:', error)
    res.status(500).json({ error: 'Failed to get drives' })
  }
})

// GET /api/analyze/browse - 디렉토리 탐색
router.get('/browse', async (req, res) => {
  try {
    let dirPath = req.query.path as string

    if (!dirPath) {
      // 기본 경로: 홈 디렉토리
      dirPath = os.homedir()
    }

    // 경로 정규화
    dirPath = path.normalize(dirPath)

    const items = await listDirectory(dirPath)
    const parentPath = path.dirname(dirPath)

    res.json({
      currentPath: dirPath,
      parentPath: parentPath !== dirPath ? parentPath : null,
      items
    })
  } catch (error) {
    console.error('Browse directory error:', error)
    res.status(500).json({ error: 'Failed to browse directory' })
  }
})

// POST /api/analyze/folder - 프로젝트 폴더 분석 (로컬 패턴 매칭 - 비용 없음)
router.post('/folder', async (req, res) => {
  try {
    const { folderPath } = req.body

    if (!folderPath) {
      return res.status(400).json({ success: false, error: '폴더 경로가 필요합니다.' })
    }

    const result = await analyzeProjectFolder(folderPath)
    res.json(result)

  } catch (error) {
    console.error('Analyze folder error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze folder'
    })
  }
})

export default router
