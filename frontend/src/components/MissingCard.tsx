import type { MissingPerson } from '../types'

interface Props {
  person: MissingPerson
  onClick?: (person: MissingPerson) => void
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${y}.${m}.${day} ${hh}:${mm}`
}

function daysAgo(dateStr: string): string {
  const today = new Date('2026-05-24')
  const seen = new Date(dateStr)
  const days = Math.floor((today.getTime() - seen.getTime()) / (1000 * 60 * 60 * 24))
  if (days <= 0) return '오늘'
  if (days === 1) return '어제'
  if (days < 30) return `${days}일 전`
  if (days < 365) return `${Math.floor(days / 30)}개월 전`
  return `${Math.floor(days / 365)}년 전`
}

export default function MissingCard({ person, onClick }: Props) {
  return (
    <button
      onClick={() => onClick?.(person)}
      className="text-left bg-surface border border-border-warm hover:border-primary hover:shadow-card transition-all w-full p-4 flex gap-4 group"
    >
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 overflow-hidden bg-background border border-border-warm">
        <img
          src={person.photo_url}
          alt={person.name}
          className="w-full h-full object-cover"
          style={{ objectPosition: '50% 25%' }}
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&background=1E40AF&color=fff&size=200`
          }}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline flex-wrap gap-x-2 gap-y-1 mb-1.5">
          <h3 className="font-bold text-base text-text-primary">{person.name}</h3>
          <span className="text-sm text-text-muted">({person.age}세 {person.gender})</span>
          {person.is_urgent && (
            <span className="bg-urgent text-white text-[11px] font-bold px-1.5 py-0.5 rounded-sm">
              긴급
            </span>
          )}
        </div>

        <dl className="text-sm space-y-1">
          <div className="flex">
            <dt className="text-text-muted w-16 flex-shrink-0">발생일시</dt>
            <dd className="text-text-primary flex-1 truncate">
              {formatDate(person.last_seen_date)}
              <span className="text-text-muted ml-2 text-xs">({daysAgo(person.last_seen_date)})</span>
            </dd>
          </div>
          <div className="flex">
            <dt className="text-text-muted w-16 flex-shrink-0">발생장소</dt>
            <dd className="text-text-primary flex-1 truncate">{person.last_seen_address}</dd>
          </div>
          <div className="flex">
            <dt className="text-text-muted w-16 flex-shrink-0">착의</dt>
            <dd className="text-text-primary flex-1 truncate">{person.clothing}</dd>
          </div>
        </dl>

        {person.status_note && (
          <div className="mt-2 inline-flex items-center gap-1 bg-secondary/10 text-secondary text-[11px] font-bold px-2 py-0.5 rounded-sm">
            <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-pulse" />
            {person.status_note}
          </div>
        )}

        <div className="mt-2 text-xs text-primary font-medium group-hover:underline">
          상세 정보 →
        </div>
      </div>
    </button>
  )
}
