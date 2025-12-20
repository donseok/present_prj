import { useState, useRef, useEffect } from 'react'

interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  required?: boolean
  className?: string
  placeholder?: string
}

function DatePicker({ value, onChange, required, className, placeholder = 'YYYY-MM-DD' }: DatePickerProps) {
  const [showCalendar, setShowCalendar] = useState(false)
  const [displayValue, setDisplayValue] = useState(value)
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (value) {
      const date = new Date(value)
      return new Date(date.getFullYear(), date.getMonth(), 1)
    }
    return new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  })
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setDisplayValue(value)
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowCalendar(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setDisplayValue(newValue)

    // 유효한 날짜 형식인지 확인 (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(newValue)) {
      const date = new Date(newValue)
      if (!isNaN(date.getTime())) {
        onChange(newValue)
        setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1))
      }
    } else if (newValue === '') {
      onChange('')
    }
  }

  const handleBlur = () => {
    // 입력값이 유효하지 않으면 원래 값으로 복원
    if (displayValue && !/^\d{4}-\d{2}-\d{2}$/.test(displayValue)) {
      setDisplayValue(value)
    }
  }

  const handleDoubleClick = () => {
    setShowCalendar(true)
  }

  const handleCalendarIconClick = () => {
    setShowCalendar(!showCalendar)
  }

  const handleDateSelect = (date: Date) => {
    const formatted = formatDate(date)
    onChange(formatted)
    setDisplayValue(formatted)
    setShowCalendar(false)
  }

  const formatDate = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const getDaysInMonth = (date: Date): Date[] => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    const days: Date[] = []

    // 이전 달의 날짜들 (빈 공간 채우기)
    const startDayOfWeek = firstDay.getDay()
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i)
      days.push(prevDate)
    }

    // 현재 달의 날짜들
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i))
    }

    // 다음 달의 날짜들 (6주 채우기)
    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i))
    }

    return days
  }

  const isToday = (date: Date): boolean => {
    const today = new Date()
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear()
  }

  const isSelected = (date: Date): boolean => {
    if (!value) return false
    const selectedDate = new Date(value)
    return date.getDate() === selectedDate.getDate() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getFullYear() === selectedDate.getFullYear()
  }

  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentMonth.getMonth()
  }

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onDoubleClick={handleDoubleClick}
          required={required}
          placeholder={placeholder}
          className={`${className} pr-10`}
          title="더블클릭하여 달력 열기"
        />
        <button
          type="button"
          onClick={handleCalendarIconClick}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-purple-400 transition-colors rounded-lg hover:bg-purple-500/10"
          title="달력 열기"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
      </div>

      {showCalendar && (
        <div className="absolute z-50 mt-2 p-4 bg-[#1e1e38] border border-purple-500/30 rounded-xl shadow-2xl shadow-purple-500/20 min-w-[300px]">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={prevMonth}
              className="p-2 text-gray-400 hover:text-white hover:bg-purple-500/20 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-white font-semibold">
              {currentMonth.getFullYear()}년 {monthNames[currentMonth.getMonth()]}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-2 text-gray-400 hover:text-white hover:bg-purple-500/20 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day, index) => (
              <div
                key={day}
                className={`text-center text-sm font-medium py-2 ${
                  index === 0 ? 'text-red-400' : index === 6 ? 'text-blue-400' : 'text-gray-400'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7 gap-1">
            {getDaysInMonth(currentMonth).map((date, index) => {
              const dayOfWeek = date.getDay()
              const isSunday = dayOfWeek === 0
              const isSaturday = dayOfWeek === 6

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleDateSelect(date)}
                  className={`
                    p-2 text-sm rounded-lg transition-all
                    ${!isCurrentMonth(date) ? 'text-gray-600' : ''}
                    ${isCurrentMonth(date) && isSunday ? 'text-red-400' : ''}
                    ${isCurrentMonth(date) && isSaturday ? 'text-blue-400' : ''}
                    ${isCurrentMonth(date) && !isSunday && !isSaturday ? 'text-white' : ''}
                    ${isSelected(date) ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold' : ''}
                    ${isToday(date) && !isSelected(date) ? 'ring-2 ring-purple-400' : ''}
                    ${!isSelected(date) ? 'hover:bg-purple-500/20' : ''}
                  `}
                >
                  {date.getDate()}
                </button>
              )
            })}
          </div>

          {/* 오늘 버튼 */}
          <div className="mt-4 pt-3 border-t border-purple-500/20">
            <button
              type="button"
              onClick={() => {
                const today = new Date()
                handleDateSelect(today)
                setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1))
              }}
              className="w-full py-2 text-sm text-purple-400 hover:text-white hover:bg-purple-500/20 rounded-lg transition-colors"
            >
              오늘
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DatePicker
