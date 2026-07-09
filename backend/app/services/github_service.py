import httpx
import logging
from typing import List
from app.core.config import settings
from app.schemas.api_schemas import GitHubEventItem

logger = logging.getLogger(__name__)

class GitHubService:
    """
    GitHub REST API를 호출하여 최근 사용자의 개발 활동(커밋, PR 등)을 수집하는 서비스
    """
    def __init__(self):
        self.token = settings.GITHUB_TOKEN

    def get_recent_events(self) -> List[GitHubEventItem]:
        # GITHUB_TOKEN이 감지되지 않거나 기본값일 경우 Fallback 데모 응답을 제공합니다.
        if not self.token or self.token == "mock_github_token":
            logger.warning("GitHubService: 깃허브 토큰이 감지되지 않아 데모용 이벤트를 리턴합니다.")
            return [
                GitHubEventItem(
                    type="PushEvent",
                    repo="Jihee-Baek/personal-ai-os",
                    message="feat: 백엔드 로깅 시스템 완벽 탑재 및 배포",
                    created_at="2026-07-09T14:30:00Z"
                ),
                GitHubEventItem(
                    type="PullRequestEvent",
                    repo="Jihee-Baek/personal-ai-os",
                    message="opened: Step 3 외부 날씨 및 주식 연동 머지 요청",
                    created_at="2026-07-09T11:15:00Z"
                )
            ]

        headers = {
            "Authorization": f"Bearer {self.token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "Personal-AI-OS-App"
        }

        try:
            with httpx.Client(timeout=15.0) as client:
                # 1단계: 토큰 소유자 조회하여 유저명(login) 획득
                logger.info("GitHubService: API 토큰 소유자 조회 시도")
                user_res = client.get("https://api.github.com/user", headers=headers)
                if user_res.status_code != 200:
                    logger.error("GitHubService: 사용자 조회 실패 - 코드: %d, 에러: %s", 
                                 user_res.status_code, user_res.text)
                    return []
                
                username = user_res.json().get("login")
                if not username:
                    logger.error("GitHubService: 사용자 계정명을 파싱하지 못했습니다.")
                    return []
                
                # 2단계: 해당 사용자의 최근 활동 이벤트 수집 (최근 5개 슬라이싱)
                logger.info("GitHubService: 사용자 '%s'의 최근 깃 활동 이벤트 조회", username)
                events_res = client.get(f"https://api.github.com/users/{username}/events", headers=headers)
                
                if events_res.status_code == 200:
                    events = events_res.json()
                    result_items: List[GitHubEventItem] = []
                    
                    for ev in events[:5]: # 최대 5개 이력만 정제
                        ev_type = ev.get("type", "Event")
                        repo_name = ev.get("repo", {}).get("name", "Unknown")
                        created_time = ev.get("created_at", "")
                        payload = ev.get("payload", {})
                        
                        # 이벤트 성격별 표시용 요약 메시지 구성
                        msg = "활동 이력이 기록되었습니다."
                        if ev_type == "PushEvent":
                            commits = payload.get("commits", [])
                            if commits:
                                msg = f"commit: {commits[0].get('message', 'Push 완료')}"
                        elif ev_type == "PullRequestEvent":
                            action = payload.get("action", "updated")
                            pr_title = payload.get("pull_request", {}).get("title", "")
                            msg = f"{action} PR: {pr_title}"
                        elif ev_type == "IssuesEvent":
                            action = payload.get("action", "updated")
                            issue_title = payload.get("issue", {}).get("title", "")
                            msg = f"{action} issue: {issue_title}"
                        elif ev_type == "CreateEvent":
                            ref_type = payload.get("ref_type", "repository")
                            msg = f"created {ref_type}: {payload.get('ref', '') or repo_name}"
                            
                        result_items.append(GitHubEventItem(
                            type=ev_type,
                            repo=repo_name,
                            message=msg,
                            created_at=created_time
                        ))
                    
                    logger.info("GitHubService: 깃허브 최근 이벤트 %d개 수집 완료", len(result_items))
                    return result_items
                else:
                    logger.error("GitHubService: 이벤트 조회 실패 - 코드: %d", events_res.status_code)
                    
        except httpx.RequestError as exc:
            logger.error("GitHubService: 깃허브 API 통신 네트워크 오류: %s", str(exc))
        except Exception as e:
            logger.error("GitHubService: 깃허브 파싱 도중 알 수 없는 예외 발생: %s", str(e))
            
        return []
