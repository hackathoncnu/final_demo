import { useEffect, useState } from 'react'
import { coordToAddress, hasKakaoKey, searchKeyword } from '../services/kakao'
import type { KakaoPlace } from '../services/kakao'

export interface LocationPayload {
  address: string
  lat: number | null
  lng: number | null
  place_name: string
}

interface Props {
  label: string
  value: string
  lat?: number | null
  lng?: number | null
  placeName?: string
  onChange: (payload: LocationPayload) => void
  required?: boolean
  hint?: string
}

export default function LocationPicker({
  label,
  value,
  lat,
  lng,
  placeName,
  onChange,
  required,
  hint
}: Props) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<KakaoPlace[]>([])
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [manualMode, setManualMode] = useState(false)

  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    if (manualMode) return
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setResults([])
      setSearched(false)
      return
    }
    const handle = setTimeout(async () => {
      setSearching(true)
      const docs = await searchKeyword(trimmed)
      setResults(docs)
      setSearched(true)
      setSearching(false)
    }, 300)
    return () => clearTimeout(handle)
  }, [query, manualMode])

  const handlePick = (place: KakaoPlace) => {
    const addr = place.road_address_name || place.address_name
    onChange({
      address: addr,
      lat: parseFloat(place.y),
      lng: parseFloat(place.x),
      place_name: place.place_name
    })
    setQuery(addr)
    setResults([])
    setSearched(false)
    setManualMode(false)
  }

  const handleManualConfirm = (text: string) => {
    onChange({ address: text.trim(), lat: null, lng: null, place_name: '' })
    setResults([])
  }

  const handleGPS = () => {
    if (!navigator.geolocation) {
      alert('이 브라우저는 위치 정보를 지원하지 않습니다.')
      return
    }
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      alert(
        '보안 연결(HTTPS) 또는 localhost가 아니면 위치 정보를 가져올 수 없어요.\n\n' +
        'http://localhost:5173 으로 접속해 주세요. (현재 주소가 192.168.x.x 처럼 IP면 안 됩니다)'
      )
      return
    }

    setGpsLoading(true)

    const onSuccess = async (pos: GeolocationPosition) => {
      const { latitude, longitude } = pos.coords
      const addr = await coordToAddress(longitude, latitude)
      onChange({
        address: addr || `위도 ${latitude.toFixed(5)}, 경도 ${longitude.toFixed(5)}`,
        lat: latitude,
        lng: longitude,
        place_name: ''
      })
      setQuery(addr)
      setResults([])
      setGpsLoading(false)
    }

    const explain = (err: GeolocationPositionError): string => {
      switch (err.code) {
        case err.PERMISSION_DENIED:
          return (
            '위치 권한이 차단되어 있어요.\n\n' +
            '- 브라우저 주소창 왼쪽 자물쇠 아이콘 → 위치 → 허용\n' +
            '- Windows 설정 → 개인정보 보호 → 위치 → "이 디바이스의 위치 사용" 켜기'
          )
        case err.POSITION_UNAVAILABLE:
          return (
            '현재 위치를 확인할 수 없어요. (GPS 신호 약함)\n\n' +
            '- 실내라면 창가로 이동\n' +
            '- 노트북이면 Wi-Fi가 켜져 있는지 확인\n' +
            '- 그래도 안 되면 아래 검색창에 주소를 직접 입력해 주세요.'
          )
        case err.TIMEOUT:
          return '위치를 가져오는 데 너무 오래 걸려요. 잠시 후 다시 시도하거나 주소를 직접 입력해 주세요.'
        default:
          return `위치 정보를 가져올 수 없습니다. (${err.message || '알 수 없는 오류'})`
      }
    }

    const tryLowAccuracy = () => {
      navigator.geolocation.getCurrentPosition(
        onSuccess,
        err => {
          setGpsLoading(false)
          alert(explain(err))
        },
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
        tryLowAccuracy()
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    )
  }

  const showEmptyState =
    searched && !searching && results.length === 0 && query.trim().length >= 2 && !manualMode

  const hasCoord = lat != null && lng != null
  const kakaoMapUrl = hasCoord
    ? `https://map.kakao.com/link/map/${encodeURIComponent(placeName || value || '선택 위치')},${lat},${lng}`
    : null

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">
          {label} {required && <span className="text-danger">*</span>}
        </label>
        {hint && <p className="text-xs text-text-muted mb-2">{hint}</p>}
        {!hasKakaoKey && (
          <p className="text-xs text-danger mb-2">
            카카오 API 키가 설정되지 않았습니다. 자유 입력만 가능합니다.
          </p>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleGPS}
            disabled={gpsLoading}
            className="px-3 py-2 bg-secondary text-white rounded-card text-sm font-medium hover:bg-secondary-hover disabled:opacity-50 flex items-center gap-1 whitespace-nowrap"
          >
            {gpsLoading ? '...' : '📍 내 위치'}
          </button>
          <input
            type="text"
            placeholder={manualMode ? '주소 직접 입력' : '장소·도로명·아파트명 검색 (예: 강경 이마트)'}
            value={query}
            onChange={e => {
              setQuery(e.target.value)
              if (manualMode) handleManualConfirm(e.target.value)
            }}
            className="flex-1 px-3 py-2 bg-surface border border-border-warm rounded-card text-sm focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {searching && (
        <div className="text-sm text-text-muted px-3">검색 중...</div>
      )}

      {!searching && results.length > 0 && !manualMode && (
        <ul className="bg-surface border border-border-warm rounded-card overflow-hidden shadow-card">
          {results.map((place, i) => (
            <li key={`${place.place_name}-${i}`}>
              <button
                type="button"
                onClick={() => handlePick(place)}
                className="w-full text-left px-4 py-3 hover:bg-background border-b border-border-warm last:border-b-0"
              >
                <div className="text-sm font-medium text-text-primary">{place.place_name}</div>
                <div className="text-xs text-text-muted mt-0.5">
                  {place.road_address_name || place.address_name}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {showEmptyState && (
        <div className="bg-background border border-border-warm rounded-card p-4 text-sm text-text-muted">
          <p className="mb-2">"{query}" 검색 결과가 없습니다.</p>
          <button
            type="button"
            onClick={() => {
              setManualMode(true)
              setResults([])
              setSearched(false)
              handleManualConfirm(query)
            }}
            className="text-primary font-medium underline"
          >
            입력한 내용 그대로 사용하기
          </button>
        </div>
      )}

      {value && (
        <div className="bg-background border border-border-warm rounded-card p-3">
          <div className="flex items-start gap-2">
            <span className="text-primary text-xl leading-none">📍</span>
            <div className="flex-1 space-y-1">
              {placeName && (
                <p className="text-sm font-bold text-text-primary">{placeName}</p>
              )}
              <p className="text-sm text-text-primary">{value}</p>
              {hasCoord && (
                <p className="text-xs text-text-muted">
                  위도 {lat!.toFixed(5)}, 경도 {lng!.toFixed(5)}
                </p>
              )}
            </div>
          </div>
          {kakaoMapUrl && (
            <a
              href={kakaoMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block mt-2 text-xs text-primary underline text-right"
            >
              카카오맵에서 위치 확인 →
            </a>
          )}
        </div>
      )}
    </div>
  )
}
