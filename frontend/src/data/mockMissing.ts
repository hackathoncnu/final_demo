import type { MissingPerson } from '../types'

export const mockMissingPersons: MissingPerson[] = [
  {
    id: 'm-001',
    name: '김옥태',
    age: 64,
    gender: '남',
    photo_url: 'https://images.unsplash.com/photo-1604881991720-f91add269bed?w=400&q=80',
    last_seen_address: '충청남도 논산시 강경읍',
    last_seen_date: '2023-10-13',
    body_info: { height: 157, weight: 53, build: '왜소', face_shape: '계란형' },
    clothing: '운동복 차림',
    hair: { color: '반백', style: '스포츠형' },
    is_urgent: true
  },
  {
    id: 'm-002',
    name: '홍길동',
    age: 72,
    gender: '남',
    photo_url: 'https://images.unsplash.com/photo-1559963110-71b394e7494d?w=400&q=80',
    last_seen_address: '서울특별시 종로구 인사동',
    last_seen_date: '2026-04-15',
    body_info: { height: 168, weight: 65, build: '보통', face_shape: '둥근형' },
    clothing: '회색 점퍼, 검정 바지',
    hair: { color: '백발', style: '단발' },
    is_urgent: false
  },
  {
    id: 'm-003',
    name: '박순자',
    age: 68,
    gender: '여',
    photo_url: 'https://images.unsplash.com/photo-1581579438747-104c53e7b5b1?w=400&q=80',
    last_seen_address: '대전광역시 유성구 봉명동',
    last_seen_date: '2026-05-20',
    body_info: { height: 152, weight: 48, build: '마름', face_shape: '계란형' },
    clothing: '꽃무늬 블라우스, 검정 치마',
    hair: { color: '검정', style: '단발' },
    is_urgent: true
  },
  {
    id: 'm-004',
    name: '이순자',
    age: 75,
    gender: '여',
    photo_url: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400&q=80',
    last_seen_address: '충청남도 천안시 동남구',
    last_seen_date: '2026-05-18',
    body_info: { height: 150, weight: 51, build: '보통', face_shape: '둥근형' },
    clothing: '베이지 카디건, 회색 바지',
    hair: { color: '백발', style: '장발' },
    is_urgent: false
  },
  {
    id: 'm-005',
    name: '최영자',
    age: 70,
    gender: '여',
    photo_url: 'https://images.unsplash.com/photo-1559963629-bfd6e3b30180?w=400&q=80',
    last_seen_address: '경기도 수원시 영통구',
    last_seen_date: '2026-05-22',
    body_info: { height: 155, weight: 56, build: '통통', face_shape: '둥근형' },
    clothing: '분홍 점퍼, 청바지',
    hair: { color: '검정', style: '단발' },
    is_urgent: false
  },
  {
    id: 'm-006',
    name: '정복녀',
    age: 80,
    gender: '여',
    photo_url: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=400&q=80',
    last_seen_address: '부산광역시 해운대구 좌동',
    last_seen_date: '2026-04-30',
    body_info: { height: 148, weight: 45, build: '왜소', face_shape: '계란형' },
    clothing: '한복 저고리, 검정 치마',
    hair: { color: '백발', style: '쪽머리' },
    is_urgent: true
  }
]
