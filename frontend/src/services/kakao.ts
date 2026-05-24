export interface KakaoPlace {
  place_name: string
  address_name: string
  road_address_name: string
  x: string
  y: string
}

interface KakaoKeywordResponse {
  documents: KakaoPlace[]
}

interface KakaoCoord2AddressDoc {
  road_address: { address_name: string } | null
  address: { address_name: string } | null
}

interface KakaoCoord2AddressResponse {
  documents: KakaoCoord2AddressDoc[]
}

const REST_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY as string | undefined

export const hasKakaoKey = Boolean(REST_API_KEY)

const BASE_HEADERS = {
  Authorization: `KakaoAK ${REST_API_KEY ?? ''}`
}

export async function searchKeyword(query: string, size = 10): Promise<KakaoPlace[]> {
  if (!REST_API_KEY) {
    console.warn('[kakao] VITE_KAKAO_REST_API_KEY 가 비어있음 — .env.local 확인 후 dev 서버 재시작 필요')
    return []
  }
  const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&size=${size}`
  try {
    const res = await fetch(url, { headers: BASE_HEADERS })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error(`[kakao] searchKeyword ${res.status} ${res.statusText}`, body)
      if (res.status === 401) console.error('[kakao] 401 → 키가 잘못되었거나 JavaScript 키를 넣었을 가능성. REST API 키 확인.')
      if (res.status === 403) {
        if (body.includes('OPEN_MAP_AND_LOCAL') || body.includes('disabled')) {
          console.error('[kakao] 403 OPEN_MAP_AND_LOCAL disabled → 카카오 디벨로퍼스 앱 → 좌측 메뉴 "카카오 맵" → 활성화 ON 필요')
        } else {
          console.error('[kakao] 403 → Web 플랫폼 미등록 또는 서비스 비활성. 앱 설정 확인 필요')
        }
      }
      return []
    }
    const data: KakaoKeywordResponse = await res.json()
    return data.documents
  } catch (err) {
    console.error('[kakao] searchKeyword 네트워크 오류:', err)
    return []
  }
}

export async function coordToAddress(lng: number, lat: number): Promise<string> {
  if (!REST_API_KEY) {
    console.warn('[kakao] REST API 키 없음')
    return ''
  }
  const url = `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${lng}&y=${lat}`
  try {
    const res = await fetch(url, { headers: BASE_HEADERS })
    if (!res.ok) {
      console.error(`[kakao] coordToAddress ${res.status} ${res.statusText}`)
      return ''
    }
    const data: KakaoCoord2AddressResponse = await res.json()
    const doc = data.documents[0]
    if (!doc) return ''
    return doc.road_address?.address_name ?? doc.address?.address_name ?? ''
  } catch (err) {
    console.error('[kakao] coordToAddress 네트워크 오류:', err)
    return ''
  }
}
