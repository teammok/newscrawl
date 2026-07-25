<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 배포 매뉴얼 (Next.js + Vercel + Vercel Blob)

이 프로젝트, 그리고 같은 스택(Next.js + Vercel + 크롤링/외부 API)을 쓰는 다음 프로젝트에서도
그대로 따라 하면 되는 체크리스트입니다. 2026-07-25에 첫 배포하면서 겪은 시행착오를 반영했습니다.

## 0. 어디서 실행하는지부터 확인

- **로컬 Claude Code(터미널 `claude` 명령 또는 데스크톱 앱)**: 사용자 컴퓨터의 일반 인터넷과
  이미 로그인된 `vercel`/`gh` CLI를 그대로 씁니다. 외부 API 크롤링, Vercel 배포처럼
  네트워크가 필요한 작업은 **여기서 해야** 막힘 없이 진행됩니다.
- **Claude Code on the web(원격 샌드박스) 세션**: 조직 네트워크 정책에 따라 아웃바운드가
  화이트리스트 방식으로 제한될 수 있습니다. 이 프로젝트를 만들 때는 `search.naver.com`,
  `openapi.naver.com`, `api.vercel.com`이 모두 막혀 있었습니다. 코드 작성/커밋/푸시는
  원격에서도 되지만, **실제 크롤링 검증과 Vercel 배포는 로컬 Claude Code로 넘어가서
  진행하세요.**

## 1. 로컬 환경 준비

```bash
git clone https://github.com/teammok/newscrawl.git   # 또는 fetch + checkout
cd newscrawl
npm install
cp .env.example .env.local
```

`.env.local`에 실제 값 입력:
- `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` — 네이버 개발자센터에서 "데이터랩(검색어트렌드)"
  API 사용 설정 후 발급
- `CRON_SECRET` — 아무 랜덤 문자열 (배포 후 Vercel에도 동일하게 등록)
- `BLOB_READ_WRITE_TOKEN` — 로컬에서는 비워둬도 됨 (파일로 자동 폴백)

```bash
npm run dev
```
`http://localhost:3000`에서 트렌드 그래프·뉴스 크롤링이 실제 데이터로 뜨는지 확인.
(뉴스 섹션은 `/api/refresh`를 눌러야 최초 크롤링이 실행됩니다 — 저장된 데이터가 없으면
"아직 갱신된 데이터가 없습니다" 상태가 정상입니다.)

## 2. Vercel 인증 (헤드리스/비대화형 권장)

대화형 `vercel login`(이메일/브라우저 인증)보다, 토큰 방식이 자동화 세션에서 더 안정적입니다.

1. https://vercel.com/account/tokens 에서 토큰 발급
2. `vercel --token=<토큰> whoami` 로 인증 확인
3. 이후 모든 `vercel` 명령에 `--token=<토큰>` 붙이거나, `VERCEL_TOKEN` 환경변수로 설정

## 3. 프로젝트 연결 + 환경변수

```bash
vercel link --token=<토큰>          # 처음 한 번, teammok/newscrawl 프로젝트로 연결
vercel env add NAVER_CLIENT_ID production --token=<토큰>
vercel env add NAVER_CLIENT_SECRET production --token=<토큰>
vercel env add CRON_SECRET production --token=<토큰>
```

## 4. Vercel Blob 스토어 생성 (뉴스 크롤링 저장용)

Vercel 서버리스 환경은 파일시스템이 읽기 전용이라, 로컬처럼 `data/*.json` 파일로
저장하는 폴백이 배포 환경에서는 동작하지 않습니다. **Blob 스토어 없이 배포하면
크론/새로고침이 파일 쓰기 시도 중 에러를 냅니다.**

```bash
vercel blob create-store --token=<토큰>     # 스토어 생성 + 프로젝트 자동 연결
```
이 명령이 `BLOB_READ_WRITE_TOKEN`을 프로젝트 환경변수에 자동으로 추가해줍니다.
(CLI로 안 되면 Vercel 대시보드 → Storage → Create Database → Blob 에서 수동으로.)

## 5. 배포

```bash
vercel deploy --prod --token=<토큰>
```

## 6. 배포 후 확인

- 배포된 URL 접속 → 3개 섹션 다 뜨는지, "전체 업데이트" 버튼 동작하는지 확인
- Vercel 대시보드 → Settings → Cron Jobs 에서 `/api/cron/refresh`가 매일 08:00(KST)로
  등록됐는지 확인 (`vercel.json`에 정의됨)
- Storage 탭에서 Blob 스토어가 프로젝트에 연결되어 있는지 확인

## 참고: 이번에 겪은 잡음

- `SessionStart`/`UserPromptSubmit` 훅에서 "Bun not found" 에러가 반복 출력됐지만
  non-blocking이라 진행 자체는 막지 않았음 (원인 파악 안 됨, 필요하면 https://bun.sh 설치로
  해결 가능하지만 이 프로젝트엔 Bun이 필요 없음 — 무시해도 무방).
- 첫 시도에서 IME(한글 입력기) 조합 중 메시지가 잘못 전송돼 세션이 꼬였음 → `restart`로
  복구. 메시지 붙여넣은 후 입력창에 제대로 들어갔는지 확인하고 엔터.
