import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import MissingCard from '../components/MissingCard'
import { getMissingPersons } from '../services/api'
import type { MissingPerson } from '../types'

export default function HomePage() {
  const navigate = useNavigate()
  const [persons, setPersons] = useState<MissingPerson[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMissingPersons().then(data => {
      const sortKey = (id: string) =>
        id.startsWith('demo-') ? Number.MAX_SAFE_INTEGER : Number(id) || 0
      const sorted = [...data].sort((a, b) => sortKey(b.id) - sortKey(a.id))
      setPersons(sorted)
      setLoading(false)
    })
  }, [])

  const urgentCount = persons.filter(p => p.is_urgent).length

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <section className="bg-surface border-b border-border-warm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div>
              <p className="text-xs font-bold tracking-widest text-primary uppercase mb-3">
                실종자 찾기 · 신고 통합 플랫폼
              </p>
              <h1 className="text-2xl sm:text-4xl font-bold text-text-primary leading-tight">
                실종 어르신, 골든타임 안에 집으로
              </h1>
              <p className="text-sm sm:text-base text-text-muted mt-3">
                AI가 근처 시민에게 알려드립니다. 한 명의 관심이 한 가정을 다시 모이게 합니다.
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => navigate('/register')}
                className="px-5 py-2.5 bg-primary text-white text-sm font-bold hover:bg-primary-hover transition-colors"
              >
                실종 신고하기
              </button>
              <button
                onClick={() => navigate('/search')}
                className="px-5 py-2.5 bg-surface border border-border-strong text-text-primary text-sm font-bold hover:border-primary hover:text-primary transition-colors"
              >
                실종자 검색
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface border-b border-border-warm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 grid grid-cols-3 divide-x divide-border-warm">
          <div className="text-center px-2">
            <div className="text-2xl sm:text-3xl font-bold text-urgent">{urgentCount}</div>
            <div className="text-xs sm:text-sm text-text-muted mt-1">긴급 사례</div>
          </div>
          <div className="text-center px-2">
            <div className="text-2xl sm:text-3xl font-bold text-text-primary">{persons.length}</div>
            <div className="text-xs sm:text-sm text-text-muted mt-1">현재 찾는 중</div>
          </div>
          <div className="text-center px-2">
            <div className="text-2xl sm:text-3xl font-bold text-secondary">23</div>
            <div className="text-xs sm:text-sm text-text-muted mt-1">이달 발견</div>
          </div>
        </div>
      </section>

      <section className="flex-1 py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4 border-b border-border-strong pb-2">
            <h2 className="text-lg sm:text-xl font-bold text-text-primary">
              현재 찾고 있어요
            </h2>
            <button
              onClick={() => navigate('/search')}
              className="text-sm text-primary font-medium hover:underline"
            >
              전체보기 →
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-surface border border-border-warm p-4 flex gap-4 animate-pulse">
                  <div className="w-24 h-24 bg-background flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-background w-1/3" />
                    <div className="h-4 bg-background w-2/3" />
                    <div className="h-4 bg-background w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {persons.slice(0, 4).map(person => (
                <MissingCard
                  key={person.id}
                  person={person}
                  onClick={p => navigate(`/missing/${p.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="bg-surface border-t border-border-warm py-5 px-4 text-center text-xs text-text-muted">
        <p>© 2026 zi-bro · 충남대 해커톤 출품작</p>
      </footer>
    </div>
  )
}
