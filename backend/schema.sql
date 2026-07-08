-- 1. 일정 관리 테이블 (todos)
-- 사용자의 개인 할 일 및 캘린더 일정을 관리하는 테이블입니다.
CREATE TABLE IF NOT EXISTS todos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,                                              -- 할 일 제목 (필수)
    description TEXT,                                                         -- 상세 내용 (선택)
    location VARCHAR(255),                                                    -- 위치 정보 (선택)
    completed BOOLEAN DEFAULT FALSE NOT NULL,                                 -- 완료 상태 여부 (기본값: False)
    due_date VARCHAR(50),                                                     -- 기한 (선택, 예: "2026-07-02", "오늘")
    recurrence VARCHAR(50) DEFAULT '없음' NOT NULL,                           -- 반복 주기 옵션 (기본값: '없음')
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL    -- 생성 시각
);

-- 2. 빠른 메모 테이블 (memos)
-- 사용자의 아이디어 및 지식 노트를 관리하는 테이블입니다.
CREATE TABLE IF NOT EXISTS memos (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,                                                    -- 메모 본문 (필수, 마크다운 지원 가능)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL    -- 생성 시각
);

-- 3. 사용자 관심 주식 종목 테이블 (user_stocks)
CREATE TABLE IF NOT EXISTS user_stocks (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) UNIQUE NOT NULL,                                       -- 주식 티커 / 종목코드 (예: "005930.KS", "AAPL")
    name VARCHAR(100) NOT NULL,                                               -- 종목명 (예: "삼성전자", "애플")
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL    -- 생성 시각
);
