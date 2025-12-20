import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage, languageInfo } from '../contexts/LanguageContext'
import type { Language } from '../i18n/translations'

// DK Logo Component
const DKLogo = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="dkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#a855f7" />
        <stop offset="100%" stopColor="#ec4899" />
      </linearGradient>
    </defs>
    <rect width="40" height="40" rx="10" fill="url(#dkGradient)" />
    <text x="7" y="27" fill="white" fontSize="16" fontWeight="bold" fontFamily="Arial, sans-serif">DK</text>
  </svg>
)

function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { language, setLanguage, t } = useLanguage()
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)

  const navItems = [
    { path: '/', label: t.nav.home, icon: '🏠' },
    { path: '/projects', label: t.nav.projects, icon: '📁' },
    { path: '/projects/analyze', label: t.nav.folderAnalysis, icon: '📂' },
    { path: '/templates', label: t.nav.templates, icon: '📄' },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang)
    setShowLanguageMenu(false)
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a] relative overflow-hidden">
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
        <div className="absolute top-[40%] left-[80%] w-1.5 h-1.5 rounded-full bg-pink-400/40 animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-dark">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="group-hover:scale-105 transition-transform">
                <DKLogo />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold text-white">DocuGen</span>
                  <span className="text-xs text-gray-500">(다큐젠)</span>
                </div>
                <span className="text-[10px] text-gray-500 -mt-0.5">DocuGen - Smart Document Generator</span>
              </div>
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center gap-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                        : 'text-gray-400 hover:bg-[#1a1a2e] hover:text-white'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                )
              })}

              {/* Language Selector */}
              <div className="relative ml-2">
                <button
                  onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-400 hover:bg-[#1a1a2e] hover:text-white transition-all border border-purple-500/20"
                >
                  <span className="text-lg">{languageInfo[language].flag}</span>
                  <span className="hidden sm:inline">{languageInfo[language].nativeName}</span>
                  <svg className={`w-4 h-4 transition-transform ${showLanguageMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Language Dropdown */}
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

              {/* User Info & Logout */}
              <div className="flex items-center gap-3 ml-2 pl-4 border-l border-purple-500/20">
                <span className="text-sm text-gray-400">
                  <span className="text-purple-400">{user?.username}</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden sm:inline">{t.nav.logout}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 pt-24 pb-12 px-6">
        <div className="max-w-5xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center">
        <p className="text-sm text-gray-500">{t.footer.copyright}</p>
      </footer>
    </div>
  )
}

export default Layout
