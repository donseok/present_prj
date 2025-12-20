import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { translations, Language, TranslationKeys } from '../i18n/translations'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: TranslationKeys
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const LANGUAGE_STORAGE_KEY = 'si-doc-creator-language'

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    // 로컬 스토리지에서 저장된 언어 불러오기
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (saved && (saved === 'ko' || saved === 'en' || saved === 'vi')) {
      return saved as Language
    }
    // 브라우저 언어 감지
    const browserLang = navigator.language.split('-')[0]
    if (browserLang === 'ko') return 'ko'
    if (browserLang === 'vi') return 'vi'
    return 'ko' // 기본값: 한국어
  })

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang)
  }

  useEffect(() => {
    // HTML lang 속성 업데이트
    document.documentElement.lang = language
  }, [language])

  const value: LanguageContextType = {
    language,
    setLanguage,
    t: translations[language],
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

// 언어 정보
export const languageInfo: Record<Language, { name: string; flag: string; nativeName: string }> = {
  ko: { name: 'Korean', flag: '🇰🇷', nativeName: '한국어' },
  en: { name: 'English', flag: '🇺🇸', nativeName: 'English' },
  vi: { name: 'Vietnamese', flag: '🇻🇳', nativeName: 'Tiếng Việt' },
}
