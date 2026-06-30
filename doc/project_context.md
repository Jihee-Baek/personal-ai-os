# Personal AI OS 개발 프롬프트

## 프로젝트 개요

개인용 AI 비서 웹 애플리케이션(Personal AI OS)을 개발하고 싶습니다.

이 프로젝트는 매일 컴퓨터를 켜면 가장 먼저 실행하는 개인 대시보드입니다.

단순한 웹페이지가 아니라 AI와 GitHub, 일정 관리, 주식, 환율 등을 하나의 화면에서 관리하는 개인 운영 시스템을 목표로 합니다.

향후 기능이 계속 추가될 예정이므로 처음부터 확장 가능한 구조로 설계해주세요.

---

# 목표

다음 조건을 만족하도록 설계합니다.

- 유지보수가 쉬운 구조
- 컴포넌트 기반 설계
- 모듈화
- AI 기능 추가가 쉬운 구조
- API 추가가 쉬운 구조
- Widget 형태의 Dashboard
- Docker로 쉽게 실행 가능
- GitHub Actions 배포 가능
- 모바일도 어느 정도 대응하지만 **PC 사용을 우선**합니다.

---

# 기술 스택

## Frontend

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query

## Backend

- FastAPI
- Python
- SQLAlchemy

## Database

- PostgreSQL

## Authentication

- 현재는 Local User 1명만 사용
- 추후 OAuth(Google, GitHub 등) 추가 예정

## Deployment

- Docker
- Docker Compose

## Repository

- GitHub

---
## AI
- OpenRouter 사용
- Provider Layer를 통해 Claude / GPT / Gemini / DeepSeek 등 쉽게 교체 가능

```text
AIService
    │
    └── OpenRouter
          ├── Claude
          ├── GPT
          ├── Gemini
          └── DeepSeek
```

환경변수 예시

```env
OPENROUTER_API_KEY=
GITHUB_TOKEN=
DATABASE_URL=
WEATHER_API_KEY=
NEXT_PUBLIC_API_URL=
```

---

# 주요 위젯

1. 현재 시간
- 시간 / 날짜 / 요일
- 1초마다 갱신

2. 날씨
- 위치 자동 인식
- 기온 / 체감온도 / 아이콘
- 30분마다 갱신

3. 일정 관리
- 일정 CRUD
- 달력
- AI 일정 요약

4. 주식
- 보유 종목 관리
- 수익률
- 무료 API Provider 구조

5. 환율
- USD/KRW
- JPY/KRW
- EUR/KRW

6. AI Chat
- OpenRouter 연결
- Markdown 및 코드블록 지원
- 대화 저장

7. GitHub
- Repository 연결
- Commit / PR 조회
- AI 변경사항 요약
- 버그 가능성 및 코드 리뷰

8. Quick Memo
- Markdown 메모
- AI 요약
- AI 태그 생성

9. 오늘의 브리핑
- 일정
- 날씨
- 주식
- 환율
- GitHub 활동
- AI 종합 브리핑

---

# 개발 원칙

- Clean Architecture
- SOLID
- Feature 기반 구조
- Repository Pattern
- Service Layer
- Provider Pattern
- TypeScript Strict Mode
- Docker 지원
- GitHub Actions 배포
- Swagger 자동 생성

---

# 향후 추가 기능

- MCP 지원
- AI Agent
- Gmail
- Google Calendar
- Discord
- Slack
- Spotify
- 뉴스 요약
- 음성 비서
- Habit Tracker

---

# 최종 목표

단순한 대시보드가 아니라 **Personal AI OS**를 구축하며, 기능을 플러그인처럼 계속 추가할 수 있는 구조를 목표로 합니다.
