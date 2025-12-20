import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { projectApi, templateApi, documentApi } from '../services/api'
import FolderPicker from '../components/FolderPicker'
import type { Project, Template } from '../types'

type Language = 'ko' | 'en' | 'vi'
type SaveMode = 'download' | 'folder'

function GeneratePage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([])
  const [generating, setGenerating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [generatedCount, setGeneratedCount] = useState(0)
  const [language, setLanguage] = useState<Language>('ko')
  const [saveMode, setSaveMode] = useState<SaveMode>('download')
  const [savePath, setSavePath] = useState('')
  const [generatedFiles, setGeneratedFiles] = useState<string[]>([])

  useEffect(() => {
    if (projectId) {
      loadData(projectId)
    }
  }, [projectId])

  const loadData = async (id: string) => {
    try {
      const [projectData, templatesData] = await Promise.all([
        projectApi.getById(id),
        templateApi.getAll(),
      ])
      setProject(projectData)
      setTemplates(templatesData)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleTemplate = (templateId: string) => {
    setSelectedTemplates((prev) =>
      prev.includes(templateId)
        ? prev.filter((id) => id !== templateId)
        : [...prev, templateId]
    )
  }

  const selectAll = () => {
    if (selectedTemplates.length === templates.length) {
      setSelectedTemplates([])
    } else {
      setSelectedTemplates(templates.map(t => t.id))
    }
  }

  const handleGenerate = async () => {
    if (!project || selectedTemplates.length === 0) return

    if (saveMode === 'folder' && !savePath) {
      alert('저장할 폴더를 선택해주세요.')
      return
    }

    setGenerating(true)
    setGeneratedCount(0)
    setGeneratedFiles([])

    try {
      const files: string[] = []

      for (let i = 0; i < selectedTemplates.length; i++) {
        const templateId = selectedTemplates[i]
        const template = templates.find((t) => t.id === templateId)

        if (saveMode === 'folder') {
          // 서버에 저장
          const result = await documentApi.generateAndSave(
            project.id,
            templateId,
            savePath,
            template?.format
          )
          files.push(result.filename)
        } else {
          // 브라우저 다운로드
          const blob = await documentApi.generate(project.id, templateId)
          const langSuffix = language === 'ko' ? '' : `_${language.toUpperCase()}`
          const filename = `${project.name}_${template?.documentType || 'document'}${langSuffix}.${template?.format || 'docx'}`

          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = filename
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)

          files.push(filename)
        }

        setGeneratedCount(i + 1)
      }

      setGeneratedFiles(files)
    } catch (error) {
      console.error('Failed to generate documents:', error)
      alert('문서 생성 중 오류가 발생했습니다.')
    } finally {
      setGenerating(false)
    }
  }

  const languageOptions = [
    { value: 'ko', label: '한국어', flag: '🇰🇷' },
    { value: 'en', label: 'English', flag: '🇺🇸' },
    { value: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="card p-12 text-center max-w-lg mx-auto">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
          <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">프로젝트를 찾을 수 없습니다</h3>
        <p className="text-gray-400 mb-6">요청하신 프로젝트가 존재하지 않거나 삭제되었습니다.</p>
        <button
          onClick={() => navigate('/projects')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl shadow-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          프로젝트 목록으로
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>프로젝트 목록</span>
        </button>
        <h1 className="text-3xl font-bold text-white">문서 생성</h1>
        <p className="text-gray-400 mt-1">템플릿을 선택하고 문서를 생성하세요</p>
      </div>

      {/* Project Info Card */}
      <div className="card p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            {project.name.charAt(0)}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-white">{project.name}</h2>
            <p className="text-gray-400">{project.client}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{project.startDate}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{project.endDate}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{project.team.length}명</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>{project.milestones.length}개 마일스톤</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Language Selection */}
      <div className="card p-6">
        <div className="section-title">
          <span>🌐</span>
          <span>문서 언어</span>
        </div>
        <div className="flex gap-3">
          {languageOptions.map((lang) => (
            <button
              key={lang.value}
              onClick={() => setLanguage(lang.value as Language)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all ${
                language === lang.value
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  : 'bg-[#1a1a2e] text-gray-400 hover:bg-[#252540] border border-purple-500/20'
              }`}
            >
              <span className="text-xl">{lang.flag}</span>
              <span className="font-medium">{lang.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Save Location */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">저장 위치</h2>
            <p className="text-sm text-gray-400">문서를 저장할 방식을 선택하세요</p>
          </div>
        </div>

        <div className="flex gap-3 mb-4">
          <button
            onClick={() => setSaveMode('download')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all ${
              saveMode === 'download'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : 'bg-[#1a1a2e] text-gray-400 hover:bg-[#252540] border border-purple-500/20'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="font-medium">브라우저 다운로드</span>
          </button>
          <button
            onClick={() => setSaveMode('folder')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all ${
              saveMode === 'folder'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : 'bg-[#1a1a2e] text-gray-400 hover:bg-[#252540] border border-purple-500/20'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span className="font-medium">폴더에 저장</span>
          </button>
        </div>

        {saveMode === 'folder' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">저장 폴더 선택</label>
            <FolderPicker
              value={savePath}
              onChange={setSavePath}
              placeholder="저장할 폴더를 선택하세요"
              className="input-dark"
            />
          </div>
        )}
      </div>

      {/* Template Selection */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">생성할 문서 선택</h2>
              <p className="text-sm text-gray-400">{selectedTemplates.length}개 선택됨</p>
            </div>
          </div>
          {templates.length > 0 && (
            <button
              onClick={selectAll}
              className="text-sm text-purple-400 hover:text-purple-300 font-medium"
            >
              {selectedTemplates.length === templates.length ? '전체 해제' : '전체 선택'}
            </button>
          )}
        </div>

        {templates.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-purple-500/20 rounded-xl">
            <svg className="w-12 h-12 mx-auto text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 mb-4">등록된 템플릿이 없습니다</p>
            <button
              onClick={() => navigate('/templates')}
              className="text-purple-400 hover:text-purple-300 font-medium"
            >
              템플릿 등록하기
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {templates.map((template) => {
              const isSelected = selectedTemplates.includes(template.id)
              return (
                <label
                  key={template.id}
                  className={`flex items-center p-4 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-purple-500/20 border-2 border-purple-500'
                      : 'bg-[#252540] border-2 border-transparent hover:border-purple-500/30'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'border-2 border-gray-600'
                  }`}>
                    {isSelected && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleTemplate(template.id)}
                    className="hidden"
                  />
                  <div className={`w-10 h-10 ml-4 rounded-lg flex items-center justify-center text-lg ${
                    template.format === 'docx'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-orange-500/20 text-orange-400'
                  }`}>
                    {template.format === 'docx' ? '📄' : '📊'}
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{template.documentType}</span>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                        template.format === 'docx'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-orange-500/20 text-orange-400'
                      }`}>
                        {template.format.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{template.name}</p>
                  </div>
                </label>
              )
            })}
          </div>
        )}
      </div>

      {/* Generated Files Result */}
      {generatedFiles.length > 0 && (
        <div className="card p-6 bg-green-500/10 border border-green-500/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-400">문서 생성 완료!</h3>
              <p className="text-sm text-gray-400">
                {saveMode === 'folder'
                  ? `${generatedFiles.length}개의 문서가 ${savePath}에 저장되었습니다.`
                  : `${generatedFiles.length}개의 문서가 다운로드되었습니다.`}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {generatedFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-gray-300">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>{file}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generate Button */}
      <div className="flex justify-end">
        <button
          onClick={handleGenerate}
          disabled={generating || selectedTemplates.length === 0 || (saveMode === 'folder' && !savePath)}
          className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating ? (
            <>
              <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
              <span>생성 중... ({generatedCount}/{selectedTemplates.length})</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>문서 생성 ({selectedTemplates.length}개)</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default GeneratePage
