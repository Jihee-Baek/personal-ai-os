# 📌 Personal AI OS 개발 규칙 및 지침 (Project Rules)

## 1. 🗄️ 데이터베이스 및 SQL 동기화 규칙 (필수 준수)
1. **SQL 및 스키마 변경 시 `schema.sql` 동기화 의무화**
   - 데이터베이스 스키마(SQLAlchemy 모델 객체, 테이블 컬럼 추가/수정/삭제 등)가 변경되면 **반드시 [`doc/schema.sql`](file:///Users/miguel/personal-ai-os/doc/schema.sql) 및 [`backend/schema.sql`](file:///Users/miguel/personal-ai-os/backend/schema.sql) 파일에 즉시 동일하게 반영/업데이트**해야 합니다.
2. **운영계 DB 하위 호환 및 자동 마이그레이션(Auto-Migration) 보장**
   - 기존 운영계 DB에 이미 존재하는 테이블에 신규 칼럼이 추가될 경우, `Base.metadata.create_all()`만으로는 컬럼이 자동 추가되지 않아 `SELECT` 실행 시 `OperationalError` (column does not exist)가 발생할 수 있습니다.
   - 백엔드 구동 시(`app/main.py`) `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...` 형태의 자동 마이그레이션 세이프티 가드를 탑재하여 운영계 장애를 근본 방지해야 합니다.

---

## 2. 📝 Git 커밋 메시지 작성 규칙 (의무)
1. **파일 변경 시 의미 있는 Git 커밋 메시지 작성 필수**
   - 코드, 스키마, 문서 등 파일 변경(추가/수정/삭제)이 수행되면 **변경 목적과 세부 작업 내역을 명확히 명시한 Git 커밋 메시지를 반드시 작성/제안**해야 합니다.
   - 커밋 메시지 컨벤션 예시:
     - `feat: [기능 명칭]` (신규 기능 개발)
     - `fix: [버그/에러 내용]` (버그 및 에러 수정)
     - `docs: [문서 내용]` (문서 및 schema.sql, rules.md 변경)
     - `refactor: [리팩토링]` (코드 구조 개선)

---

## 3. 🚨 외부 API 연동 및 사전 검증 규칙
1. **로컬 사전 호출 검증 의무화**
   - 외부 API(Yahoo Finance, OpenWeatherMap, Finnhub, OpenRouter 등) 연동부를 수정하거나 신규 API 엔드포인트를 추가할 때, 커밋 및 푸시 전에 **반드시 로컬 환경에서 직접 API를 호출하여 상태코드(`HTTP 200 OK`)와 데이터 응답 포맷을 사전 검증**해야 합니다.
2. **이중 인코딩 및 특수문자 파라미터 규격 준수**
   - `httpx`, `requests` 통신 모듈 사용 시 특수문자(`&` 등)나 한글 쿼리 스트링은 라이브러리의 자동 인코딩 기능(`params` 인자)을 사용하여 이중 인코딩(Double Encoding) 오류가 발생하지 않도록 조치해야 합니다.

---

## 4. 💻 빌드 무결성 및 UI 가이드라인
1. **프론트엔드 컴파일 무결성 검증**
   - 주요 기능 구현 후 `npm run build`를 실행하여 TypeScript 타입 오류 및 빌드 컴파일 에러가 없는지 무결성을 검증해야 합니다.
2. **비주얼 캔버스 및 캐릭터 보호 규칙**
   - 창문 크로마키 제어 시 어두운 픽셀 문턱값 마스킹 대신 서브픽셀 알파 가우시안 스무딩을 적용하여 캐릭터의 머리카락, 눈, 세부 인테리어가 투명화되거나 훼손되지 않도록 보호해야 합니다.
