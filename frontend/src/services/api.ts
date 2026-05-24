import type { MissingPerson, MissingForm, SearchFilters } from '../types'

// Use Vite proxy (/api → backend, /static → backend static files)
const API_BASE = '/api'

interface BackendPerson {
  id: number
  name: string | null
  age: number | null
  gender: string | null
  height: number | null
  weight: number | null
  face_shape: string | null
  hair_color: string | null
  hair_style: string | null
  clothing: string | null
  missing_date: string | null
  missing_location: string | null
  missing_region: string | null
  original_photo_url: string | null
  generated_image_url: string | null
  status: string
}

interface FlyerStored {
  form: MissingForm
  ai_image_url: string | null
  created_at: number
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg'
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

function extractRegion(address: string): string {
  const regions = ['서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주']
  for (const r of regions) {
    if (address.includes(r)) return r
  }
  return ''
}

const DEMO_PERSONS: MissingPerson[] = [
  {
    id: 'demo-cnu-eng5',
    name: '정민수',
    age: 22,
    gender: '남',
    photo_url: '/static/uploads/generated_정민수_eac6bcb5.png',
    last_seen_address: '대전광역시 유성구 충남대학교 공대5호관',
    last_seen_date: '2026-05-24',
    body_info: { height: 175, weight: 68, build: '보통', face_shape: '계란형' },
    clothing: '검정 후드티에 청바지, 흰색 운동화 차림 / 회색 백팩 소지',
    hair: { color: '검정', style: '단발' },
    is_urgent: true,
    status_note: '수색 구역 1개 감시 중',
  },
]

function mapBackendPerson(p: BackendPerson): MissingPerson {
  // /static/... paths are proxied through Vite, no prefix needed
  const photoUrl = p.generated_image_url || p.original_photo_url || ''
  return {
    id: String(p.id),
    name: p.name || '',
    age: p.age || 0,
    gender: (p.gender as '남' | '여') || '남',
    photo_url: photoUrl,
    last_seen_address: p.missing_location || '',
    last_seen_date: p.missing_date ? p.missing_date.split('T')[0] : '',
    body_info: {
      height: p.height ?? undefined,
      weight: p.weight ?? undefined,
      face_shape: p.face_shape ?? undefined,
    },
    clothing: p.clothing || '',
    hair: {
      color: p.hair_color || '',
      style: p.hair_style || '',
    },
    is_urgent: false,
  }
}

export async function getMissingPersons(): Promise<MissingPerson[]> {
  const res = await fetch(`${API_BASE}/missing`)
  if (!res.ok) throw new Error('실종자 목록 조회 실패')
  const data: BackendPerson[] = await res.json()
  return [...DEMO_PERSONS, ...data.map(mapBackendPerson)]
}

export interface BroadcastPayload {
  url: string
  region?: string | null
  lat?: number | null
  lng?: number | null
  result_count?: number | null
}

export async function createBroadcast(payload: BroadcastPayload): Promise<{ id: number; url: string; expires_at: string } | null> {
  try {
    const res = await fetch(`${API_BASE}/broadcasts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      console.error('[broadcast] create failed', res.status)
      return null
    }
    return await res.json()
  } catch (err) {
    console.error('[broadcast] network error', err)
    return null
  }
}

export async function getMissingPerson(id: string): Promise<MissingPerson | null> {
  const demo = DEMO_PERSONS.find(p => p.id === id)
  if (demo) return demo
  const res = await fetch(`${API_BASE}/missing/${id}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error('실종자 상세 조회 실패')
  const data: BackendPerson = await res.json()
  return mapBackendPerson(data)
}

export async function createMissing(form: MissingForm): Promise<{ success: true; id: string }> {
  const id = await submitAndGetFlyerId(form)
  return { success: true, id }
}

export async function searchMissing(keyword: string, filters: SearchFilters): Promise<MissingPerson[]> {
  const params = new URLSearchParams()
  if (filters.region !== '전체') params.set('region', filters.region)
  const res = await fetch(`${API_BASE}/missing?${params}`)
  if (!res.ok) throw new Error('검색 실패')
  let data: BackendPerson[] = await res.json()

  const kw = keyword.trim()
  if (kw) {
    data = data.filter(p =>
      (p.name || '').includes(kw) || (p.missing_location || '').includes(kw)
    )
  }
  if (filters.gender !== 'all') {
    data = data.filter(p => p.gender === filters.gender)
  }
  if (filters.period !== 'all') {
    const today = new Date()
    data = data.filter(p => {
      if (!p.missing_date) return false
      const days = (today.getTime() - new Date(p.missing_date).getTime()) / (1000 * 60 * 60 * 24)
      if (filters.period === '1w' && days > 7) return false
      if (filters.period === '1m' && days > 30) return false
      return true
    })
  }

  const regionMap: Record<string, string> = {
    서울: '서울', 경기: '경기', 충남: '충남',
    대전: '대전', 부산: '부산',
  }
  const demoFiltered = DEMO_PERSONS.filter(d => {
    if (kw && !(d.name.includes(kw) || d.last_seen_address.includes(kw))) return false
    if (filters.gender !== 'all' && d.gender !== filters.gender) return false
    if (filters.region !== '전체') {
      const needle = regionMap[filters.region] ?? filters.region
      if (!d.last_seen_address.includes(needle)) return false
    }
    if (filters.period !== 'all') {
      const today = new Date()
      const days = (today.getTime() - new Date(d.last_seen_date).getTime()) / (1000 * 60 * 60 * 24)
      if (filters.period === '1w' && days > 7) return false
      if (filters.period === '1m' && days > 30) return false
    }
    return true
  })

  return [...demoFiltered, ...data.map(mapBackendPerson)]
}

export async function submitAndGetFlyerId(form: MissingForm): Promise<string> {
  const fd = new FormData()

  if (form.photo_data_url) {
    const blob = dataUrlToBlob(form.photo_data_url)
    fd.append('photo', blob, 'photo.jpg')
  }

  if (form.name) fd.append('name', form.name)
  if (form.age) fd.append('age', String(form.age))
  if (form.gender) fd.append('gender', form.gender)
  if (form.height) fd.append('height', String(form.height))
  if (form.weight) fd.append('weight', String(form.weight))
  if (form.face_shape) fd.append('face_shape', form.face_shape)
  if (form.hair_color) fd.append('hair_color', form.hair_color)
  if (form.hair_style) fd.append('hair_style', form.hair_style)
  if (form.clothing) fd.append('clothing', form.clothing)
  if (form.occurred_at) fd.append('missing_date', form.occurred_at)
  if (form.last_known_address) {
    fd.append('missing_location', form.last_known_address)
    const region = extractRegion(form.last_known_address)
    if (region) fd.append('missing_region', region)
  }
  if (form.last_known_lat != null) fd.append('missing_latitude', String(form.last_known_lat))
  if (form.last_known_lng != null) fd.append('missing_longitude', String(form.last_known_lng))
  if (form.with_guardian && form.last_known_place_name) {
    fd.append('specific_location', form.last_known_place_name)
  }

  const res = await fetch(`${API_BASE}/missing/register`, {
    method: 'POST',
    body: fd,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: '서버 오류' }))
    throw new Error(err.detail || '등록 실패')
  }
  const data: BackendPerson = await res.json()
  const id = String(data.id)

  const stored: FlyerStored = {
    form,
    ai_image_url: data.generated_image_url ?? null,
    created_at: Date.now(),
  }
  localStorage.setItem(`flyer-${id}`, JSON.stringify(stored))

  return id
}

export async function getFlyer(id: string): Promise<FlyerStored | null> {
  const cached = localStorage.getItem(`flyer-${id}`)
  if (cached) {
    return JSON.parse(cached) as FlyerStored
  }

  // Fallback: reconstruct from backend
  const res = await fetch(`${API_BASE}/missing/${id}`)
  if (!res.ok) return null
  const data: BackendPerson = await res.json()

  const form: MissingForm = {
    name: data.name || '',
    age: data.age || '',
    gender: (data.gender as MissingForm['gender']) || '',
    nationality: '내국인',
    height: data.height || '',
    weight: data.weight || '',
    build: '',
    face_shape: data.face_shape || '',
    with_guardian: false,
    hair_color: data.hair_color || '',
    hair_style: data.hair_style || '',
    clothing: data.clothing || '',
    occurred_at: data.missing_date || '',
    last_known_address: data.missing_location || '',
    last_known_lat: null,
    last_known_lng: null,
    last_known_place_name: '',
    exact_location_unknown: !data.missing_location,
    photo_data_url: data.original_photo_url ?? null,
    reporter_name: '',
    reporter_relation: '',
    reporter_phone: '',
    reporter_location: '',
    agree_privacy: true,
    agree_ai: true,
  }

  return {
    form,
    ai_image_url: data.generated_image_url ?? null,
    created_at: Date.now(),
  }
}

export async function generateFlyer(id: string): Promise<{ ai_image_url: string }> {
  // Image is already generated by the backend during registration.
  const res = await fetch(`${API_BASE}/missing/${id}`)
  if (!res.ok) throw new Error('전단지 조회 실패')
  const data: BackendPerson = await res.json()
  return { ai_image_url: data.generated_image_url ?? '' }
}
