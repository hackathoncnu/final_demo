import { useState } from 'react'
import type { ReactNode, ChangeEvent, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import LocationPicker from '../components/LocationPicker'
import { submitAndGetFlyerId } from '../services/api'
import type { MissingForm } from '../types'

const INITIAL_FORM: MissingForm = {
  name: '',
  age: '',
  gender: '',
  nationality: '내국인',
  height: '',
  weight: '',
  build: '',
  face_shape: '',
  with_guardian: false,
  hair_color: '',
  hair_style: '',
  clothing: '',
  occurred_at: '',
  last_known_address: '',
  last_known_lat: null,
  last_known_lng: null,
  last_known_place_name: '',
  exact_location_unknown: false,
  photo_data_url: null,
  reporter_name: '',
  reporter_relation: '',
  reporter_phone: '',
  reporter_location: '',
  agree_privacy: false,
  agree_ai: false
}

const inputCls =
  'w-full px-3 py-2 bg-surface border border-border-warm rounded-card text-sm focus:outline-none focus:border-primary transition-colors'

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-text-primary mb-1.5">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      {children}
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-bold text-primary uppercase tracking-wider border-b border-border-warm pb-2">
        {title}
      </h2>
      {children}
    </section>
  )
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState<MissingForm>(INITIAL_FORM)
  const [submitting, setSubmitting] = useState(false)

  const upd = <K extends keyof MissingForm>(k: K, v: MissingForm[K]) =>
    setForm(p => ({ ...p, [k]: v }))

  const canSubmit = Boolean(
    form.name.trim() &&
      form.age &&
      form.gender &&
      form.clothing.trim() &&
      form.occurred_at &&
      form.reporter_name.trim() &&
      form.reporter_phone.trim() &&
      form.agree_privacy &&
      form.agree_ai &&
      (!form.with_guardian || form.last_known_address.trim())
  )

  const handlePhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => upd('photo_data_url', (ev.target?.result as string) ?? null)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    try {
      const id = await submitAndGetFlyerId(form)
      navigate(`/flyer/${id}`)
    } catch (err) {
      alert(`접수 실패: ${err instanceof Error ? err.message : '서버 오류가 발생했습니다'}`)
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary text-center mb-2">
            실종 신고 접수
          </h1>
          <p className="text-text-muted text-center mb-8">
            한 분이라도 더 집으로 돌아갈 수 있도록 도와주세요
          </p>

          <form onSubmit={handleSubmit} className="bg-surface rounded-card shadow-card p-6 sm:p-8 space-y-8">
            <Section title="실종자 정보">
              <Field label="이름" required>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => upd('name', e.target.value)}
                  placeholder="홍길동"
                  className={inputCls}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="당시 나이" required>
                  <input
                    type="number"
                    value={form.age}
                    onChange={e => upd('age', e.target.value ? parseInt(e.target.value) : '')}
                    placeholder="74"
                    className={inputCls}
                  />
                </Field>
                <Field label="성별" required>
                  <select
                    value={form.gender}
                    onChange={e => upd('gender', e.target.value as MissingForm['gender'])}
                    className={inputCls}
                  >
                    <option value="">선택</option>
                    <option value="남">남</option>
                    <option value="여">여</option>
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="키 (cm)">
                  <input
                    type="number"
                    value={form.height}
                    onChange={e => upd('height', e.target.value ? parseInt(e.target.value) : '')}
                    placeholder="160"
                    className={inputCls}
                  />
                </Field>
                <Field label="몸무게 (kg)">
                  <input
                    type="number"
                    value={form.weight}
                    onChange={e => upd('weight', e.target.value ? parseInt(e.target.value) : '')}
                    placeholder="55"
                    className={inputCls}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="체격">
                  <select value={form.build} onChange={e => upd('build', e.target.value)} className={inputCls}>
                    <option value="">선택</option>
                    <option value="마름">마름</option>
                    <option value="왜소">왜소</option>
                    <option value="보통">보통</option>
                    <option value="통통">통통</option>
                    <option value="비만">비만</option>
                  </select>
                </Field>
                <Field label="얼굴형">
                  <select value={form.face_shape} onChange={e => upd('face_shape', e.target.value)} className={inputCls}>
                    <option value="">선택</option>
                    <option value="둥근형">둥근형</option>
                    <option value="계란형">계란형</option>
                    <option value="긴형">긴형</option>
                    <option value="각진형">각진형</option>
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="두발 색상">
                  <select value={form.hair_color} onChange={e => upd('hair_color', e.target.value)} className={inputCls}>
                    <option value="">선택</option>
                    <option value="검정">검정</option>
                    <option value="갈색">갈색</option>
                    <option value="반백">반백</option>
                    <option value="백발">백발</option>
                    <option value="염색">염색</option>
                  </select>
                </Field>
                <Field label="두발 형태">
                  <select value={form.hair_style} onChange={e => upd('hair_style', e.target.value)} className={inputCls}>
                    <option value="">선택</option>
                    <option value="스포츠형">스포츠형</option>
                    <option value="단발">단발</option>
                    <option value="장발">장발</option>
                    <option value="대머리">대머리</option>
                    <option value="쪽머리">쪽머리</option>
                  </select>
                </Field>
              </div>

              <Field label="착의 의상" required>
                <textarea
                  value={form.clothing}
                  onChange={e => upd('clothing', e.target.value)}
                  placeholder="예: 운동복 차림, 회색 점퍼, 검정 바지, 흰 운동화"
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
              </Field>
            </Section>

            <Section title="실종 상황">
              <Field label="발생 일시" required>
                <input
                  type="datetime-local"
                  value={form.occurred_at}
                  onChange={e => upd('occurred_at', e.target.value)}
                  className={inputCls}
                />
              </Field>

              <label className="flex items-start gap-3 p-4 bg-background border border-border-warm rounded-card cursor-pointer hover:border-primary transition-colors">
                <input
                  type="checkbox"
                  checked={form.with_guardian}
                  onChange={e => upd('with_guardian', e.target.checked)}
                  className="mt-0.5 w-5 h-5 accent-primary cursor-pointer"
                />
                <div>
                  <div className="font-medium text-text-primary">보호자와 함께 계셨나요?</div>
                  <p className="text-sm text-text-muted mt-0.5">
                    체크하시면 실종된 정확한 위치를 입력할 수 있어요.
                  </p>
                </div>
              </label>

              {form.with_guardian && (
                <div className="pl-3 border-l-4 border-primary py-1">
                  <LocationPicker
                    label="실종된 정확한 위치"
                    value={form.last_known_address}
                    lat={form.last_known_lat}
                    lng={form.last_known_lng}
                    placeName={form.last_known_place_name}
                    onChange={payload =>
                      setForm(p => ({
                        ...p,
                        last_known_address: payload.address,
                        last_known_lat: payload.lat,
                        last_known_lng: payload.lng,
                        last_known_place_name: payload.place_name
                      }))
                    }
                    required
                    hint="보호자와 함께 계셨던 정확한 장소를 입력해 주세요."
                  />
                </div>
              )}
            </Section>

            <Section title="사진 등록">
              <Field label="최근 사진">
                <label className="block">
                  <div className="border-2 border-dashed border-border-warm rounded-card p-6 text-center cursor-pointer hover:border-primary bg-background transition-colors">
                    {form.photo_data_url ? (
                      <img
                        src={form.photo_data_url}
                        alt="업로드된 사진"
                        className="max-h-48 mx-auto rounded-card object-cover"
                      />
                    ) : (
                      <>
                        <div className="text-4xl mb-2">📷</div>
                        <p className="text-sm text-text-muted">클릭하여 사진 업로드</p>
                        <p className="text-xs text-text-muted mt-1">최근 사진 권장 (3년 이내)</p>
                      </>
                    )}
                    <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
                  </div>
                </label>
              </Field>
            </Section>

            <Section title="신고자 정보">
              <div className="grid grid-cols-2 gap-3">
                <Field label="신고자 이름" required>
                  <input
                    type="text"
                    value={form.reporter_name}
                    onChange={e => upd('reporter_name', e.target.value)}
                    placeholder="홍길순"
                    className={inputCls}
                  />
                </Field>
                <Field label="관계">
                  <select
                    value={form.reporter_relation}
                    onChange={e => upd('reporter_relation', e.target.value)}
                    className={inputCls}
                  >
                    <option value="">선택</option>
                    <option value="자녀">자녀</option>
                    <option value="배우자">배우자</option>
                    <option value="형제자매">형제자매</option>
                    <option value="친척">친척</option>
                    <option value="지인">지인</option>
                    <option value="기타">기타</option>
                  </select>
                </Field>
              </div>

              <Field label="연락처" required>
                <input
                  type="tel"
                  value={form.reporter_phone}
                  onChange={e => upd('reporter_phone', e.target.value)}
                  placeholder="010-1234-5678"
                  className={inputCls}
                />
              </Field>
            </Section>

            <Section title="동의 사항">
              <div className="space-y-2">
                <label className="flex items-start gap-3 p-3 bg-background border border-border-warm rounded-card cursor-pointer hover:border-primary transition-colors">
                  <input
                    type="checkbox"
                    checked={form.agree_privacy}
                    onChange={e => upd('agree_privacy', e.target.checked)}
                    className="mt-0.5 w-5 h-5 accent-primary cursor-pointer"
                  />
                  <span className="text-sm text-text-primary">
                    <strong className="text-danger">(필수)</strong> 개인정보 수집·이용에 동의합니다
                  </span>
                </label>
                <label className="flex items-start gap-3 p-3 bg-background border border-border-warm rounded-card cursor-pointer hover:border-primary transition-colors">
                  <input
                    type="checkbox"
                    checked={form.agree_ai}
                    onChange={e => upd('agree_ai', e.target.checked)}
                    className="mt-0.5 w-5 h-5 accent-primary cursor-pointer"
                  />
                  <span className="text-sm text-text-primary">
                    <strong className="text-danger">(필수)</strong> AI 이미지 생성 및 GPS 알림 전송에 동의합니다
                  </span>
                </label>
              </div>
            </Section>

            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className="w-full px-6 py-3.5 bg-primary text-white rounded-card font-bold hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-base"
            >
              {submitting ? '접수 중...' : '🚨 실종 신고 접수하기'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
