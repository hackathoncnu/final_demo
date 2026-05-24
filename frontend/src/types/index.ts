export interface MissingPerson {
  id: string
  name: string
  age: number
  gender: '남' | '여'
  photo_url: string
  last_seen_address: string
  last_seen_date: string
  body_info: {
    height?: number
    weight?: number
    build?: string
    face_shape?: string
  }
  clothing: string
  hair: { color: string; style: string }
  is_urgent: boolean
  status_note?: string
}

export interface Reporter {
  name: string
  relation: string
  phone: string
  reporter_location: string
}

export interface MissingForm {
  name: string
  age: number | ''
  gender: '남' | '여' | ''
  nationality: string
  height: number | ''
  weight: number | ''
  build: string
  face_shape: string
  with_guardian: boolean
  hair_color: string
  hair_style: string
  clothing: string
  occurred_at: string
  last_known_address: string
  last_known_lat: number | null
  last_known_lng: number | null
  last_known_place_name: string
  exact_location_unknown: boolean
  photo_data_url: string | null
  reporter_name: string
  reporter_relation: string
  reporter_phone: string
  reporter_location: string
  agree_privacy: boolean
  agree_ai: boolean
}

export interface SearchFilters {
  period: 'all' | '1w' | '1m'
  region: string
  gender: '남' | '여' | 'all'
}
