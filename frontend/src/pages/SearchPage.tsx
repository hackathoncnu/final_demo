import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Header from '../components/Header'
import MissingCard from '../components/MissingCard'
import ChipFilter from '../components/ChipFilter'
import { searchMissing } from '../services/api'
import { coordToAddress } from '../services/kakao'
import type { MissingPerson, SearchFilters } from '../types'

const REGION_KEYWORDS: { needle: string; chip: SearchFilters['region'] }[] = [
  { needle: '서울', chip: '서울' },
  { needle: '경기', chip: '경기' },
  { needle: '충청남', chip: '충남' },
  { needle: '충남', chip: '충남' },
  { needle: '대전', chip: '대전' },
  { needle: '부산', chip: '부산' },
]

export default function SearchPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const initFromUrl = useRef(false)

  const [keyword, setKeyword] = useState(searchParams.get('keyword') ?? '')
  const [filters, setFilters] = useState<SearchFilters>({
    period: (searchParams.get('period') as SearchFilters['period']) || 'all',
    region: searchParams.get('region') || '전체',
    gender: (searchParams.get('gender') as SearchFilters['gender']) || 'all',
  })
  const [results, setResults] = useState<MissingPerson[]>([])
  const [loading, setLoading] = useState(true)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [myLocation, setMyLocation] = useState<string>('')

  const sortResults = (data: MissingPerson[]) => {
    const sortKey = (id: string) =>
      id.startsWith('demo-') ? Number.MAX_SAFE_INTEGER : Number(id) || 0
    return [...data].sort((a, b) => sortKey(b.id) - sortKey(a.id))
  }

  useEffect(() => {
    setLoading(true)
    searchMissing(keyword, filters).then(data => {
      setResults(sortResults(data))
      setLoading(false)
    })

    if (initFromUrl.current) {
      const next = new URLSearchParams()
      if (keyword.trim()) next.set('keyword', keyword.trim())
      if (filters.region !== '전체') next.set('region', filters.region)
      if (filters.period !== 'all') next.set('period', filters.period)
      if (filters.gender !== 'all') next.set('gender', filters.gender)
      setSearchParams(next, { replace: true })
    } else {
      initFromUrl.current = true
    }
  }, [keyword, filters])

  const handleNearbySearch = () => {
    if (!navigator.geolocation) {
      alert('이 브라우저는 위치 정보를 지원하지 않습니다.')
      return
    }
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      alert(
        '보안 연결(HTTPS) 또는 localhost에서만 위치 검색이 가능합니다.\n' +
        '현재 주소가 192.168.x.x 같은 IP면 직접 지역 칩을 눌러 검색해 주세요.'
      )
      return
    }

    setGpsLoading(true)

    const onSuccess = async (pos: GeolocationPosition) => {
      const { latitude, longitude } = pos.coords
      const addr = await coordToAddress(longitude, latitude)
      if (!addr) {
        setGpsLoading(false)
        alert('주소 변환에 실패했어요. 카카오 API 키 확인 또는 잠시 후 다시 시도해 주세요.')
        return
      }
      const hit = REGION_KEYWORDS.find(r => addr.includes(r.needle))
      if (!hit) {
        setGpsLoading(false)
        alert(`현재 위치(${addr})를 지원되는 지역 칩(서울/경기/충남/대전/부산)으로 매칭할 수 없어요.\n키워드 검색을 이용해 주세요.`)
        setMyLocation(addr)
        return
      }

      setMyLocation(addr)
      const nextFilters: SearchFilters = { period: 'all', region: hit.chip, gender: 'all' }
      const data = sortResults(await searchMissing('', nextFilters))
      setGpsLoading(false)

      if (data.length === 0) {
        setKeyword('')
        setFilters(nextFilters)
        alert(`${hit.chip} 지역에 등록된 실종자가 없어요.`)
        return
      }

      if (data.length === 1) {
        navigate(`/missing/${data[0].id}`)
        return
      }

      setKeyword('')
      setFilters(nextFilters)
    }

    const explain = (err: GeolocationPositionError) => {
      switch (err.code) {
        case err.PERMISSION_DENIED:
          return '위치 권한이 차단되어 있어요. 브라우저 주소창 자물쇠 → 위치 → 허용 으로 바꿔주세요.'
        case err.POSITION_UNAVAILABLE:
          return '현재 위치를 확인할 수 없어요. 잠시 후 다시 시도해 주세요.'
        case err.TIMEOUT:
          return '위치 가져오는 데 너무 오래 걸려요. 다시 시도해 주세요.'
        default:
          return `위치 정보를 가져올 수 없습니다. (${err.message || '알 수 없음'})`
      }
    }

    const tryLow = () => {
      navigator.geolocation.getCurrentPosition(
        onSuccess,
        err => { setGpsLoading(false); alert(explain(err)) },
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
      )
    }

    navigator.geolocation.getCurrentPosition(
      onSuccess,
      err => {
        if (err.code === err.PERMISSION_DENIED) {
          setGpsLoading(false)
          alert(explain(err))
          return
        }
        tryLow()
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    )
  }

  const clearNearby = () => {
    setMyLocation('')
    setFilters(f => ({ ...f, region: '전체' }))
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 border-b border-border-strong pb-3">
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary">실종자 검색</h1>
            <p className="text-sm text-text-muted mt-1">
              이름, 지역, 기간, 성별로 검색할 수 있습니다.
            </p>
          </div>

          <div className="bg-surface border border-border-warm p-4 sm:p-5 mb-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4 pb-4 border-b border-border-warm">
              <button
                type="button"
                onClick={handleNearbySearch}
                disabled={gpsLoading}
                className="px-4 py-2.5 bg-secondary text-white text-sm font-bold hover:bg-secondary-hover disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {gpsLoading ? '위치 확인 중...' : '📍 내 위치 근처 실종자 보기'}
              </button>
              {myLocation && (
                <div className="flex-1 flex items-center gap-2 text-xs sm:text-sm text-text-muted bg-background border border-border-warm px-3 py-2">
                  <span className="text-secondary">●</span>
                  <span className="flex-1 truncate">{myLocation}</span>
                  <button
                    type="button"
                    onClick={clearNearby}
                    className="text-text-muted hover:text-primary text-xs flex-shrink-0"
                  >
                    해제 ✕
                  </button>
                </div>
              )}
            </div>

            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
              키워드
            </label>
            <input
              type="text"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              placeholder="이름 또는 지역 입력"
              className="w-full px-3 py-2 bg-surface border border-border-strong text-sm focus:outline-none focus:border-primary mb-4"
            />

            <ChipFilter
              groups={[
                {
                  name: '기간',
                  selected: filters.period,
                  onSelect: id => setFilters(f => ({ ...f, period: id as SearchFilters['period'] })),
                  chips: [
                    { id: 'all', label: '전체' },
                    { id: '1w', label: '최근 1주' },
                    { id: '1m', label: '최근 1개월' }
                  ]
                },
                {
                  name: '지역',
                  selected: filters.region,
                  onSelect: id => setFilters(f => ({ ...f, region: id })),
                  chips: [
                    { id: '전체', label: '전체' },
                    { id: '서울', label: '서울' },
                    { id: '경기', label: '경기' },
                    { id: '충남', label: '충남' },
                    { id: '대전', label: '대전' },
                    { id: '부산', label: '부산' }
                  ]
                },
                {
                  name: '성별',
                  selected: filters.gender,
                  onSelect: id => setFilters(f => ({ ...f, gender: id as SearchFilters['gender'] })),
                  chips: [
                    { id: 'all', label: '전체' },
                    { id: '남', label: '남성' },
                    { id: '여', label: '여성' }
                  ]
                }
              ]}
            />
          </div>

          <div className="flex items-baseline justify-between mb-3 border-b border-border-warm pb-2">
            <p className="text-sm text-text-muted">
              검색 결과 <span className="font-bold text-text-primary">{results.length}</span>건
            </p>
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
          ) : results.length === 0 ? (
            <div className="bg-surface border border-border-warm p-12 text-center">
              <p className="text-text-primary font-medium">검색 결과가 없습니다.</p>
              <p className="text-sm text-text-muted mt-2">다른 검색어나 필터로 다시 시도해 주세요.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {results.map(person => (
                <MissingCard
                  key={person.id}
                  person={person}
                  onClick={p => navigate(`/missing/${p.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
