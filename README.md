# Personal AI OS (개인용 AI 운영체제 대시보드)

Personal AI OS는 매일 아침 컴퓨터를 켤 때 가장 먼저 마주하는 개인화 대시보드 애플리케이션입니다. AI 비서 기능, 캘린더/일정 관리, 날씨, 주식 시세, 환율 정보, GitHub 활동 로그, 빠른 메모 작성 등을 하나의 통합 웹 화면에서 모니터링하고 제어할 수 있는 개인 포털 시스템을 지향합니다.

이 프로젝트는 Clean Architecture와 SOLID 원칙을 기반으로 유연하게 설계되어 새로운 위젯이나 기능을 플러그인처럼 쉽게 추가할 수 있습니다.

---

## 기술 스택

### Frontend (프론트엔드)
- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui & Lucide React Icons
- **Data Fetching**: TanStack Query (React Query)

### Backend (백엔드)
- **Framework**: FastAPI
- **Language**: Python 3.11+
- **ORM & DB Tool**: SQLAlchemy & Alembic
- **API Spec**: Swagger (자동 생성)

### Database & Infrastructure (데이터베이스 및 인프라)
- **Database**: PostgreSQL 15
- **Containerization**: Docker & Docker Compose

---

## 폴더 구조

```text
personal-ai-os/
  ├── doc/                      # 프로젝트 요구사항 및 설계 문서
  ├── frontend/                 # Next.js 프론트엔드 애플리케이션
  │    ├── src/
  │    │    ├── app/            # Next.js App Router (페이지 레이아웃 및 라우팅)
  │    │    ├── components/     # 공통 UI 컴포넌트 및 위젯 컴포넌트
  │    │    └── hooks/          # 커스텀 훅 및 상태 관리
  │    ├── Dockerfile          # 프론트엔드 빌드용 Dockerfile
  │    └── package.json
  ├── backend/                  # FastAPI 백엔드 애플리케이션
  │    ├── app/
  │    │    ├── api/            # API 라우터 및 엔드포인트
  │    │    ├── core/           # DB 설정, 환경 변수 등 핵심 모듈
  │    │    ├── models/         # SQLAlchemy 데이터베이스 모델
  │    │    ├── schemas/        # Pydantic 데이터 검증 스키마
  │    │    └── services/       # 비즈니스 로직 및 AI Provider Layer
  │    ├── alembic/             # DB 마이그레이션 파일
  │    ├── Dockerfile          # 백엔드 빌드용 Dockerfile
  │    └── requirements.txt     # 백엔드 의존성 패키지 목록
  ├── docker-compose.yml        # 전체 서비스 오케스트레이션 설정
  ├── .env.example              # 환경 변수 템플릿
  └── README.md                 # 프로젝트 설명서 (본 파일)
```

---

## 실행 방법

### 로컬 개발 환경 실행

#### 1. 환경 변수 설정
프로젝트 루트 폴더에 `.env.example` 파일을 복사하여 `.env` 파일을 생성합니다.

```bash
cp .env.example .env
```

`.env` 파일에 필요한 API 키 및 데이터베이스 주소를 입력합니다. (기본 설정 상태로도 더미 데이터를 사용해 실행할 수 있습니다.)

#### 2. Docker Compose로 통합 실행
프로젝트 루트 경로에서 Docker Compose를 사용해 전체 서비스를 실행합니다.

```bash
docker compose up --build
```

실행이 완료되면 다음 주소들을 통해 서비스에 접속할 수 있습니다:
- **프론트엔드 (대시보드 UI)**: [http://localhost:3000](http://localhost:3000)
- **백엔드 API 서버**: [http://localhost:8000](http://localhost:8000)
- **백엔드 Swagger API 문서**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 개발 원칙 및 확장 가이드

1. **Feature 기반 구조 및 독립 위젯**:
   - `frontend/src/components/widgets/` 경로 아래에 각 위젯이 독립된 컴포넌트로 분리되어 있습니다.
   - 새로운 위젯을 설계할 때 대시보드 구조(`page.tsx`)의 코드 수정을 최소화하도록 확장 설계되어 있습니다.
2. **Provider Pattern**:
   - AI 기능의 경우, OpenRouter 연동을 위한 Provider Layer가 구축되어 있어 Claude, GPT, Gemini 등의 모델을 손쉽게 스위칭할 수 있습니다.
3. **Repository Pattern (백엔드)**:
   - 데이터베이스 접근 로직과 비즈니스 로직을 분리하여 데이터 소스(Mock, PostgreSQL, 외부 API 등) 변경에 유연하게 대처합니다.
