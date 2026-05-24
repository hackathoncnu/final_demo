# 집으로 (zi-bro) — 최종 데모

> 치매 노인 실종자를 찾기 위한 GPS 기반 실종자 알림 서비스

## 프로젝트 소개

**집으로(zi-bro)**는 치매 노인 실종 사건 발생 시, 실종 예상 지역 내 시민들의 휴대폰에 자동으로 알림을 보내 실종자 발견 확률을 높이는 서비스입니다.

### 서비스 구조

```
[보호자 PC/웹]          [백엔드 서버]          [시민 휴대폰 앱]
  실종자 등록     →     FastAPI + SQLite    ←    GPS 모니터링
  AI 전단지 생성  →     데이터 저장/조회     →    실종자 알림
  위치 기반 검색  →     동적 링크 생성       →    전단지 웹 연결
```

## 프로젝트 구조

```
final_demo/
├── frontend/          # 보호자용 웹 (React + Vite + TypeScript)
├── backend/           # API 서버 (FastAPI + SQLite)
└── zi-bro-app/        # 시민용 모바일 앱 (Flutter)
```

## 각 모듈 설명

### frontend/ — 보호자용 웹사이트
보호자가 실종자 정보를 등록하고, AI가 생성한 전단지를 확인하며, 주변 시민에게 알림을 보내는 웹 인터페이스

- 실종자 등록 (사진, 인상착의, 위치 정보)
- AI 전단지 생성 및 미리보기
- 위치 기반 실종자 검색
- 동적 링크 브로드캐스트 (시민 앱에 실시간 알림 전달)

### backend/ — FastAPI 백엔드
실종자 데이터 관리, AI 이미지 생성, GPS 섹터 제공, 보안 레이어를 담당하는 API 서버

- 실종자 CRUD API
- Gemini AI 기반 실종자 전신 이미지 생성
- GPS 섹터 API (Flutter 앱에 실종자 위치 제공)
- 동적 링크(BroadcastLink) 시스템 — 보호자 → 시민 실시간 연결
- 보안 강화: SQL Injection 방어, Rate Limiting, MIME 검증, Path Traversal 방지 등

### zi-bro-app/ — 시민용 Flutter 앱
시민이 설치하면 백그라운드에서 GPS를 모니터링하고, 주변에 실종자가 있으면 자동으로 알림을 보내는 모바일 앱

- 백그라운드 GPS 모니터링
- 섹터 기반 트리거 (실종자 발생 지역에 일정 시간 머무르면 알림)
- 알림 탭 시 전단지 웹페이지 자동 연결
- 동적 링크 지원 (보호자가 보낸 실시간 링크 우선 표시)

## 핵심 흐름

```
1. 보호자가 웹에서 실종자 등록 (사진 + 인상착의)
2. AI(Gemini)가 전신 합성 이미지 생성
3. 보호자가 "내 위치 근처 실종자 보기" 클릭
4. 백엔드에 동적 링크(30분 TTL) 저장
5. 시민 앱이 GET /missing/sectors 폴링
6. 시민이 실종자 섹터에 10초 이상 머무르면 알림 발생
7. 알림 클릭 → 브라우저에서 전단지/검색 페이지 열림
```

## 실행 방법

### 백엔드
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
```

### 프론트엔드
```bash
cd frontend
npm install
npm run dev -- --host
```

### Flutter 앱
```bash
cd zi-bro-app
flutter pub get
flutter run
```

## 기술 스택

| 구분 | 기술 |
|------|------|
| 프론트엔드 | React, Vite, TypeScript, Tailwind CSS |
| 백엔드 | FastAPI, SQLAlchemy, SQLite |
| AI | Google Gemini API (전신 이미지 생성) |
| 모바일 앱 | Flutter, Dart |
| GPS/알림 | Geolocator, flutter_background_service, flutter_local_notifications |
| 보안 | slowapi (Rate Limiting), PIL (MIME 검증), SQL sanitize |

## 팀 구성

| 역할 | 담당 |
|------|------|
| 모듈 1: AI 이미지 생성 + 데이터 모듈 + 보안 | 김재현 |
| 모듈 2: GPS 기반 모듈 + 앱 알림 | 이승훈 |
| 모듈 4: 프론트엔드 웹사이트 | 장정원 |

## 라이선스

SOGRA 해커톤 2026에서 개발되었습니다.
