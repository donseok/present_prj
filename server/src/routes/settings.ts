import { Router } from 'express'
import { getSettings, saveSettings } from '../services/dataStore.js'

const router = Router()

// GET /api/settings
router.get('/', (_req, res) => {
  try {
    const settings = getSettings()
    // API 키는 마스킹해서 반환
    const maskedSettings = {
      ...settings,
      claudeApiKey: settings.claudeApiKey
        ? '***' + settings.claudeApiKey.slice(-4)
        : undefined,
      hasApiKey: !!settings.claudeApiKey
    }
    res.json(maskedSettings)
  } catch (error) {
    console.error('Get settings error:', error)
    res.status(500).json({ error: 'Failed to get settings' })
  }
})

// PUT /api/settings
router.put('/', (req, res) => {
  try {
    const { claudeApiKey } = req.body

    if (claudeApiKey !== undefined) {
      saveSettings({ claudeApiKey })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Save settings error:', error)
    res.status(500).json({ error: 'Failed to save settings' })
  }
})

// POST /api/settings/validate-api-key
router.post('/validate-api-key', async (req, res) => {
  try {
    const { apiKey } = req.body

    if (!apiKey) {
      return res.status(400).json({ valid: false, error: 'API 키가 필요합니다.' })
    }

    // Anthropic API 테스트 호출
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const client = new Anthropic({ apiKey })

    await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Hi' }]
    })

    res.json({ valid: true })
  } catch (error) {
    console.error('API key validation error:', error)
    res.json({
      valid: false,
      error: error instanceof Error ? error.message : 'API 키 검증 실패'
    })
  }
})

export default router
