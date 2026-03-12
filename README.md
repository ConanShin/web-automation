# Web Automation

Jira 티켓 웹훅으로부터 AI가 자동 생성한 웹 페이지를 호스팅하는 프로젝트.

**Live:** https://conanshin.github.io/web-automation/

## 개요

[n8n AI Pipeline](https://github.com/ConanShin/n8n-ai-pipeline)과 연동되어 동작합니다.

1. Jira 이슈가 생성되면 n8n 워크플로우가 트리거
2. AI Designer/Coder 에이전트가 React + Tailwind 기반 웹 페이지 생성
3. 생성된 `preview.html`이 이 레포지토리에 자동 푸시
4. GitHub Actions가 빌드 후 GitHub Pages로 배포
5. Slack으로 결과 URL 알림 전송

## 기술 스택

- **Next.js** 15 (App Router, Static Export)
- **React** 18
- **Tailwind CSS** v4
- **GitHub Pages** (GitHub Actions 기반 자동 배포)

## 프로젝트 구조

```
web-automation/
├── .github/workflows/
│   └── deploy.yml              # GitHub Actions: 빌드 → GitHub Pages 배포
├── src/app/
│   ├── layout.tsx              # 공통 레이아웃 (다크 테마 네비게이션)
│   ├── page.tsx                # 대시보드 — 전체 이벤트 목록
│   ├── not-found.tsx           # 404 페이지
│   └── event/
│       └── page.tsx            # 이벤트/버전 뷰어 (iframe 기반 프리뷰)
├── public/
│   ├── registry.json           # 이벤트 메타데이터 (n8n이 자동 업데이트)
│   └── preview/
│       └── {key}/{version}/    # AI 생성 HTML 파일
│           └── index.html
├── next.config.mjs             # Static export + basePath 설정
└── package.json
```

## 페이지 구성

| 경로 | 설명 |
|------|------|
| `/` | 대시보드 — 전체 Jira 이벤트 카드 목록 |
| `/event?key=ISSUE-001` | 특정 이벤트의 버전 히스토리 |
| `/event?key=ISSUE-001&version=2026-03-12_13-01-22` | 특정 버전의 AI 생성 페이지 프리뷰 |

## 데이터 흐름

### registry.json

n8n 파이프라인이 새 버전을 배포할 때마다 자동으로 업데이트됩니다.

```json
{
  "events": [
    {
      "key": "BASEBALL-011",
      "title": "Design a modern baseball player stats dashboard",
      "description": "...",
      "versions": [
        {
          "key": "BASEBALL-011",
          "version": "2026-03-12_13-01-22",
          "title": "...",
          "description": "...",
          "createdAt": "2026-03-12T04:08:13.417Z"
        }
      ],
      "latestVersion": "2026-03-12_13-01-22"
    }
  ],
  "lastUpdated": "2026-03-12T..."
}
```

### 버전 관리

동일 Jira 티켓에 대해 웹훅이 여러 번 발생하면, 타임스탬프 기반(`YYYY-MM-DD_HH-mm-ss`)으로 버전이 누적됩니다. 대시보드에서 각 버전의 히스토리를 확인하고 프리뷰할 수 있습니다.

## 로컬 개발

```bash
npm install
npm run dev
```

http://localhost:3000/web-automation 에서 확인 가능합니다.

> `basePath: "/web-automation"` 설정으로 인해 로컬에서도 `/web-automation` 경로로 접근해야 합니다.

## 배포

`main` 브랜치에 푸시하면 GitHub Actions가 자동으로 빌드 및 배포합니다.

```bash
npm run build   # Static HTML 생성 → ./out/
```

수동 배포가 필요한 경우 GitHub Actions 페이지에서 `workflow_dispatch`로 트리거할 수 있습니다.
