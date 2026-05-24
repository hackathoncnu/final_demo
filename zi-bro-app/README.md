# 집으로 (zi-bro) 🏠📍

치매 노인 실종자를 찾기 위한 GPS 기반 실종자 알림 앱

## 프로젝트 소개

**집으로(zi-bro)**는 치매 노인 실종 사건 발생 시, 실종 예상 지역 내 시민들의 휴대폰에 자동으로 알림을 보내 실종자 발견 확률을 높이는 서비스입니다.

### 핵심 기능

- **백그라운드 GPS 모니터링**: 앱 설치 후 모니터링을 시작하면, 백그라운드에서 사용자의 위치를 주기적으로 확인
- **섹터 기반 트리거**: 실종자 발생 지역(구 단위 섹터)에 사용자가 일정 시간 이상 머무르면 알림 발생
- **실종자 전단지 연결**: 알림 수신 시 자동으로 웹 브라우저가 열리며, 실종자 전단지(AI 생성) 확인 가능

### 작동 흐름

```
앱 설치 → GPS 권한 허용 → 모니터링 시작
    → 백그라운드 GPS 감지
    → 실종자 섹터 진입 감지
    → 일정 시간(10초/데모) 머무름
    → 팝업 알림 + 웹 전단지 자동 열기
```

## 기술 스택

| 구분 | 기술 |
|------|------|
| 앱 | Flutter (Dart) |
| GPS | Geolocator |
| 백그라운드 | flutter_background_service |
| 알림 | flutter_local_notifications |
| URL 연동 | url_launcher |
| 웹 연결 | 웹팀 전단지 페이지 URL 연동 |

## 프로젝트 구조

```
zi_bro_app/
├── lib/
│   ├── main.dart                      ← 앱 진입점 + 메인 UI
│   ├── data/
│   │   └── sectors.dart               ← 실종자 섹터 데이터 (좌표, 반경, URL)
│   └── services/
│       ├── location_service.dart      ← GPS 추적 + 섹터 판별 + 알림 발송
│       └── notification_service.dart  ← (예비) 알림 서비스
├── android/
│   └── app/src/main/
│       ├── AndroidManifest.xml        ← GPS/알림 권한 설정
│       └── res/mipmap-*/              ← 앱 아이콘, 알림 아이콘
└── pubspec.yaml                       ← Flutter 패키지 의존성
```

## 설치 및 실행

### 사전 준비

- Flutter SDK 설치
- Android Studio + Android SDK 설치
- Android 기기 (USB 디버깅 활성화)

### 실행

```bash
git clone https://github.com/hackathoncnu/zi-bro-app.git
cd zi-bro-app
flutter pub get
flutter run
```

### 섹터 데이터 수정

`lib/data/sectors.dart`에서 실종자 발생 위치와 전단지 URL을 수정:

```dart
Sector(
  id: 'sector_id',
  name: '지역 이름',
  lat: 위도,
  lng: 경도,
  radiusM: 반경(미터),
  flyerUrl: '전단지 웹 URL',
),
```

## 팀 구성

| 역할 | 담당 |
|------|------|
| 모듈 1: 이미지 생성 API + 데이터 모듈 | 김재현 |
| 모듈 2: GPS 기반 모듈 + 앱 알림 | 이승훈 |
| 모듈 4: 프론트엔드 웹사이트 | 장정원 |

## 향후 계획

- FCM Push 알림 (서버 → 사용자 직접 전송)
- GPS 반경 검색 고도화 (PostGIS)
- 모바일 앱 스토어 배포 (Google Play / App Store)
- 실종자 신고 접수 기능
- 앱 내 전단지 뷰어

## 라이선스

이 프로젝트는 SOGRA 해커톤 2026에서 개발되었습니다.
