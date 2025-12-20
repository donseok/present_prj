import { useState, useEffect, useRef } from 'react'
import { analyzeApi } from '../services/api'
import type { FolderItem } from '../types'

interface FolderPickerProps {
  value: string
  onChange: (path: string) => void
  placeholder?: string
  className?: string
}

function FolderPicker({ value, onChange, placeholder = '폴더를 선택하세요', className }: FolderPickerProps) {
  const [showBrowser, setShowBrowser] = useState(false)
  const [currentPath, setCurrentPath] = useState('')
  const [parentPath, setParentPath] = useState<string | null>(null)
  const [items, setItems] = useState<FolderItem[]>([])
  const [drives, setDrives] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowBrowser(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      const [driveList, browseResult] = await Promise.all([
        analyzeApi.getDrives(),
        analyzeApi.browse(value || undefined)
      ])
      setDrives(driveList)
      setCurrentPath(browseResult.currentPath)
      setParentPath(browseResult.parentPath)
      setItems(browseResult.items)
    } catch (error) {
      console.error('Failed to load folder data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpen = () => {
    setShowBrowser(true)
    loadInitialData()
  }

  const browsePath = async (path: string) => {
    setLoading(true)
    try {
      const result = await analyzeApi.browse(path)
      setCurrentPath(result.currentPath)
      setParentPath(result.parentPath)
      setItems(result.items)
    } catch (error) {
      console.error('Failed to browse path:', error)
    } finally {
      setLoading(false)
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

  const handleSelect = () => {
    onChange(currentPath)
    setShowBrowser(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={value}
          readOnly
          placeholder={placeholder}
          className={`${className} pr-10 cursor-pointer`}
          onClick={handleOpen}
        />
        <button
          type="button"
          onClick={handleOpen}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-purple-400 transition-colors rounded-lg hover:bg-purple-500/10"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        </button>
      </div>

      {showBrowser && (
        <div className="absolute z-50 mt-2 p-4 bg-[#1e1e38] border border-purple-500/30 rounded-xl shadow-2xl shadow-purple-500/20 w-full min-w-[400px]">
          {/* Current Path */}
          <div className="mb-3 p-2 bg-[#252540] rounded-lg text-sm text-gray-300 truncate">
            {currentPath}
          </div>

          {/* Drives */}
          <div className="flex gap-2 mb-3 flex-wrap">
            {drives.map((drive) => (
              <button
                key={drive}
                onClick={() => browsePath(drive)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  currentPath.startsWith(drive)
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'bg-[#252540] text-gray-400 hover:text-white'
                }`}
              >
                {drive}
              </button>
            ))}
          </div>

          {/* Parent folder button */}
          {parentPath && (
            <button
              onClick={() => browsePath(parentPath)}
              className="flex items-center gap-2 w-full p-2 text-left text-gray-400 hover:text-white hover:bg-[#252540] rounded-lg mb-1 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span>..</span>
            </button>
          )}

          {/* Folder list */}
          <div className="max-h-48 overflow-y-auto space-y-0.5">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin"></div>
              </div>
            ) : (
              items.filter(i => i.isDirectory).map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleItemClick(item)}
                  className="flex items-center gap-2 w-full p-2 text-left text-white hover:bg-[#252540] rounded-lg text-sm"
                >
                  <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                  </svg>
                  <span className="truncate">{item.name}</span>
                </button>
              ))
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-4 pt-3 border-t border-purple-500/20 flex gap-2">
            <button
              onClick={() => setShowBrowser(false)}
              className="flex-1 py-2 text-sm text-gray-400 hover:text-white hover:bg-[#252540] rounded-lg transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSelect}
              className="flex-1 py-2 text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all"
            >
              선택
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default FolderPicker
