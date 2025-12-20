import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { analyzeApi, projectApi } from '../services/api'
import type { AnalyzedProjectInfo, FolderItem, TeamMember, Milestone } from '../types'
import DatePicker from '../components/DatePicker'

type Step = 'folder' | 'analyzing' | 'review'

function AnalyzePage() {
  const navigate = useNavigate()

  // 단계 관리
  const [step, setStep] = useState<Step>('folder')

  // 폴더 탐색 상태
  const [currentPath, setCurrentPath] = useState('')
  const [parentPath, setParentPath] = useState<string | null>(null)
  const [items, setItems] = useState<FolderItem[]>([])
  const [drives, setDrives] = useState<string[]>([])
  const [selectedPath, setSelectedPath] = useState('')
  const [pathInput, setPathInput] = useState('')

  // 분석 상태
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState('')

  // 분석 결과
  const [projectInfo, setProjectInfo] = useState<AnalyzedProjectInfo | null>(null)

  // 저장 상태
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      // 드라이브 목록
      const driveList = await analyzeApi.getDrives()
      setDrives(driveList)

      // 기본 경로 로드
      const result = await analyzeApi.browse()
      setCurrentPath(result.currentPath)
      setParentPath(result.parentPath)
      setItems(result.items)
      setPathInput(result.currentPath)
    } catch (error) {
      console.error('Failed to load initial data:', error)
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
    if (!selectedPath) {
      alert('분석할 폴더를 선택해주세요.')
      return
    }

    setStep('analyzing')
    setAnalyzing(true)
    setAnalyzeError('')

    try {
      const result = await analyzeApi.analyzeFolder(selectedPath)

      if (result.success && result.projectInfo) {
        setProjectInfo(result.projectInfo)
        setStep('review')
      } else {
        setAnalyzeError(result.error || '분석에 실패했습니다.')
        setStep('folder')
      }
    } catch (error) {
      console.error('Analyze error:', error)
      setAnalyzeError('분석 중 오류가 발생했습니다.')
      setStep('folder')
    } finally {
      setAnalyzing(false)
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
      alert('프로젝트 저장에 실패했습니다.')
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
          <h2 className="text-2xl font-bold text-white mb-4">프로젝트를 분석하고 있습니다</h2>
          <p className="text-gray-400 mb-6">
            {selectedPath}
          </p>
          <div className="flex justify-center">
            <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 animate-[loading_2s_ease-in-out_infinite]" style={{ width: '60%' }}></div>
            </div>
          </div>
          <p className="text-gray-500 mt-4 text-sm">README, package.json 등 프로젝트 파일을 분석 중...</p>
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
            <span>폴더 다시 선택</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">분석 완료</h1>
              <p className="text-gray-400">추출된 정보를 확인하고 수정하세요</p>
            </div>
          </div>

          {/* 신뢰도 표시 */}
          <div className="mt-4 flex items-center gap-3">
            <span className="text-gray-400 text-sm">분석 신뢰도:</span>
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
              <span className="text-gray-400 text-sm">분석된 파일: </span>
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
              <h2 className="text-lg font-semibold text-white">기본 정보</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">프로젝트명</label>
                <input
                  type="text"
                  value={projectInfo.name}
                  onChange={(e) => handleProjectInfoChange('name', e.target.value)}
                  className="input-dark"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">고객사</label>
                <input
                  type="text"
                  value={projectInfo.client}
                  onChange={(e) => handleProjectInfoChange('client', e.target.value)}
                  className="input-dark"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">시작일</label>
                <DatePicker
                  value={projectInfo.startDate}
                  onChange={(value) => handleProjectInfoChange('startDate', value)}
                  className="input-dark"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">종료일</label>
                <DatePicker
                  value={projectInfo.endDate}
                  onChange={(value) => handleProjectInfoChange('endDate', value)}
                  className="input-dark"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">프로젝트 설명</label>
                <textarea
                  rows={3}
                  value={projectInfo.description}
                  onChange={(e) => handleProjectInfoChange('description', e.target.value)}
                  className="input-dark resize-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">수행 범위</label>
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
                <h2 className="text-lg font-semibold text-white">팀 구성</h2>
              </div>
              <button
                type="button"
                onClick={addTeamMember}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                팀원 추가
              </button>
            </div>

            {projectInfo.team.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-purple-500/20 rounded-xl">
                <p className="text-gray-500">추출된 팀 정보가 없습니다. 팀원을 추가해주세요.</p>
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
                      placeholder="이름"
                      value={member.name}
                      onChange={(e) => updateTeamMember(index, 'name', e.target.value)}
                      className="flex-1 px-4 py-2 bg-[#1a1a2e] border border-purple-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                    <input
                      type="text"
                      placeholder="역할"
                      value={member.role}
                      onChange={(e) => updateTeamMember(index, 'role', e.target.value)}
                      className="flex-1 px-4 py-2 bg-[#1a1a2e] border border-purple-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                    <input
                      type="text"
                      placeholder="담당 업무"
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
                <h2 className="text-lg font-semibold text-white">마일스톤</h2>
              </div>
              <button
                type="button"
                onClick={addMilestone}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                마일스톤 추가
              </button>
            </div>

            {projectInfo.milestones.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-purple-500/20 rounded-xl">
                <p className="text-gray-500">추출된 마일스톤이 없습니다. 마일스톤을 추가해주세요.</p>
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
                      placeholder="마일스톤명"
                      value={milestone.name}
                      onChange={(e) => updateMilestone(index, 'name', e.target.value)}
                      className="flex-1 px-4 py-2 bg-[#1a1a2e] border border-purple-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                    <DatePicker
                      value={milestone.date}
                      onChange={(value) => updateMilestone(index, 'date', value)}
                      className="w-44 px-4 py-2 bg-[#1a1a2e] border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                      placeholder="날짜 선택"
                    />
                    <input
                      type="text"
                      placeholder="산출물"
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
              취소
            </button>
            <button
              onClick={handleSaveProject}
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                  저장 중...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  프로젝트로 저장
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
          <span>프로젝트 목록</span>
        </button>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">프로젝트 폴더 분석</h1>
            <p className="text-gray-400">프로젝트 폴더를 선택하면 자동으로 정보를 추출합니다</p>
          </div>
        </div>
      </div>

      {/* 에러 메시지 */}
      {analyzeError && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
          {analyzeError}
        </div>
      )}

      {/* 폴더 브라우저 */}
      <div className="card p-6">
        {/* 경로 입력 */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={pathInput}
              onChange={(e) => setPathInput(e.target.value)}
              onKeyDown={handlePathInputKeyDown}
              placeholder="경로를 입력하세요"
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
              <p className="text-gray-400 text-sm mb-1">선택된 폴더</p>
              <p className="text-white font-medium">
                {selectedPath || currentPath || '폴더를 선택하세요'}
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
                    폴더 선택됨
                  </>
                ) : (
                  '현재 폴더 선택'
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
                분석 시작
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 안내 */}
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
        <h3 className="text-blue-400 font-medium mb-2">분석되는 항목 (무료 - API 비용 없음)</h3>
        <ul className="text-gray-400 text-sm space-y-1">
          <li>• README.md: 프로젝트 설명, 기능 목록</li>
          <li>• package.json / pom.xml / build.gradle: 프로젝트명, 버전, 의존성</li>
          <li>• PRD.md: 프로젝트 요구사항, 목표, 기능 스펙</li>
          <li>• CLAUDE.md: 프로젝트 개요, 아키텍처, 기술 스택</li>
          <li>• WBS.md: 마일스톤, 단계별 작업, 산출물</li>
          <li>• 폴더 구조: 프로젝트 타입 자동 감지 (React, Node.js, Java 등)</li>
        </ul>
      </div>
    </div>
  )
}

export default AnalyzePage
