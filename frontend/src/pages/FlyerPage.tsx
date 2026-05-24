import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Header from '../components/Header'
import { getFlyer, generateFlyer } from '../services/api'
import type { MissingForm } from '../types'

type State = 'loading-form' | 'loading-ai' | 'ready' | 'not-found'

export default function FlyerPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [state, setState] = useState<State>('loading-form')
  const [form, setForm] = useState<MissingForm | null>(null)
  const [aiImageUrl, setAiImageUrl] = useState<string | null>(null)
  const [toast, setToast] = useState<string>('')

  useEffect(() => {
    if (!id) {
      setState('not-found')
      return
    }
    let cancelled = false
    ;(async () => {
      const stored = await getFlyer(id)
      if (cancelled) return
      if (!stored) {
        setState('not-found')
        return
      }
      setForm(stored.form)
      if (stored.ai_image_url) {
        setAiImageUrl(stored.ai_image_url)
        setState('ready')
      } else {
        setState('loading-ai')
        const { ai_image_url } = await generateFlyer(id)
        if (cancelled) return
        setAiImageUrl(ai_image_url)
        setState('ready')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  const showToast = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2000)
  }

  const handlePrint = () => window.print()

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      showToast('🔗 링크가 복사되었습니다')
    } catch {
      showToast('❌ 복사 실패. 브라우저 권한을 확인해 주세요')
    }
  }

  const handleKakaoShare = () => {
    showToast('📤 카카오톡 공유는 백엔드 연결 후 동작합니다 (stub)')
  }

  if (state === 'not-found') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">🔍</div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">전단지를 찾을 수 없습니다</h1>
            <p className="text-text-muted mb-6">
              세션이 만료되었거나 잘못된 주소예요.<br />
              신고 페이지에서 다시 접수해 주세요.
            </p>
            <Link
              to="/register"
              className="inline-block px-5 py-2.5 bg-primary text-white rounded-card font-medium hover:bg-primary-hover transition-colors"
            >
              신고 페이지로
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="print:hidden">
        <Header />
      </div>

      <main className="flex-1 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-secondary text-white rounded-card p-4 mb-6 flex items-center gap-3 print:hidden">
            <span className="text-2xl">✅</span>
            <div className="flex-1">
              <p className="font-bold">신고가 접수되었습니다</p>
              <p className="text-sm opacity-90">접수번호: {id}</p>
            </div>
          </div>

          <article className="bg-surface rounded-card shadow-card overflow-hidden print:shadow-none print:rounded-none">
            <div className="bg-primary text-white px-6 py-4 text-center">
              <p className="text-xs tracking-widest opacity-80">FOR GOLDEN-TIME RESCUE</p>
              <h1 className="text-2xl font-bold mt-1">실종 어르신을 찾고 있어요</h1>
              <p className="text-sm opacity-90 mt-1">목격하신 분은 즉시 신고해 주세요</p>
            </div>

            <div className="p-6">
              <div className="mb-5">
                <p className="text-xs font-bold tracking-widest text-primary uppercase mb-2">
                  AI 인상착의 분석 이미지
                </p>
                <div className="aspect-[3/4] bg-background rounded-card border border-border-warm overflow-hidden">
                  {state === 'loading-ai' ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-text-muted">
                      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3" />
                      <p className="font-medium text-text-primary">AI가 인상착의를 분석 중입니다</p>
                      <p className="text-xs mt-1">착의 정보를 바탕으로 이미지를 생성하고 있어요</p>
                    </div>
                  ) : aiImageUrl ? (
                    <img src={aiImageUrl} alt="AI 인상착의" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-muted">
                      이미지 없음
                    </div>
                  )}
                </div>
                {state === 'ready' && (
                  <p className="text-xs text-text-muted mt-2">
                    ⚡ AI가 등록 시 입력한 인상착의(착의·신체정보)를 바탕으로 생성한 이미지입니다.
                  </p>
                )}
              </div>

              {form && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-text-primary border-b-2 border-primary pb-2">
                    {form.name}
                    <span className="text-base font-medium text-text-muted ml-2">
                      ({form.age}세 {form.gender})
                    </span>
                  </h2>

                  <table className="w-full text-sm">
                    <tbody>
                      <InfoRow label="신체">
                        {form.height ? `키 ${form.height}cm` : '미입력'}
                        {form.weight ? ` · 몸무게 ${form.weight}kg` : ''}
                        {form.build ? ` · ${form.build}` : ''}
                      </InfoRow>
                      <InfoRow label="얼굴형">
                        {form.face_shape || '-'}
                      </InfoRow>
                      <InfoRow label="두발">
                        {form.hair_color || '-'} {form.hair_style || ''}
                      </InfoRow>
                      <InfoRow label="실종일시">
                        {form.occurred_at ? form.occurred_at.replace('T', ' ') : '미입력'}
                      </InfoRow>
                      <InfoRow label="목격장소">
                        {form.last_known_address || '미입력'}
                        {form.exact_location_unknown && (
                          <span className="text-xs text-text-muted ml-1">(정확위치 불명)</span>
                        )}
                      </InfoRow>
                    </tbody>
                  </table>

                  {form.clothing && (
                    <div className="bg-background border border-border-warm rounded-card p-4">
                      <p className="text-xs font-bold tracking-widest text-primary uppercase mb-1">
                        실종 당시 착장
                      </p>
                      <p className="text-sm text-text-primary leading-relaxed whitespace-pre-line">
                        {form.clothing}
                      </p>
                    </div>
                  )}

                  <div className="border-t border-border-warm pt-4 mt-4">
                    <p className="text-xs font-bold tracking-widest text-text-muted uppercase mb-2">
                      보호자 등록 원본 사진
                    </p>
                    {form.photo_data_url ? (
                      <div className="flex items-start gap-3">
                        <img
                          src={form.photo_data_url}
                          alt="원본 사진"
                          className="w-32 h-32 object-cover rounded-card border border-border-warm flex-shrink-0"
                        />
                        <p className="text-xs text-text-muted leading-relaxed">
                          신고자가 등록한 최근 사진입니다.<br />
                          AI 이미지와 함께 참고용으로 보여드려요.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-background border border-dashed border-border-warm rounded-card p-4 text-center text-sm text-text-muted">
                        원본 사진이 등록되지 않았어요
                      </div>
                    )}
                  </div>

                  <div className="bg-primary text-white rounded-card p-4 mt-4">
                    <p className="text-xs opacity-80 tracking-wider">목격 즉시 연락 바랍니다</p>
                    <p className="text-2xl font-bold mt-1">📞 {form.reporter_phone || '-'}</p>
                    <p className="text-sm opacity-90 mt-1">
                      {form.reporter_name} {form.reporter_relation && `(${form.reporter_relation})`}
                    </p>
                    <div className="border-t border-white border-opacity-30 mt-3 pt-3 text-xs opacity-90 flex justify-between flex-wrap gap-2">
                      <span>경찰청 실종 ☎ 182</span>
                      <span>치매안심센터 ☎ 1899-9988</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-background border-t border-border-warm py-3 px-6 text-center text-xs text-text-muted">
              본 전단지는 zi-bro 시스템에서 자동 생성되었습니다 · 접수번호 {id}
            </div>
          </article>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 print:hidden">
            <ActionBtn icon="🖨️" label="인쇄/PDF" onClick={handlePrint} variant="primary" />
            <ActionBtn icon="🔗" label="링크 복사" onClick={handleCopyLink} variant="secondary" />
            <ActionBtn icon="📤" label="카톡 공유" onClick={handleKakaoShare} variant="secondary" />
            <ActionBtn icon="🏠" label="홈으로" onClick={() => navigate('/')} variant="outline" />
          </div>
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-text-primary text-white px-5 py-3 rounded-card shadow-card-hover text-sm font-medium print:hidden z-50">
          {toast}
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <tr className="border-b border-border-warm last:border-b-0">
      <td className="py-2 text-text-muted font-medium w-24 align-top">{label}</td>
      <td className="py-2 text-text-primary">{children}</td>
    </tr>
  )
}

function ActionBtn({
  icon,
  label,
  onClick,
  variant
}: {
  icon: string
  label: string
  onClick: () => void
  variant: 'primary' | 'secondary' | 'outline'
}) {
  const cls =
    variant === 'primary'
      ? 'bg-primary text-white hover:bg-primary-hover'
      : variant === 'secondary'
      ? 'bg-secondary text-white hover:bg-secondary-hover'
      : 'bg-surface border border-border-warm text-text-primary hover:bg-background'
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${cls} px-3 py-3 rounded-card text-sm font-medium transition-colors flex items-center justify-center gap-2`}
    >
      <span>{icon}</span> {label}
    </button>
  )
}
