import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage, languageInfo } from '../contexts/LanguageContext'
import type { Language } from '../i18n/translations'

// DK Logo Component
const DKLogo = () => (
  <svg width="60" height="60" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="dkGradientLogin" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#a855f7" />
        <stop offset="100%" stopColor="#ec4899" />
      </linearGradient>
    </defs>
    <rect width="40" height="40" rx="10" fill="url(#dkGradientLogin)" />
    <text x="7" y="27" fill="white" fontSize="16" fontWeight="bold" fontFamily="Arial, sans-serif">DK</text>
  </svg>
)

function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()
  const { language, setLanguage, t } = useLanguage()

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang)
    setShowLanguageMenu(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Simulate login delay
    await new Promise(resolve => setTimeout(resolve, 500))

    const success = login(username, password)

    if (success) {
      navigate('/')
    } else {
      setError(t.login.invalidCredentials)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center relative overflow-hidden">
      {/* Language Selector - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <div className="relative">
          <button
            onClick={() => setShowLanguageMenu(!showLanguageMenu)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-400 hover:bg-[#1a1a2e] hover:text-white transition-all border border-purple-500/20 bg-[#1a1a2e]/80 backdrop-blur-sm"
          >
            <span className="text-lg">{languageInfo[language].flag}</span>
            <span className="hidden sm:inline">{languageInfo[language].nativeName}</span>
            <svg className={`w-4 h-4 transition-transform ${showLanguageMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showLanguageMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowLanguageMenu(false)}
              ></div>
              <div className="absolute right-0 mt-2 w-48 bg-[#1a1a2e] border border-purple-500/20 rounded-xl shadow-xl z-50 overflow-hidden">
                {(Object.keys(languageInfo) as Language[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => handleLanguageChange(lang)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all ${
                      language === lang
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'text-gray-400 hover:bg-[#252540] hover:text-white'
                    }`}
                  >
                    <span className="text-xl">{languageInfo[lang].flag}</span>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{languageInfo[lang].nativeName}</span>
                      <span className="text-xs text-gray-500">{languageInfo[lang].name}</span>
                    </div>
                    {language === lang && (
                      <svg className="w-4 h-4 ml-auto text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Background Pattern */}
      <div className="fixed inset-0 z-0">
        {/* Gradient Orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/20 blur-[120px]"></div>
        <div className="absolute top-[30%] right-[-15%] w-[600px] h-[600px] rounded-full bg-pink-600/15 blur-[150px]"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[400px] h-[400px] rounded-full bg-blue-600/10 blur-[100px]"></div>

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(168, 85, 247, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(168, 85, 247, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        ></div>

        {/* Floating Particles */}
        <div className="absolute top-[10%] left-[10%] w-2 h-2 rounded-full bg-purple-400/40 animate-pulse"></div>
        <div className="absolute top-[20%] right-[20%] w-3 h-3 rounded-full bg-pink-400/30 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-[60%] left-[5%] w-2 h-2 rounded-full bg-blue-400/40 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[70%] right-[10%] w-2 h-2 rounded-full bg-purple-400/30 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="card p-8">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <DKLogo />
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <h1 className="text-2xl font-bold text-white">DocuGen</h1>
              <span className="text-sm text-gray-500">(다큐젠)</span>
            </div>
            <p className="text-gray-400 text-sm">Smart Document Generator</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t.login.username}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-dark"
                placeholder={t.login.username}
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t.login.password}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-dark"
                placeholder={t.login.password}
                required
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                  <span>{t.login.loggingIn}</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>{t.login.loginButton}</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-purple-500/20 text-center">
            <p className="text-xs text-gray-500">
              {t.footer.copyright}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
