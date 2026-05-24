import { Link, useLocation } from 'react-router-dom'

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12l2-2 7 7-7 7-2-2 5-5z" transform="scale(0)" />
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

export default function Header() {
  const location = useLocation()
  const isActive = (path: string) => location.pathname === path

  return (
    <header className="bg-surface border-b border-border-warm sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 bg-primary flex items-center justify-center text-white group-hover:bg-primary-hover transition-colors">
            <SearchIcon />
          </div>
          <div className="leading-tight">
            <div className="text-lg font-bold text-text-primary tracking-tight">지브로</div>
            <div className="text-[10px] tracking-widest text-text-muted uppercase">ZI-BRO</div>
          </div>
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            to="/register"
            className={`px-4 py-2 text-sm font-medium transition-colors border ${
              isActive('/register')
                ? 'bg-primary text-white border-primary'
                : 'text-text-primary border-border-warm hover:border-primary hover:text-primary'
            }`}
          >
            실종 신고
          </Link>
          <Link
            to="/search"
            className={`px-4 py-2 text-sm font-medium transition-colors border ${
              isActive('/search')
                ? 'bg-primary text-white border-primary'
                : 'text-text-primary border-border-warm hover:border-primary hover:text-primary'
            }`}
          >
            실종자 검색
          </Link>
        </nav>
      </div>
    </header>
  )
}
