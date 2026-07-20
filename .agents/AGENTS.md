# Antigravity AI OS 개발 규칙 (Project Rules)

## 🚨 1. 데이터베이스 및 SQL 동기화 규칙 (의무)

1. **SQL 및 데이터베이스 스키마 변경 시 `schema.sql` 동기화 필수**
   - DB 스키마(SQLAlchemy 모델, 테이블 칼럼 추가/수정/삭제 등)가 변경되면 **반드시 [`doc/schema.sql`](file:///Users/miguel/personal-ai-os/doc/schema.sql) 및 [`backend/schema.sql`](file:///Users/miguel/personal-ai-os/backend/schema.sql) 파일에 동일하게 스키마 변경사항을 맞춰서 반영**하십시오.

2. **운영계 DB 하위 호환 및 자동 마이그레이션(Auto-Migration) 구문 탑재**
   - 기존 운영계 DB 테이블에 신규 칼럼 추가 시 백엔드 구동 시점에 `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...` 구문을 자동으로 실행하도록 세이프티 가드를 배치하여 운영계 SQL 조회 에러를 근본적으로 차단하십시오.

---

## 🚨 2. Git 커밋 메시지 작성 규칙 (의무)

1. **코드 및 파일 변경 시 의미 있는 Git 커밋 메시지 작성 필수**
   - 소스코드, DB 스키마, 문서 등의 변경 작업이 완료되면 **변경 목적과 주요 수정 내역을 기입한 Git 커밋 메시지(git commit message)를 반드시 작성/제시**하십시오.
   - 예시: `feat: [기능명]`, `fix: [수정명]`, `docs: [문서명]`

---

## 🚨 3. 외부 API 연동 및 백엔드 수정 시 사전 검증 규칙

1. **외부 API 및 라우터 수정 시 로컬 사전 호출 검증 의무화**
   - 백엔드의 외부 API(예: Yahoo Finance, OpenWeatherMap, Finnhub, OpenRouter 등) 연동부를 수정하거나 신규 API 엔드포인트를 추가할 때, 변경사항을 커밋 및 푸시하기 전에 **반드시 로컬 환경에서 직접 API를 호출하여 상태코드(200 OK)와 데이터 포맷을 검증**하십시오.
   - 로컬 테스트는 Python REPL 실행, `curl` 명령어 호출, 또는 별도의 간단한 테스트 스크립트를 작성하여 수행합니다.

2. **이중 인코딩 및 파라미터 규격 실수 방지**
   - HTTP 통신 모듈(`httpx` 등)을 사용할 때 한글/특수문자가 들어간 쿼리 스트링은 라이브러리의 자동 인코딩 기능(`params` 인자)을 사용하여 이중 인코딩(Double Encoding) 오류가 발생하지 않도록 주의하십시오.
   - 외부 API가 권장하는 필수/선택 파라미터 규격을 사전에 꼼꼼히 확인하고 호출을 시도하십시오.
