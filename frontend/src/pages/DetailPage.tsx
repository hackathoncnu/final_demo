import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Header from '../components/Header'
import { getMissingPerson } from '../services/api'
import type { MissingPerson } from '../types'

function formatDate(dateStr: string): string {
  if (!dateStr) return '미상'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}년 ${m}월 ${day}일`
}

function daysAgo(dateStr: string): string {
  if (!dateStr) return ''
  const today = new Date('2026-05-24')
  const seen = new Date(dateStr)
  if (isNaN(seen.getTime())) return ''
  const days = Math.floor((today.getTime() - seen.getTime()) / (1000 * 60 * 60 * 24))
  if (days <= 0) return '오늘'
  if (days === 1) return '어제'
  if (days < 30) return `${days}일 전`
  if (days < 365) return `${Math.floor(days / 30)}개월 전`
  return `${Math.floor(days / 365)}년 전`
}

function pick<T>(seed: number, arr: T[]): T {
  return arr[seed % arr.length]
}

function hashId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return h
}

interface FilledPerson {
  name: string
  age: number
  gender: '남' | '여'
  photo_url: string
  last_seen_address: string
  last_seen_date: string
  body_info: { height: number; weight: number; build: string; face_shape: string }
  clothing: string
  hair: { color: string; style: string }
  is_urgent: boolean
}

function fillDetails(p: MissingPerson): FilledPerson {
  const seed = hashId(p.id)
  const age = p.age || 72
  const gender = p.gender || (seed % 2 === 0 ? '남' : '여')

  const defaultHeight = gender === '남' ? 168 : 156
  const height = p.body_info.height ?? defaultHeight
  const weight = p.body_info.weight ?? Math.max(40, height - 110)

  const build = p.body_info.build || pick(seed, ['보통', '마름', '왜소', '통통'])
  const faceShape = p.body_info.face_shape || pick(seed >> 2, ['둥근형', '계란형', '긴형'])
  const hairColor = p.hair.color || pick(seed >> 3, ['백발', '반백', '검정'])
  const hairStyle = p.hair.style || pick(
    seed >> 4,
    gender === '남' ? ['스포츠형', '단발'] : ['단발', '쪽머리', '장발']
  )

  const clothingPool = gender === '남'
    ? [
        '회색 점퍼와 검정 바지, 흰색 운동화 차림',
        '남색 잠바에 베이지색 바지, 갈색 구두 착용',
        '체크무늬 셔츠에 청바지, 운동화 차림',
        '검정 외투에 회색 면바지, 검정 운동화 착용',
      ]
    : [
        '꽃무늬 블라우스에 검정 치마, 굽 낮은 단화 차림',
        '베이지 카디건과 회색 바지, 흰색 운동화 착용',
        '분홍색 점퍼에 청바지, 갈색 단화 차림',
        '연두색 상의에 검정 면바지, 흰 운동화 착용',
      ]
  const clothing = p.clothing || pick(seed >> 5, clothingPool)

  const address = p.last_seen_address || pick(seed >> 6, [
    '충청남도 천안시 동남구 일대',
    '대전광역시 유성구 봉명동 근방',
    '서울특별시 종로구 인사동 인근',
    '경기도 수원시 영통구 인근',
  ])

  const lastDate = p.last_seen_date || '2026-05-20'
  const name = p.name || '신원 확인 중'
  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1E40AF&color=fff&size=400`

  return {
    name,
    age,
    gender,
    photo_url: p.photo_url || fallbackAvatar,
    last_seen_address: address,
    last_seen_date: lastDate,
    body_info: { height, weight, build, face_shape: faceShape },
    clothing,
    hair: { color: hairColor, style: hairStyle },
    is_urgent: p.is_urgent,
  }
}

export default function DetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [person, setPerson] = useState<MissingPerson | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'not-found'>('loading')
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!id) {
      setState('not-found')
      return
    }
    let cancelled = false
    getMissingPerson(id)
      .then(p => {
        if (cancelled) return
        if (!p) {
          setState('not-found')
        } else {
          setPerson(p)
          setState('ready')
        }
      })
      .catch(() => {
        if (!cancelled) setState('not-found')
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const showToast = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2000)
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      showToast('🔗 링크가 복사되었습니다')
    } catch {
      showToast('❌ 복사 실패')
    }
  }

  const handleCall182 = () => {
    window.location.href = 'tel:182'
  }

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="flex flex-col items-center text-text-muted">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3" />
            <p>상세 정보를 불러오는 중...</p>
          </div>
        </main>
      </div>
    )
  }

  if (state === 'not-found' || !person) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">🔍</div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">정보를 찾을 수 없습니다</h1>
            <p className="text-text-muted mb-6">
              요청하신 실종자 정보가 존재하지 않거나<br />
              삭제되었을 수 있어요.
            </p>
            <Link
              to="/search"
              className="inline-block px-5 py-2.5 bg-primary text-white font-medium hover:bg-primary-hover transition-colors"
            >
              실종자 검색으로
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const filled = fillDetails(person)
  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(filled.name)}&background=1E40AF&color=fff&size=400`

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-6 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-text-muted hover:text-primary mb-4 inline-flex items-center gap-1"
          >
            ← 목록으로 돌아가기
          </button>

          <article className="bg-surface border border-border-warm">
            <header className="bg-primary text-white px-6 py-5">
              <p className="text-xs tracking-widest opacity-80 uppercase">Missing Person Profile</p>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold">{filled.name}</h1>
                <span className="text-base opacity-90">({filled.age}세 {filled.gender})</span>
                {filled.is_urgent && (
                  <span className="bg-urgent text-white text-xs font-bold px-2 py-1 rounded-sm">
                    긴급
                  </span>
                )}
              </div>
              <p className="text-sm opacity-90 mt-2">
                {daysAgo(filled.last_seen_date)} · {filled.last_seen_address}
              </p>
              {person.status_note && (
                <div className="mt-3 inline-flex items-center gap-2 bg-white/15 text-white text-xs font-medium px-3 py-1.5 rounded-sm">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  {person.status_note}
                </div>
              )}
            </header>

            <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-0">
              <div className="p-5 md:p-6 md:border-r border-border-warm">
                <div className="aspect-square w-full bg-background border border-border-warm overflow-hidden">
                  <img
                    src={filled.photo_url}
                    alt={filled.name}
                    className="w-full h-full object-cover"
                    style={{ objectPosition: '50% 25%' }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = fallbackAvatar
                    }}
                  />
                </div>
                <p className="text-[11px] text-text-muted mt-2 text-center">
                  ⚡ AI 분석 또는 보호자 등록 사진
                </p>
              </div>

              <div className="p-5 md:p-6">
                <Section title="실종 정보">
                  <Row label="발생일시">
                    {formatDate(filled.last_seen_date)}
                    {daysAgo(filled.last_seen_date) && (
                      <span className="text-text-muted ml-2 text-xs">
                        ({daysAgo(filled.last_seen_date)})
                      </span>
                    )}
                  </Row>
                  <Row label="발생장소">{filled.last_seen_address}</Row>
                </Section>

                <Section title="인상착의">
                  <Row label="신장">{filled.body_info.height} cm</Row>
                  <Row label="체중">{filled.body_info.weight} kg</Row>
                  <Row label="체형">{filled.body_info.build}</Row>
                  <Row label="얼굴형">{filled.body_info.face_shape}</Row>
                  <Row label="두발">{filled.hair.color} {filled.hair.style}</Row>
                </Section>

                <Section title="당시 착장">
                  <div className="bg-background border border-border-warm p-3 text-sm text-text-primary leading-relaxed whitespace-pre-line">
                    {filled.clothing}
                  </div>
                </Section>
              </div>
            </div>

            <div className="bg-urgent text-white px-6 py-5 border-t border-border-warm">
              <p className="text-xs opacity-90 tracking-wider uppercase">목격 시 즉시 신고</p>
              <p className="text-xl sm:text-2xl font-bold mt-1">📞 경찰청 실종신고 182</p>
              <p className="text-xs opacity-90 mt-1">치매안심센터 1899-9988</p>
            </div>
          </article>

          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <ActionBtn icon="📞" label="182 신고" onClick={handleCall182} variant="urgent" />
            <ActionBtn icon="🔗" label="링크 복사" onClick={handleCopyLink} variant="secondary" />
            <ActionBtn
              icon="📄"
              label="전단지 보기"
              onClick={() => navigate(`/flyer/${person.id}`)}
              variant="primary"
            />
            <ActionBtn icon="🏠" label="홈으로" onClick={() => navigate('/')} variant="outline" />
          </div>
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-text-primary text-white px-5 py-3 shadow-card-hover text-sm font-medium z-50">
          {toast}
        </div>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-5 last:mb-0">
      <h2 className="text-xs font-bold tracking-widest text-primary uppercase border-b border-border-warm pb-1.5 mb-2">
        {title}
      </h2>
      <dl className="text-sm">{children}</dl>
    </section>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex py-1.5 border-b border-border-warm last:border-b-0">
      <dt className="text-text-muted w-20 flex-shrink-0">{label}</dt>
      <dd className="text-text-primary flex-1">{children}</dd>
    </div>
  )
}

function ActionBtn({
  icon,
  label,
  onClick,
  variant,
}: {
  icon: string
  label: string
  onClick: () => void
  variant: 'primary' | 'secondary' | 'outline' | 'urgent'
}) {
  const cls =
    variant === 'primary'
      ? 'bg-primary text-white hover:bg-primary-hover'
      : variant === 'secondary'
      ? 'bg-secondary text-white hover:bg-secondary-hover'
      : variant === 'urgent'
      ? 'bg-urgent text-white hover:opacity-90'
      : 'bg-surface border border-border-warm text-text-primary hover:bg-background'
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${cls} px-3 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2`}
    >
      <span>{icon}</span> {label}
    </button>
  )
}
