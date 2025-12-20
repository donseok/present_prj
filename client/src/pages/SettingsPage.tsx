import { useState, useEffect } from 'react'
import { settingsApi } from '../services/api'

function SettingsPage() {
  const [apiKey, setApiKey] = useState('')
  const [hasApiKey, setHasApiKey] = useState(false)
  const [maskedKey, setMaskedKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [validating, setValidating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const settings = await settingsApi.get()
      setHasApiKey(settings.hasApiKey || false)
      if (settings.claudeApiKey) {
        setMaskedKey(settings.claudeApiKey)
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }

  const handleValidateAndSave = async () => {
    if (!apiKey.trim()) {
      setMessage({ type: 'error', text: 'API 키를 입력해주세요.' })
      return
    }

    setValidating(true)
    setMessage(null)

    try {
      const result = await settingsApi.validateApiKey(apiKey)

      if (result.valid) {
        setSaving(true)
        await settingsApi.update({ claudeApiKey: apiKey })
        setHasApiKey(true)
        setMaskedKey('***' + apiKey.slice(-4))
        setApiKey('')
        setMessage({ type: 'success', text: 'API 키가 성공적으로 저장되었습니다.' })
      } else {
        setMessage({ type: 'error', text: 'API 키가 유효하지 않습니다: ' + (result.error || '알 수 없는 오류') })
      }
    } catch (error) {
      console.error('Save error:', error)
      setMessage({ type: 'error', text: 'API 키 저장 중 오류가 발생했습니다.' })
    } finally {
      setValidating(false)
      setSaving(false)
    }
  }

  const handleRemoveApiKey = async () => {
    if (!confirm('API 키를 삭제하시겠습니까?')) return

    try {
      await settingsApi.update({ claudeApiKey: '' })
      setHasApiKey(false)
      setMaskedKey('')
      setMessage({ type: 'success', text: 'API 키가 삭제되었습니다.' })
    } catch (error) {
      console.error('Remove error:', error)
      setMessage({ type: 'error', text: 'API 키 삭제 중 오류가 발생했습니다.' })
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">설정</h1>
        <p className="text-gray-400 mt-1">애플리케이션 설정을 관리합니다</p>
      </div>

      {/* API 키 설정 */}
      <section className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Claude API 키</h2>
            <p className="text-gray-400 text-sm">AI 프로젝트 분석에 사용됩니다</p>
          </div>
        </div>

        {/* 메시지 */}
        {message && (
          <div className={`mb-4 p-4 rounded-xl ${
            message.type === 'success'
              ? 'bg-green-500/10 border border-green-500/30 text-green-400'
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        {/* 현재 상태 */}
        {hasApiKey && (
          <div className="mb-6 p-4 bg-[#252540] rounded-xl border border-green-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-medium">API 키 설정됨</p>
                  <p className="text-gray-400 text-sm">{maskedKey}</p>
                </div>
              </div>
              <button
                onClick={handleRemoveApiKey}
                className="px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        )}

        {/* 새 API 키 입력 */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {hasApiKey ? '새 API 키로 변경' : 'API 키 입력'}
          </label>
          <div className="flex gap-3">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-api..."
              className="flex-1 input-dark"
            />
            <button
              onClick={handleValidateAndSave}
              disabled={validating || saving || !apiKey.trim()}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all disabled:opacity-50"
            >
              {validating ? '검증 중...' : saving ? '저장 중...' : '저장'}
            </button>
          </div>
          <p className="mt-2 text-gray-500 text-sm">
            <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">
              Anthropic Console
            </a>
            에서 API 키를 발급받을 수 있습니다.
          </p>
        </div>
      </section>

      {/* 앱 정보 */}
      <section className="card p-6 mt-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-white">앱 정보</h2>
        </div>

        <div className="space-y-3 text-gray-400">
          <div className="flex justify-between">
            <span>버전</span>
            <span className="text-white">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span>이름</span>
            <span className="text-white">SI-Doc-Creator (DocuGen)</span>
          </div>
          <div className="flex justify-between">
            <span>AI 모델</span>
            <span className="text-white">Claude Sonnet 4</span>
          </div>
        </div>
      </section>
    </div>
  )
}

export default SettingsPage
