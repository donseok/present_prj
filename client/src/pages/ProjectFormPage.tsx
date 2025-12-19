import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { projectApi } from '../services/api'
import type { Project, TeamMember, Milestone } from '../types'

const emptyProject: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  client: '',
  description: '',
  scope: '',
  startDate: '',
  endDate: '',
  status: '진행중',
  team: [],
  milestones: [],
  requirements: {
    functional: [],
    nonFunctional: [],
  },
}

function ProjectFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(emptyProject)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const isEdit = Boolean(id)

  useEffect(() => {
    if (id) {
      loadProject(id)
    }
  }, [id])

  const loadProject = async (projectId: string) => {
    setLoading(true)
    try {
      const data = await projectApi.getById(projectId)
      setProject(data)
    } catch (error) {
      console.error('Failed to load project:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (isEdit && id) {
        await projectApi.update(id, project)
      } else {
        await projectApi.create(project)
      }
      navigate('/projects')
    } catch (error) {
      console.error('Failed to save project:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setProject((prev) => ({ ...prev, [field]: value }))
  }

  const addTeamMember = () => {
    const newMember: TeamMember = { name: '', role: '', responsibility: '' }
    setProject((prev) => ({ ...prev, team: [...prev.team, newMember] }))
  }

  const updateTeamMember = (index: number, field: keyof TeamMember, value: string) => {
    setProject((prev) => ({
      ...prev,
      team: prev.team.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
    }))
  }

  const removeTeamMember = (index: number) => {
    setProject((prev) => ({ ...prev, team: prev.team.filter((_, i) => i !== index) }))
  }

  const addMilestone = () => {
    const newMilestone: Milestone = { name: '', date: '', deliverables: '' }
    setProject((prev) => ({ ...prev, milestones: [...prev.milestones, newMilestone] }))
  }

  const updateMilestone = (index: number, field: keyof Milestone, value: string) => {
    setProject((prev) => ({
      ...prev,
      milestones: prev.milestones.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
    }))
  }

  const removeMilestone = (index: number) => {
    setProject((prev) => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index),
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin"></div>
      </div>
    )
  }

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
        <h1 className="text-3xl font-bold text-white">
          {isEdit ? '프로젝트 수정' : '새 프로젝트'}
        </h1>
        <p className="text-gray-400 mt-1">
          {isEdit ? '프로젝트 정보를 수정하세요' : '새로운 프로젝트를 생성하세요'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
              <label className="block text-sm font-medium text-gray-300 mb-2">
                프로젝트명 <span className="text-pink-500">*</span>
              </label>
              <input
                type="text"
                required
                value={project.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="프로젝트명을 입력하세요"
                className="input-dark"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                고객사 / 담당 조직 <span className="text-pink-500">*</span>
              </label>
              <input
                type="text"
                required
                value={project.client}
                onChange={(e) => handleChange('client', e.target.value)}
                placeholder="고객사 또는 담당 조직명"
                className="input-dark"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                시작일 <span className="text-pink-500">*</span>
              </label>
              <input
                type="date"
                required
                value={project.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                className="input-dark"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                종료일 <span className="text-pink-500">*</span>
              </label>
              <input
                type="date"
                required
                value={project.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                className="input-dark"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                프로젝트 설명
              </label>
              <textarea
                rows={3}
                value={project.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="프로젝트에 대한 간략한 설명을 입력하세요"
                className="input-dark resize-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                수행 범위
              </label>
              <textarea
                rows={3}
                value={project.scope}
                onChange={(e) => handleChange('scope', e.target.value)}
                placeholder="프로젝트 수행 범위를 입력하세요"
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

          {project.team.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-purple-500/20 rounded-xl">
              <svg className="w-12 h-12 mx-auto text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              <p className="text-gray-500">팀원을 추가해주세요</p>
            </div>
          ) : (
            <div className="space-y-3">
              {project.team.map((member, index) => (
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

          {project.milestones.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-purple-500/20 rounded-xl">
              <svg className="w-12 h-12 mx-auto text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-500">마일스톤을 추가해주세요</p>
            </div>
          ) : (
            <div className="space-y-3">
              {project.milestones.map((milestone, index) => (
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
                  <input
                    type="date"
                    value={milestone.date}
                    onChange={(e) => updateMilestone(index, 'date', e.target.value)}
                    className="w-44 px-4 py-2 bg-[#1a1a2e] border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
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

        {/* 버튼 */}
        <div className="flex justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate('/projects')}
            className="px-6 py-3 text-gray-400 font-medium rounded-xl hover:bg-[#252540] transition-all"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all disabled:opacity-50"
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
                저장하기
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ProjectFormPage
