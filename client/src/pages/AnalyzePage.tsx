import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { analyzeApi, projectApi } from '../services/api'
import type { AnalyzedProjectInfo, FolderItem, TeamMember, Milestone } from '../types'
import DatePicker from '../components/DatePicker'
import { useLanguage } from '../contexts/LanguageContext'

type Step = 'folder' | 'analyzing' | 'review'
type Mode = 'local' | 'upload'

function AnalyzePage() {
  const navigate = useNavigate()
  const { t } = useLanguage()

  // 환경 감지 (로컬 서버 vs 웹 배포)
  const [mode, setMode] = useState<Mode>('upload')
  const [isLocalAvailable, setIsLocalAvailable] = useState(false)

  // 단계 관리
  const [step, setStep] = useState<Step>('folder')

  // 폴더 탐색 상태 (로컬 모드)
  const [currentPath, setCurrentPath] = useState('')
  const [parentPath, setParentPath] = useState<string | null>(null)
  const [items, setItems] = useState<FolderItem[]>([])
  const [drives, setDrives] = useState<string[]>([])
  const [selectedPath, setSelectedPath] = useState('')
  const [pathInput, setPathInput] = useState('')

  // 파일 업로드 상태 (웹 모드)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 분석 상태
  const [analyzeError, setAnalyzeError] = useState('')

  // 분석 결과
  const [projectInfo, setProjectInfo] = useState<AnalyzedProjectInfo | null>(null)

  // 저장 상태
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    checkLocalAvailability()
  }, [])

  const checkLocalAvailability = async () => {
    try {
      // 로컬 서버 API 테스트
      const driveList = await analyzeApi.getDrives()
      if (driveList && driveList.length > 0) {
        setIsLocalAvailable(true)
        setMode('local')
        setDrives(driveList)

        // 기본 경로 로드
        const result = await analyzeApi.browse()
        setCurrentPath(result.currentPath)
        setParentPath(result.parentPath)
        setItems(result.items)
        setPathInput(result.currentPath)
      }
    } catch (error) {
      // 로컬 API 실패 시 업로드 모드로 설정
      console.log('Local API not available, using upload mode')
      setIsLocalAvailable(false)
      setMode('upload')
    }
  }

  const browsePath = async (path: string) => {
    try {
      const result = await analyzeApi.browse(path)
      setCurrentPath(result.currentPath)
      setParentPath(result.parentPath)
      setItems(result.items)
      setPathInput(result.currentPath)
    } catch (error) {
      console.error('Failed to browse path:', error)
    }
  }

  const handleItemClick = (item: FolderItem) => {
    if (item.isDirectory) {
      const newPath = currentPath.endsWith('\\') || currentPath.endsWith('/')
        ? currentPath + item.name
        : currentPath + '\\' + item.name
      browsePath(newPath)
    }
  }

  const handleItemDoubleClick = (item: FolderItem) => {
    if (item.isDirectory) {
      const newPath = currentPath.endsWith('\\') || currentPath.endsWith('/')
        ? currentPath + item.name
        : currentPath + '\\' + item.name
      setSelectedPath(newPath)
    }
  }

  const handleSelectFolder = () => {
    setSelectedPath(currentPath)
  }

  const handlePathInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      browsePath(pathInput)
    }
  }

  const handleAnalyze = async () => {
    if (mode === 'local') {
      if (!selectedPath) {
        alert(t.analyze.selectFolderPrompt)
        return
      }

      setStep('analyzing')
      setAnalyzeError('')

      try {
        const result = await analyzeApi.analyzeFolder(selectedPath)

        if (result.success && result.projectInfo) {
          setProjectInfo(result.projectInfo)
          setStep('review')
        } else {
          setAnalyzeError(result.error || t.errors?.loadFailed || 'Failed to analyze')
          setStep('folder')
        }
      } catch (error) {
        console.error('Analyze error:', error)
        setAnalyzeError(t.errors?.loadFailed || 'Failed to analyze')
        setStep('folder')
      }
    } else {
      // 업로드 모드 - 클라이언트에서 직접 파일 분석
      if (uploadedFiles.length === 0) {
        alert(t.analyze.uploadPrompt || 'Please upload project files')
        return
      }

      setStep('analyzing')
      setAnalyzeError('')

      try {
        const result = await analyzeUploadedFiles(uploadedFiles)
        setProjectInfo(result)
        setStep('review')
      } catch (error) {
        console.error('Analyze error:', error)
        setAnalyzeError(t.errors?.loadFailed || 'Failed to analyze')
        setStep('folder')
      }
    }
  }

  // 파일 업로드 핸들러
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      setUploadedFiles(prev => [...prev, ...Array.from(files)])
    }
  }

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (files) {
      setUploadedFiles(prev => [...prev, ...Array.from(files)])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  // 업로드된 파일 분석 (클라이언트 사이드)
  const analyzeUploadedFiles = async (files: File[]): Promise<AnalyzedProjectInfo> => {
    const analyzedFiles: string[] = []
    let projectName = ''
    let description = ''
    let client = ''
    const features: string[] = []
    const team: TeamMember[] = []
    const milestones: Milestone[] = []

    for (const file of files) {
      const content = await file.text()
      const fileName = file.name.toLowerCase()
      analyzedFiles.push(file.name)

      // README.md 분석
      if (fileName === 'readme.md') {
        const titleMatch = content.match(/^#\s+(.+)$/m)
        if (titleMatch) projectName = titleMatch[1]

        const descMatch = content.match(/^#[^#].*\n\n(.+?)(?=\n\n|\n#|$)/s)
        if (descMatch) description = descMatch[1].trim()

        const featureMatches = content.match(/[-*]\s+(.+)/g)
        if (featureMatches) {
          features.push(...featureMatches.slice(0, 10).map(f => f.replace(/^[-*]\s+/, '')))
        }
      }

      // package.json 분석
      if (fileName === 'package.json') {
        try {
          const pkg = JSON.parse(content)
          if (pkg.name && !projectName) projectName = pkg.name
          if (pkg.description && !description) description = pkg.description
          if (pkg.author) {
            const authorName = typeof pkg.author === 'string' ? pkg.author : pkg.author.name
            if (authorName) {
              team.push({ name: authorName, role: 'Developer', responsibility: 'Project Lead' })
            }
          }
        } catch (e) {
          console.error('Failed to parse package.json')
        }
      }

      // PRD.md 분석
      if (fileName === 'prd.md') {
        const titleMatch = content.match(/^#\s+(.+)$/m)
        if (titleMatch && !projectName) projectName = titleMatch[1]

        const featureMatches = content.match(/[-*]\s+(.+)/g)
        if (featureMatches) {
          features.push(...featureMatches.slice(0, 10).map(f => f.replace(/^[-*]\s+/, '')))
        }
      }

      // WBS.md 분석
      if (fileName === 'wbs.md') {
        const milestoneMatches = content.match(/##\s+(.+)/g)
        if (milestoneMatches) {
          milestoneMatches.slice(0, 5).forEach(m => {
            milestones.push({
              name: m.replace(/^##\s+/, ''),
              date: '',
              deliverables: ''
            })
          })
        }
      }
    }

    return {
      name: projectName || 'Untitled Project',
      client: client,
      description: description || features.join(', '),
      scope: features.slice(0, 5).join('\n'),
      startDate: '',
      endDate: '',
      status: 'In Progress',
      team,
      milestones,
      requirements: {
        functional: features.slice(0, 5).map((f, i) => ({
          id: `FR-${String(i + 1).padStart(3, '0')}`,
          category: 'Feature',
          description: f,
          priority: i < 3 ? 'high' as const : 'medium' as const
        })),
        nonFunctional: []
      },
      confidence: files.length >= 3 ? 0.8 : files.length >= 2 ? 0.6 : 0.4,
      analyzedFiles
    }
  }

  const handleProjectInfoChange = (field: keyof AnalyzedProjectInfo, value: string) => {
    if (projectInfo) {
      setProjectInfo({ ...projectInfo, [field]: value })
    }
  }

  const addTeamMember = () => {
    if (projectInfo) {
      const newMember: TeamMember = { name: '', role: '', responsibility: '' }
      setProjectInfo({ ...projectInfo, team: [...projectInfo.team, newMember] })
    }
  }

  const updateTeamMember = (index: number, field: keyof TeamMember, value: string) => {
    if (projectInfo) {
      const newTeam = [...projectInfo.team]
      newTeam[index] = { ...newTeam[index], [field]: value }
      setProjectInfo({ ...projectInfo, team: newTeam })
    }
  }

  const removeTeamMember = (index: number) => {
    if (projectInfo) {
      setProjectInfo({ ...projectInfo, team: projectInfo.team.filter((_, i) => i !== index) })
    }
  }

  const addMilestone = () => {
    if (projectInfo) {
      const newMilestone: Milestone = { name: '', date: '', deliverables: '' }
      setProjectInfo({ ...projectInfo, milestones: [...projectInfo.milestones, newMilestone] })
    }
  }

  const updateMilestone = (index: number, field: keyof Milestone, value: string) => {
    if (projectInfo) {
      const newMilestones = [...projectInfo.milestones]
      newMilestones[index] = { ...newMilestones[index], [field]: value }
      setProjectInfo({ ...projectInfo, milestones: newMilestones })
    }
  }

  const removeMilestone = (index: number) => {
    if (projectInfo) {
      setProjectInfo({ ...projectInfo, milestones: projectInfo.milestones.filter((_, i) => i !== index) })
    }
  }

  const handleSaveProject = async () => {
    if (!projectInfo) return

    setSaving(true)
    try {
      const { analyzedFiles, confidence, ...projectData } = projectInfo
      await projectApi.create(projectData)
      navigate('/projects')
    } catch (error) {
      console.error('Save error:', error)
      alert(t.errors.saveFailed)
    } finally {
      setSaving(false)
    }
  }

  // 분석 중 화면
  if (step === 'analyzing') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <svg className="w-10 h-10 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">{t.analyze.analyzing}</h2>
          <p className="text-gray-400 mb-6">
            {selectedPath}
          </p>
          <div className="flex justify-center">
            <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 animate-[loading_2s_ease-in-out_infinite]" style={{ width: '60%' }}></div>
            </div>
          </div>
          <p className="text-gray-500 mt-4 text-sm">{t.analyze.infoReadme}</p>
        </div>
      </div>
    )
  }

  // 분석 결과 검토 화면
  if (step === 'review' && projectInfo) {
    return (
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => setStep('folder')}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>{t.analyze.reanalyze}</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{t.analyze.analysisResult}</h1>
              <p className="text-gray-400">{t.analyze.subtitle}</p>
            </div>
          </div>

          {/* 신뢰도 표시 */}
          <div className="mt-4 flex items-center gap-3">
            <span className="text-gray-400 text-sm">{t.analyze.confidence}:</span>
            <div className="flex-1 max-w-xs h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                style={{ width: `${(projectInfo.confidence || 0) * 100}%` }}
              ></div>
            </div>
            <span className="text-green-400 font-medium">{Math.round((projectInfo.confidence || 0) * 100)}%</span>
          </div>

          {/* 분석된 파일 */}
          {projectInfo.analyzedFiles && projectInfo.analyzedFiles.length > 0 && (
            <div className="mt-4">
              <span className="text-gray-400 text-sm">{t.analyze.analyzedFiles}: </span>
              <span className="text-gray-300 text-sm">{projectInfo.analyzedFiles.join(', ')}</span>
            </div>
          )}
        </div>

        {/* 수정 가능한 폼 */}
        <div className="space-y-6">
          {/* 기본 정보 */}
          <section className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-white">{t.projectForm.basicInfo}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t.projects.projectName}</label>
                <input
                  type="text"
                  value={projectInfo.name}
                  onChange={(e) => handleProjectInfoChange('name', e.target.value)}
                  className="input-dark"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t.projects.client}</label>
                <input
                  type="text"
                  value={projectInfo.client}
                  onChange={(e) => handleProjectInfoChange('client', e.target.value)}
                  className="input-dark"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t.projects.startDate}</label>
                <DatePicker
                  value={projectInfo.startDate}
                  onChange={(value) => handleProjectInfoChange('startDate', value)}
                  className="input-dark"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t.projects.endDate}</label>
                <DatePicker
                  value={projectInfo.endDate}
                  onChange={(value) => handleProjectInfoChange('endDate', value)}
                  className="input-dark"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">{t.projects.description}</label>
                <textarea
                  rows={3}
                  value={projectInfo.description}
                  onChange={(e) => handleProjectInfoChange('description', e.target.value)}
                  className="input-dark resize-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">{t.projects.scope}</label>
                <textarea
                  rows={3}
                  value={projectInfo.scope}
                  onChange={(e) => handleProjectInfoChange('scope', e.target.value)}
                  className="input-dark resize-none"
                />
              </div>
            </div>
          </section>

          {/* 팀 구성 */}
          <section className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-white">{t.projectForm.teamInfo}</h2>
              </div>
              <button
                type="button"
                onClick={addTeamMember}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t.projectForm.addTeamMember}
              </button>
            </div>

            {projectInfo.team.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-purple-500/20 rounded-xl">
                <p className="text-gray-500">{t.common.noData}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {projectInfo.team.map((member, index) => (
                  <div key={index} className="flex gap-3 items-center p-4 bg-[#252540] rounded-xl border border-purple-500/20">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium">
                      {member.name ? member.name.charAt(0) : (index + 1)}
                    </div>
                    <input
                      type="text"
                      placeholder={t.projectForm.memberName}
                      value={member.name}
                      onChange={(e) => updateTeamMember(index, 'name', e.target.value)}
                      className="flex-1 px-4 py-2 bg-[#1a1a2e] border border-purple-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                    <input
                      type="text"
                      placeholder={t.projectForm.memberRole}
                      value={member.role}
                      onChange={(e) => updateTeamMember(index, 'role', e.target.value)}
                      className="flex-1 px-4 py-2 bg-[#1a1a2e] border border-purple-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                    <input
                      type="text"
                      placeholder={t.projectForm.memberResponsibility}
                      value={member.responsibility}
                      onChange={(e) => updateTeamMember(index, 'responsibility', e.target.value)}
                      className="flex-1 px-4 py-2 bg-[#1a1a2e] border border-purple-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeTeamMember(index)}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 마일스톤 */}
          <section className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-white">{t.projectForm.milestoneInfo}</h2>
              </div>
              <button
                type="button"
                onClick={addMilestone}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t.projectForm.addMilestone}
              </button>
            </div>

            {projectInfo.milestones.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-purple-500/20 rounded-xl">
                <p className="text-gray-500">{t.common.noData}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {projectInfo.milestones.map((milestone, index) => (
                  <div key={index} className="flex gap-3 items-center p-4 bg-[#252540] rounded-xl border border-purple-500/20">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-medium">
                      {index + 1}
                    </div>
                    <input
                      type="text"
                      placeholder={t.projectForm.milestoneName}
                      value={milestone.name}
                      onChange={(e) => updateMilestone(index, 'name', e.target.value)}
                      className="flex-1 px-4 py-2 bg-[#1a1a2e] border border-purple-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                    <DatePicker
                      value={milestone.date}
                      onChange={(value) => updateMilestone(index, 'date', value)}
                      className="w-44 px-4 py-2 bg-[#1a1a2e] border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                      placeholder={t.projectForm.milestoneDueDate}
                    />
                    <input
                      type="text"
                      placeholder={t.projectForm.milestoneDescription}
                      value={milestone.deliverables}
                      onChange={(e) => updateMilestone(index, 'deliverables', e.target.value)}
                      className="flex-1 px-4 py-2 bg-[#1a1a2e] border border-purple-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeMilestone(index)}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 저장 버튼 */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => setStep('folder')}
              className="px-6 py-3 text-gray-400 font-medium rounded-xl hover:bg-[#252540] transition-all"
            >
              {t.common.cancel}
            </button>
            <button
              onClick={handleSaveProject}
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                  {t.common.loading}
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {t.analyze.createProject}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 폴더 선택 화면 (기본)
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>{t.nav.projects}</span>
        </button>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{t.analyze.title}</h1>
            <p className="text-gray-400">{t.analyze.subtitle}</p>
          </div>
        </div>
      </div>

      {/* 에러 메시지 */}
      {analyzeError && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
          {analyzeError}
        </div>
      )}

      {/* 모드 선택 탭 (로컬이 가능한 경우에만 표시) */}
      {isLocalAvailable && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('local')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              mode === 'local'
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : 'bg-[#252540] text-gray-400 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            {t.analyze.localMode || '로컬 폴더'}
          </button>
          <button
            onClick={() => setMode('upload')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              mode === 'upload'
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : 'bg-[#252540] text-gray-400 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {t.analyze.uploadMode || '파일 업로드'}
          </button>
        </div>
      )}

      {/* 로컬 모드: 폴더 브라우저 */}
      {mode === 'local' && (
        <div className="card p-6">
          {/* 경로 입력 */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={pathInput}
                onChange={(e) => setPathInput(e.target.value)}
                onKeyDown={handlePathInputKeyDown}
                placeholder={t.common.search}
                className="input-dark pr-10"
              />
              <button
                onClick={() => browsePath(pathInput)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* 드라이브 선택 */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {drives.map((drive) => (
              <button
                key={drive}
                onClick={() => browsePath(drive)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentPath.startsWith(drive)
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'bg-[#252540] text-gray-400 hover:text-white'
                }`}
              >
                {drive}
              </button>
            ))}
          </div>

          {/* 상위 폴더 버튼 */}
          {parentPath && (
            <button
              onClick={() => browsePath(parentPath)}
              className="flex items-center gap-2 w-full p-3 text-left text-gray-400 hover:text-white hover:bg-[#252540] rounded-lg mb-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span>..</span>
            </button>
          )}

          {/* 폴더/파일 목록 */}
          <div className="max-h-80 overflow-y-auto space-y-1">
            {items.map((item) => (
              <button
                key={item.name}
                onClick={() => handleItemClick(item)}
                onDoubleClick={() => handleItemDoubleClick(item)}
                className={`flex items-center gap-3 w-full p-3 text-left rounded-lg transition-colors ${
                  item.isDirectory
                    ? 'text-white hover:bg-[#252540]'
                    : 'text-gray-500 cursor-default'
                }`}
              >
                {item.isDirectory ? (
                  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
                <span>{item.name}</span>
              </button>
            ))}
          </div>

          {/* 선택된 폴더 표시 및 버튼 */}
          <div className="mt-6 pt-6 border-t border-purple-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">{t.analyze.selectedFolder}</p>
                <p className="text-white font-medium">
                  {selectedPath || currentPath || t.analyze.selectFolderPrompt}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSelectFolder}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                    selectedPath
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-[#252540] text-white hover:bg-[#303055]'
                  }`}
                >
                  {selectedPath ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {t.analyze.folderSelected}
                    </>
                  ) : (
                    t.analyze.currentFolder
                  )}
                </button>
                <button
                  onClick={handleAnalyze}
                  disabled={!selectedPath && !currentPath}
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {t.analyze.analyze}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 업로드 모드: 파일 업로드 */}
      {mode === 'upload' && (
        <div className="card p-6">
          {/* 드래그 앤 드롭 영역 */}
          <div
            onDrop={handleFileDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-purple-500/30 rounded-xl p-8 text-center hover:border-purple-500/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".md,.json,.xml,.gradle,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            <svg className="w-12 h-12 mx-auto mb-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <p className="text-white font-medium mb-2">{t.analyze.dropFiles || '파일을 드래그하거나 클릭하여 선택'}</p>
            <p className="text-gray-400 text-sm">{t.analyze.supportedFiles || 'README.md, package.json, PRD.md, WBS.md, CLAUDE.md 등'}</p>
          </div>

          {/* 업로드된 파일 목록 */}
          {uploadedFiles.length > 0 && (
            <div className="mt-6">
              <h3 className="text-white font-medium mb-3">{t.analyze.uploadedFiles || '업로드된 파일'} ({uploadedFiles.length})</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-[#252540] rounded-lg">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-white">{file.name}</span>
                      <span className="text-gray-500 text-sm">({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 text-red-400 hover:bg-red-500/10 rounded transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 분석 버튼 */}
          <div className="mt-6 pt-6 border-t border-purple-500/20 flex justify-end">
            <button
              onClick={handleAnalyze}
              disabled={uploadedFiles.length === 0}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {t.analyze.analyze}
            </button>
          </div>
        </div>
      )}

      {/* 안내 */}
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
        <h3 className="text-blue-400 font-medium mb-2">{t.analyze.infoTitle}</h3>
        <ul className="text-gray-400 text-sm space-y-1">
          <li>• {t.analyze.infoReadme}</li>
          <li>• {t.analyze.infoPackage}</li>
          <li>• {t.analyze.infoPrd}</li>
          <li>• {t.analyze.infoClaude}</li>
          <li>• {t.analyze.infoWbs}</li>
          {mode === 'upload' && (
            <li className="text-purple-400">• {t.analyze.webModeInfo || '웹 모드: 파일을 업로드하면 브라우저에서 직접 분석합니다 (서버 전송 없음)'}</li>
          )}
        </ul>
      </div>
    </div>
  )
}

export default AnalyzePage
