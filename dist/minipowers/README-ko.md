# minipowers

[English](README.md) | 한국어

코드 변경 한 건을 **설계 → 구현 → 리뷰 → 기록** 네 단계로 진행하는 Claude/Codex 플러그인이다. MCP 서버 없이 skill만 포함한다. 단계 사이를 이어 주는 것은 대화 컨텍스트가 아니라 **spec 파일 하나**다. 그래서 각 단계를 새 세션에서 이어받을 수 있다.

## 워크플로우에서의 자리

```
todo ──▶ /spec-design ──▶ spec.md ──▶ /spec-implement ──▶ 커밋들 + progress.md
                                            ▲                     │
                                            │ 수정 모드            ▼
                                       findings.md ◀──── /spec-review
                                            │
                                            ▼
                                       /spec-digest ──▶ digest.md + index.md
```

승인 뒤 spec을 바꿔야 하면 `/spec-design --amend <작업 폴더>`가 `amendment-<N>.md`를 쓰고, `/spec-implement`부터 다시 이어 간다.

| 스킬 | 호출 | 입력 | 산출물 |
|---|---|---|---|
| spec-design | `/spec-design <todo 파일 또는 문장>` | todo, 코드베이스, 사용자와의 질의응답 | `spec.md`, feature 브랜치, `.worktrees/<stem>`, 첫 커밋 |
| spec-design(개정) | `/spec-design --amend <작업 폴더>` | 유효 spec, progress.md, findings.md, 사용자와의 질의응답 | `amendment-<N>.md`, 그 파일 하나의 커밋 |
| spec-implement | `/spec-implement <작업 폴더>` | 유효 spec, 프로젝트 지시 파일, 소스코드 | 슬라이스별 커밋, `progress.md` |
| spec-review | `/spec-review <작업 폴더>` | 유효 spec, `기준 커밋..HEAD` diff | `findings.md` |
| spec-digest | `/spec-digest <작업 폴더>` | 유효 spec, progress.md, findings.md, 소스코드 | `digest.md`, `docs/minipowers/index.md` |

- spec-design은 사용자와 대화하며 결정을 받는다. 나머지 셋은 설계에 관한 질문을 하지 않고, 멈추는 경우는 [정지 조건 넷](skills/_shared/conventions.md#정지-조건)뿐이다.
- 네 스킬은 `/`로만 실행된다. frontmatter의 `disable-model-invocation: true` 때문에 "리뷰해줘" 같은 자연어로는 시작되지 않는다. `/spec`까지 입력하면 각 스킬의 `argument-hint`가 인자 형식을 보여 준다.
- spec-review는 사용자가 모델과 effort를 선택한 새 독립 세션에서 실행한다. 구현 때와 다른 LLM을 써도 된다. context 0은 이전 대화 이력·요약·메모리를 전달하지 않는다는 뜻이며, 리뷰는 저장된 spec·amendment·progress·findings, 프로젝트 지시 파일, 코드베이스와 git diff, 직접 실행한 테스트 결과에 의존한다. 최초 리뷰와 재리뷰 모두 이 방식으로 진행하며 subagent로 자동 위임하지 않는다. 추가 리뷰 기준은 승인된 spec 또는 amendment에 기록한다.
- 네 스킬 모두 병합, push, PR 생성을 하지 않는다. `ready to merge` 판정 뒤의 일은 프로젝트의 git 규칙대로 사용자가 한다.

## 산출물 위치

```
docs/minipowers/
├── index.md
├── todo/<이름>.md
└── <yyyy-mm-dd-##-subject>/
    ├── spec.md
    ├── amendment-<N>.md
    ├── progress.md
    ├── findings.md
    └── digest.md
```

작업 하나가 폴더 하나다. 네 스킬의 인자는 이 폴더 경로다. 승인된 spec.md는 고치지 않는다. 개정은 `/spec-design --amend <작업 폴더>`가 같은 폴더에 `amendment-<N>.md`(N은 1부터)로 쓰고, 나머지 스킬은 spec.md에 amendment를 번호 순서로 겹친 "유효 spec"을 읽는다. 일회용 중간물은 `.minipowers/`, 격리 작업 공간은 `.worktrees/`에 두고, 둘 다 `.gitignore`에 들어간다. 자세한 규칙은 [skills/_shared/conventions.md](skills/_shared/conventions.md)에 있다.

## 기록되는 것

- TDD 증거: progress.md에 슬라이스마다 `RED` 줄(구현 전 실패한 테스트) 또는 `RED 없음` 줄이 남는다. spec-review는 이 줄이 없는 슬라이스를 지적한다.
- 기준 테스트: 첫 슬라이스 전에 전체 테스트를 한 번 돌려 progress.md 머리말에 적는다. 기준 커밋에서 이미 실패하던 테스트는 spec-review가 이번 변경의 지적으로 올리지 않는다.
- 반박: spec-implement는 틀렸다고 판단한 리뷰 지적을 고치지 않고 근거와 함께 반박할 수 있다. 재리뷰가 코드로 확인해 WITHDRAWN 또는 NOT ADDRESSED로 판정한다.
- 슬라이스 모델: spec의 슬라이스에 `- 모델: <sonnet | opus | fable>`을 적으면 병렬 구현 때 그 모델로 subagent를 띄운다.

## 작업 폴더 흐름

메인 체크아웃은 기반 브랜치(예: `dev`)에 그대로 남는다. 작업은 feature 브랜치를 checkout한 두 번째 작업 폴더 `.worktrees/<stem>`에서 한다(`git worktree`).

1. `/spec-design`은 승인 뒤 feature 브랜치와 `.worktrees/<stem>`을 만들고, 그 안에서 spec.md를 첫 커밋으로 넣는다. 메인 체크아웃의 브랜치는 바꾸지 않는다.
2. `/spec-implement`, `/spec-review`, `/spec-digest`는 메인 체크아웃에서 불러도 `.worktrees/<stem>`을 찾아 그 안에서 읽고 커밋한다. 구현 결과는 IDE에서 `.worktrees/<stem>` 폴더를 열어 본다.
   - `.worktrees/<stem>`이 없으면 `/spec-implement`가 spec.md를 가진 로컬 브랜치를 찾아 worktree를 다시 만든다. `/spec-review`와 `/spec-digest`는 worktree를 만들지 않고, 찾은 브랜치 이름과 함께 `/spec-implement`를 먼저 부르라고 안내한다.
3. 새 worktree에는 gitignore된 파일(의존성, `.env` 같은 로컬 설정)이 없다. `/spec-implement`는 구현을 시작하기 전에 worktree를 준비한다. 프로젝트 지시 파일(CLAUDE.md 등)에 `minipowers worktree 복사: .env, src/appsettings.Development.json`처럼 적은 파일을 메인 체크아웃에서 복사하고, 의존성 설치 명령을 돌린다. 목록에 없는 파일 때문에 테스트가 실패하면 기존 실패로 넘기지 않고 멈춘다.
4. 병합은 프로젝트의 git 규칙대로 사용자가 한다.

병합 뒤에는 메인 체크아웃 루트에서 정리한다. 스킬은 안내만 하고 지우지 않는다.

```bash
git worktree remove .worktrees/<stem>
git branch -d <브랜치>
rm -rf .minipowers/<stem>/
```

## superpowers와 함께 켜지 않는다

superpowers 플러그인과 minipowers를 한 프로젝트에서 함께 켜지 않는다.

- superpowers의 SessionStart hook은 세션 시작, clear, compact 때마다 `using-superpowers`를 주입한다.
- 그 결과 brainstorming, test-driven-development 같은 superpowers 스킬이 minipowers 절차 중간에 끼어든다.
- minipowers의 `disable-model-invocation`은 minipowers 스킬이 자동 호출되는 것만 막는다. superpowers 스킬이 끼어드는 것은 막지 못한다.

minipowers를 쓰는 프로젝트에서는 superpowers 플러그인을 끈다.

## 설치와 요구사항

- Claude/Codex 마켓플레이스 `pyan-minipowers`에서 `minipowers`를 설치한다. Claude Code에서는 `/plugin install minipowers@pyan-minipowers`, Codex 터미널에서는 `codex plugin add minipowers@pyan-minipowers`를 사용한다. 아래 워크플로우 예시는 Claude의 `/` 표기이며, Codex의 호출 접두사는 `$`다.
- spec-implement의 스크립트 세 개(`workspace`, `slice-brief`, `review-package`)는 bash다. Windows에서는 Git Bash가 필요하다.
- spec-review는 로드한 SKILL.md의 디렉터리를 기준으로 공용 규약과 템플릿의 상대경로를 해석한다. 나머지 스킬은 공용 규약을 `${CLAUDE_PLUGIN_ROOT}/skills/_shared/conventions.md`로, 자기 폴더의 템플릿과 스크립트를 `${CLAUDE_SKILL_DIR}/<파일>`로 가리킨다. 두 변수는 Claude Code가 스킬 본문에서 치환한다.
- spec-implement의 병렬 실행은 subagent를 띄우는 도구(Claude Code의 Agent)가 있을 때만 쓴다. 없으면 에이전트 하나가 순서대로 구현한다.

## 출처

`skills/spec-implement/scripts/`의 세 스크립트는 [superpowers](https://github.com/obra/superpowers) 플러그인(MIT, Jesse Vincent)의 스크립트를 경로와 제목 패턴만 바꿔 가져왔다. 각 파일 머리에 출처를 적었고, 원본 라이선스 전문은 [LICENSE-superpowers](skills/spec-implement/scripts/LICENSE-superpowers)에 있다.

minipowers는 superpowers에서 영감을 받았지만 superpowers 프로젝트나 원작자와 관계없는 독립 프로젝트다.
