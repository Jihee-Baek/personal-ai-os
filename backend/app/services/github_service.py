import httpx
import logging
from typing import List
from app.core.config import settings
from app.schemas.api_schemas import GitHubEventItem

logger = logging.getLogger(__name__)

class GitHubService:
    """
    GitHub REST API를 호출하여 최근 사용자의 개발 활동(커밋, PR 등)을 수집하는 서비스
    (상세 이벤트 대응 및 커밋 메시지 강제 복구 폴백 탑재)
    """
    def __init__(self):
        self.token = settings.GITHUB_TOKEN

    def get_recent_events(self) -> List[GitHubEventItem]:
        logger.info("GitHubService: 최근 깃허브 활동 로그 수집 요청을 감지했습니다.")
        
        # GITHUB_TOKEN이 감지되지 않거나 기본값일 경우 Fallback 데모 응답을 제공합니다.
        if not self.token or self.token in ["mock_github_token", "mock_token"]:
            logger.info("GitHubService: GITHUB_TOKEN이 감지되지 않았거나 mock 기본값 상태입니다. (데모 데이터 폴백 리턴)")
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

        logger.info("GitHubService: 실제 GITHUB_TOKEN 감지 완료 (길이: %d) - GitHub REST API 조회 개시", len(self.token))
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "Personal-AI-OS-App"
        }

        try:
            with httpx.Client(timeout=15.0) as client:
                # 1단계: 토큰 소유자 조회하여 유저명(login) 획득
                logger.info("GitHubService: 1단계 - API 토큰 소유자 정보 조회 API 전송")
                user_res = client.get("https://api.github.com/user", headers=headers)
                if user_res.status_code != 200:
                    logger.error("GitHubService: 사용자 계정 조회 실패 (코드: %d) - 상세: %s", 
                                 user_res.status_code, user_res.text)
                    return []
                
                username = user_res.json().get("login")
                if not username:
                    logger.error("GitHubService: 사용자 계정명(login) 파싱 실패")
                    return []
                
                logger.info("GitHubService: 토큰 인증 성공 - 소유 계정명: '%s'", username)
                
                # 2단계: 해당 사용자의 최근 활동 이벤트 수집 (최근 5개 슬라이싱)
                logger.info("GitHubService: 2단계 - 사용자 '%s'의 최근 깃 이벤트 리스트 API 전송", username)
                events_res = client.get(f"https://api.github.com/users/{username}/events", headers=headers)
                
                if events_res.status_code == 200:
                    events = events_res.json()
                    result_items: List[GitHubEventItem] = []
                    
                    for ev in events[:5]: # 최대 5개 이력만 정제
                        ev_type = ev.get("type", "Event")
                        repo_name = ev.get("repo", {}).get("name", "Unknown")
                        created_time = ev.get("created_at", "")
                        payload = ev.get("payload", {})
                        
                        # 다양한 이벤트 성격별 표시용 요약 메시지 구성
                        msg = f"활동 이력이 감지되었습니다. ({ev_type})"
                        
                        if ev_type == "PushEvent":
                            commits = payload.get("commits", [])
                            branch_ref = payload.get("ref", "")
                            branch_name = branch_ref.split("/")[-1] if branch_ref else "main"
                            
                            if commits:
                                commit_msg = commits[0].get('message', '').strip()
                                commit_first_line = commit_msg.split('\n')[0] if commit_msg else 'Push 완료'
                                msg = f"commit: {commit_first_line}"
                            else:
                                # 💡 [프리미엄 핵심 보안 폴백] commits 목록이 깃허브 API 필터링에 의해 생략된 경우,
                                # 해당 레포지토리의 Commits List API를 직접 호출해 최신 실제 커밋 메시지를 동적 조회합니다.
                                try:
                                    logger.info("GitHubService: PushEvent 내 commits가 비어있어 최신 커밋 이력을 직접 조회합니다. (레포: %s)", repo_name)
                                    commit_api_url = f"https://api.github.com/repos/{repo_name}/commits"
                                    commits_res = client.get(commit_api_url, headers=headers)
                                    
                                    if commits_res.status_code == 200:
                                        repo_commits = commits_res.json()
                                        if repo_commits:
                                            raw_msg = repo_commits[0].get("commit", {}).get("message", "").strip()
                                            first_line = raw_msg.split('\n')[0] if raw_msg else ""
                                            if first_line:
                                                msg = f"commit: {first_line}"
                                                logger.info("GitHubService: 동적 커밋 조회 성공 -> %s", msg)
                                            else:
                                                msg = f"코드 Push 완료 ({branch_name} 브랜치)"
                                        else:
                                            msg = f"코드 Push 완료 ({branch_name} 브랜치)"
                                    else:
                                        logger.warning("GitHubService: 커밋 이력 직접 조회 실패 (코드: %d) -> 폴백 메시지 반환", commits_res.status_code)
                                        msg = f"코드 Push 완료 ({branch_name} 브랜치)"
                                except Exception as inner_e:
                                    logger.error("GitHubService: 커밋 이력 직접 조회 도중 예외 발생: %s", str(inner_e))
                                    msg = f"코드 Push 완료 ({branch_name} 브랜치)"
                                
                        elif ev_type == "PullRequestEvent":
                            action = payload.get("action", "updated")
                            pr_title = payload.get("pull_request", {}).get("title", "")
                            msg = f"PR {action}: {pr_title}"
                            
                        elif ev_type == "IssuesEvent":
                            action = payload.get("action", "updated")
                            issue_title = payload.get("issue", {}).get("title", "")
                            msg = f"Issue {action}: {issue_title}"
                            
                        elif ev_type == "CreateEvent":
                            ref_type = payload.get("ref_type", "repository")
                            ref_name = payload.get("ref", "")
                            msg = f"생성 완료 - {ref_type}: {ref_name or repo_name}"
                            
                        elif ev_type == "DeleteEvent":
                            ref_type = payload.get("ref_type", "branch")
                            ref_name = payload.get("ref", "")
                            msg = f"삭제 완료 - {ref_type}: {ref_name}"
                            
                        elif ev_type == "WatchEvent":
                            msg = "★ Star 등록 (관심 저장소 지정)"
                            
                        elif ev_type == "ForkEvent":
                            msg = "저장소 Fork 완료 (코드 복제)"
                            
                        elif ev_type == "IssueCommentEvent":
                            comment_body = payload.get("comment", {}).get("body", "")
                            msg = f"이슈 댓글 작성: {comment_body[:20]}..." if len(comment_body) > 20 else f"이슈 댓글 작성: {comment_body}"
                            
                        elif ev_type == "CommitCommentEvent":
                            comment_body = payload.get("comment", {}).get("body", "")
                            msg = f"커밋 댓글 작성: {comment_body[:20]}..." if len(comment_body) > 20 else f"커밋 댓글 작성: {comment_body}"

                        result_items.append(GitHubEventItem(
                            type=ev_type,
                            repo=repo_name,
                            message=msg,
                            created_at=created_time
                        ))
                    
                    logger.info("GitHubService: 깃허브 최근 이벤트 %d개 수집 및 상세 파싱 완료", len(result_items))
                    return result_items
                else:
                    logger.error("GitHubService: 깃허브 이벤트 조회 API 실패 (코드: %d) - 상세: %s", 
                                 events_res.status_code, events_res.text)
                    
        except httpx.RequestError as exc:
            logger.error("GitHubService: GitHub REST API 네트워크 통신 오류: %s", str(exc))
        except Exception as e:
            logger.error("GitHubService: GitHub 데이터 정제 중 알 수 없는 예외 발생: %s", str(e))
            
        return []
