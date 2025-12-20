import { useState, useEffect } from 'react'
import { projectApi, templateApi, documentApi } from '../services/api'
import type { Project, Template } from '../types'

// Template type icons
const templateIcons: Record<string, string> = {
  '프로젝트 수행 계획서': '📋',
  '요구사항정의서(PRD)': '📝',
  'WBS': '📊',
  '기본설계서': '🏗️',
  '상세설계서': '📐',
  '중간보고서': '📈',
  '테스트결과서': '✅',
  '종료보고서': '📑',
  '사용자 매뉴얼': '📖',
  '운영자 매뉴얼': '🔧',
}

// Default template options when no templates are uploaded
const defaultTemplateOptions = [
  { id: 'prd', name: '요구사항정의서(PRD)', description: '기능/비기능 요구사항 정의' },
  { id: 'plan', name: '프로젝트 수행 계획서', description: '프로젝트 개요, 일정, 팀 구성' },
  { id: 'wbs', name: 'WBS', description: '작업분해구조, 마일스톤' },
  { id: 'design', name: '기본설계서', description: '시스템 설계, 아키텍처, ERD' },
  { id: 'detail', name: '상세설계서', description: '화면설계, 인터페이스 정의' },
  { id: 'interim', name: '중간보고서', description: '진행현황, 이슈, 계획' },
  { id: 'test', name: '테스트결과서', description: '테스트 수행 결과' },
  { id: 'final', name: '종료보고서', description: '프로젝트 수행 결과' },
  { id: 'user-manual', name: '사용자 매뉴얼', description: '시스템 사용자 가이드' },
  { id: 'admin-manual', name: '운영자 매뉴얼', description: '시스템 운영자 가이드' },
]

type OutputFormat = 'pptx' | 'docx' | 'pdf'

interface GeneratedFile {
  name: string
  format: string
  language: string
  url?: string
  blob?: Blob
}

function HomePage() {
  const [documentTitle, setDocumentTitle] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('pptx')
  const [generating, setGenerating] = useState(false)
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [projectsData, templatesData] = await Promise.all([
        projectApi.getAll(),
        templateApi.getAll(),
      ])
      setProjects(projectsData)
      setTemplates(templatesData)
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }

  const selectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId === selectedTemplate ? null : templateId)
  }

  const handleGenerate = async () => {
    if (!documentTitle.trim() || !selectedTemplate) {
      alert('문서 제목과 템플릿을 선택해주세요.')
      return
    }

    setGenerating(true)
    const newFiles: GeneratedFile[] = []

    try {
      // If a project is selected and templates are available, generate real documents
      if (selectedProject && templates.length > 0) {
        const template = templates.find((t: Template) => t.id === selectedTemplate)
        if (template) {
          const blob = await documentApi.generate(selectedProject, selectedTemplate, outputFormat)
          const filename = `${documentTitle}_${template.documentType}.${outputFormat}`
          newFiles.push({
            name: filename,
            format: outputFormat,
            language: '한국어',
            blob,
          })
        }
      } else {
        // Demo mode - create placeholder files
        const template = defaultTemplateOptions.find(t => t.id === selectedTemplate)
        if (template) {
          const filename = `${documentTitle}_${template.name}.${outputFormat}`
          newFiles.push({
            name: filename,
            format: outputFormat,
            language: '한국어',
          })
        }
      }

      setGeneratedFiles(newFiles)
    } catch (error) {
      console.error('Failed to generate documents:', error)
      alert('문서 생성에 실패했습니다.')
    } finally {
      setGenerating(false)
    }
  }

  const downloadFile = (file: GeneratedFile) => {
    if (file.blob) {
      const url = window.URL.createObjectURL(file.blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } else {
      alert('데모 모드: 실제 문서를 생성하려면 프로젝트와 템플릿을 먼저 등록해주세요.')
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center py-6">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
          <span className="text-3xl">📄</span>
          문서 자동 생성기
        </h1>
        <p className="text-gray-400">버튼 클릭 한 번으로 전문적인 문서를 생성하세요</p>
      </div>

      {/* Document Title Input */}
      <div className="card p-6">
        <div className="section-title">
          <span>📝</span>
          <span>문서 제목</span>
        </div>
        <input
          type="text"
          className="input-dark"
          placeholder="예: 동국제강 공조설비 정비관리 시스템"
          value={documentTitle}
          onChange={(e) => setDocumentTitle(e.target.value)}
        />
      </div>

      {/* Project Selection (if projects exist) */}
      {projects.length > 0 && (
        <div className="card p-6">
          <div className="section-title">
            <span>📁</span>
            <span>프로젝트 선택 (선택사항)</span>
          </div>
          <select
            className="input-dark"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            <option value="">프로젝트를 선택하세요 (선택 안함)</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name} - {project.client}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Template Selection */}
      <div className="card p-6">
        <div className="section-title">
          <span>📋</span>
          <span>템플릿 선택</span>
          <div className="tooltip-container ml-2">
            <svg className="w-4 h-4 text-gray-500 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="tooltip">하나의 템플릿만 선택할 수 있습니다</div>
          </div>
        </div>
        <div className="template-grid">
          {(templates.length > 0 ? templates : defaultTemplateOptions).map((template) => {
            const isTemplateType = 'documentType' in template
            const id = isTemplateType ? template.id : template.id
            const name = isTemplateType ? (template as Template).documentType : template.name
            const desc = isTemplateType ? (template as Template).name : (template as typeof defaultTemplateOptions[0]).description
            const isSelected = selectedTemplate === id

            return (
              <div
                key={id}
                className="tooltip-container"
              >
                <div
                  onClick={() => selectTemplate(id)}
                  className={`template-card ${isSelected ? 'selected' : ''}`}
                >
                  <div className="icon-box mx-auto mb-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                    <span>{templateIcons[name] || '📄'}</span>
                  </div>
                  <div className="font-medium text-white text-sm mb-1">{name}</div>
                  <div className="text-xs text-gray-500 line-clamp-2">{desc}</div>
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="tooltip tooltip-bottom">{desc}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Output Format */}
      <div className="card p-6">
        <div className="section-title">
          <span>💾</span>
          <span>출력 형식</span>
          <div className="tooltip-container ml-2">
            <svg className="w-4 h-4 text-gray-500 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="tooltip">원하는 파일 형식을 선택하세요</div>
          </div>
        </div>
        <div className="flex gap-4 justify-center">
          <div className="tooltip-container">
            <div
              onClick={() => setOutputFormat('pptx')}
              className={`format-card ${outputFormat === 'pptx' ? 'selected' : ''}`}
            >
              <div className="w-16 h-20 mx-auto mb-3 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">P</span>
              </div>
              <div className="font-semibold text-white">PPT</div>
              <div className="text-xs text-gray-500">.pptx</div>
            </div>
            <div className="tooltip tooltip-bottom">PowerPoint 프레젠테이션</div>
          </div>
          <div className="tooltip-container">
            <div
              onClick={() => setOutputFormat('docx')}
              className={`format-card ${outputFormat === 'docx' ? 'selected' : ''}`}
            >
              <div className="w-16 h-20 mx-auto mb-3 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">W</span>
              </div>
              <div className="font-semibold text-white">DOC</div>
              <div className="text-xs text-gray-500">.docx</div>
            </div>
            <div className="tooltip tooltip-bottom">Word 문서</div>
          </div>
          <div className="tooltip-container">
            <div
              onClick={() => setOutputFormat('pdf')}
              className={`format-card ${outputFormat === 'pdf' ? 'selected' : ''}`}
            >
              <div className="w-16 h-20 mx-auto mb-3 rounded-lg bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">PDF</span>
              </div>
              <div className="font-semibold text-white">PDF</div>
              <div className="text-xs text-gray-500">.pdf</div>
            </div>
            <div className="tooltip tooltip-bottom">PDF 문서</div>
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={generating || !documentTitle.trim() || !selectedTemplate}
        className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {generating ? (
          <>
            <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
            <span>생성 중...</span>
          </>
        ) : (
          <>
            <span>✨</span>
            <span>문서 생성하기</span>
          </>
        )}
      </button>

      {/* Generated Files */}
      {generatedFiles.length > 0 && (
        <div className="card p-6">
          <div className="section-title">
            <span>📂</span>
            <span>생성된 파일</span>
          </div>
          <div className="space-y-3">
            {generatedFiles.map((file, index) => (
              <div key={index} className="file-item">
                <div className="flex items-center gap-3">
                  <div className={`icon-box-sm ${file.format === 'pptx'
                      ? 'bg-gradient-to-br from-orange-500/20 to-red-500/20'
                      : file.format === 'pdf'
                        ? 'bg-gradient-to-br from-red-600/20 to-red-800/20'
                        : 'bg-gradient-to-br from-blue-500/20 to-indigo-500/20'
                    }`}>
                    <span>{file.format === 'pptx' ? '📊' : file.format === 'pdf' ? '📕' : '📄'}</span>
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm">{file.name}</div>
                    <div className="text-xs text-gray-500">{file.language}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${file.format === 'pptx' ? 'badge-pink' : file.format === 'pdf' ? 'badge-purple' : 'badge-blue'}`}>
                    {file.format.toUpperCase()}
                  </span>
                  <button
                    onClick={() => downloadFile(file)}
                    className="p-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default HomePage
