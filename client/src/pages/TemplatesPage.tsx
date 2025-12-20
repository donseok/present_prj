import { useState, useEffect, useRef } from 'react'
import { templateApi } from '../services/api'
import type { Template } from '../types'

const documentTypes = [
  { value: '프로젝트계획서', label: '프로젝트 계획서', icon: '📋' },
  { value: '요구사항정의서', label: '요구사항 정의서', icon: '📝' },
  { value: 'WBS', label: 'WBS', icon: '📊' },
  { value: '설계문서', label: '설계 문서', icon: '🏗️' },
  { value: '기타', label: '기타', icon: '📄' },
]

function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedType, setSelectedType] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      const data = await templateApi.getAll()
      setTemplates(data)
    } catch (error) {
      console.error('Failed to load templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setShowModal(true)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !selectedType) return

    setUploading(true)
    try {
      await templateApi.upload(selectedFile, selectedType)
      await loadTemplates()
      setShowModal(false)
      setSelectedFile(null)
      setSelectedType('')
    } catch (error) {
      console.error('Failed to upload template:', error)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      await templateApi.delete(id)
      setTemplates(templates.filter((t) => t.id !== id))
    } catch (error) {
      console.error('Failed to delete template:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">템플릿</h1>
          <p className="text-gray-400 mt-1">문서 템플릿을 업로드하고 관리하세요</p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx,.pptx"
            onChange={handleFileSelect}
            className="hidden"
            id="template-upload"
          />
          <label
            htmlFor="template-upload"
            className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>템플릿 업로드</span>
          </label>
        </div>
      </div>

      {/* Placeholder Guide */}
      <div className="card p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl flex-shrink-0">
            💡
          </div>
          <div>
            <h3 className="font-semibold text-white mb-2">플레이스홀더 사용법</h3>
            <p className="text-sm text-gray-400 mb-4">
              템플릿 파일에 다음 형식으로 플레이스홀더를 추가하면 자동으로 데이터가 삽입됩니다.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {['프로젝트명', '고객사', '시작일', '종료일', '설명', '범위'].map((ph) => (
                <code
                  key={ph}
                  className="px-3 py-2 bg-purple-500/20 text-purple-300 text-sm font-mono rounded-lg text-center"
                >
                  {`{{${ph}}}`}
                </code>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
            <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">템플릿이 없습니다</h3>
          <p className="text-gray-400 mb-6">DOCX 또는 PPTX 파일을 업로드해주세요.</p>
          <label
            htmlFor="template-upload"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-xl transition-all duration-300 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            첫 템플릿 업로드
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className="card p-6 group"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl shadow-lg ${template.format === 'docx'
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-500'
                  : 'bg-gradient-to-br from-orange-500 to-red-500'
                  }`}>
                  {template.format === 'docx' ? '📄' : '📊'}
                </div>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${template.format === 'docx'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-orange-500/20 text-orange-400'
                  }`}>
                  {template.format.toUpperCase()}
                </span>
              </div>

              {/* Card Body */}
              <h3 className="font-semibold text-white mb-1 truncate group-hover:text-purple-400 transition-colors">
                {template.name}
              </h3>
              <p className="text-sm text-gray-400 mb-4">{template.documentType}</p>

              {/* Placeholders */}
              {template.placeholders.length > 0 ? (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">감지된 플레이스홀더</p>
                  <div className="flex flex-wrap gap-1">
                    {template.placeholders.slice(0, 4).map((ph) => (
                      <span
                        key={ph}
                        className="px-2 py-1 text-xs bg-purple-500/20 text-purple-300 rounded-md"
                      >
                        {ph}
                      </span>
                    ))}
                    {template.placeholders.length > 4 && (
                      <span className="px-2 py-1 text-xs text-gray-500">
                        +{template.placeholders.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mb-4 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-xs text-yellow-400">
                    ⚠️ 플레이스홀더가 감지되지 않았습니다.
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    템플릿에 {'{{프로젝트명}}'} 형식으로 작성했는지 확인하세요.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="pt-4 border-t border-purple-500/20">
                <button
                  onClick={() => handleDelete(template.id)}
                  className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="relative card p-8 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-2">템플릿 업로드</h2>
            <p className="text-gray-400 text-sm mb-6">
              {selectedFile?.name}
            </p>

            <div className="space-y-3 mb-6">
              <p className="text-sm font-medium text-gray-300">문서 유형 선택</p>
              {documentTypes.map((type) => (
                <label
                  key={type.value}
                  className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all ${selectedType === type.value
                    ? 'bg-purple-500/20 border-2 border-purple-500'
                    : 'bg-[#252540] border-2 border-transparent hover:border-purple-500/30'
                    }`}
                >
                  <input
                    type="radio"
                    name="docType"
                    value={type.value}
                    checked={selectedType === type.value}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="hidden"
                  />
                  <span className="text-xl">{type.icon}</span>
                  <span className="font-medium text-white">{type.label}</span>
                  {selectedType === type.value && (
                    <svg className="w-5 h-5 text-purple-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false)
                  setSelectedFile(null)
                  setSelectedType('')
                }}
                className="flex-1 px-4 py-3 text-gray-300 font-medium rounded-xl hover:bg-[#252540] transition-all"
              >
                취소
              </button>
              <button
                onClick={handleUpload}
                disabled={!selectedType || uploading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl shadow-lg disabled:opacity-50 transition-all"
              >
                {uploading ? (
                  <>
                    <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                    업로드 중...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    업로드
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TemplatesPage
