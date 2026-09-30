# minipowers 공용 규약

minipowers의 네 스킬(spec-design · spec-implement · spec-review · spec-digest)이 공유하는 규칙이다. 각 스킬은 시작할 때 이 문서(`${CLAUDE_PLUGIN_ROOT}/skills/_shared/conventions.md`)를 읽는다. 여기 적힌 것을 각 SKILL.md는 반복하지 않고 가리킨다.

프로젝트 지시 파일(CLAUDE.md, AGENTS.md 등)이 이 규약과 다르게 정한 것이 있으면 지시 파일을 따른다.

## 인자 해석

네 스킬 모두 인자는 **작업 폴더 경로 하나**다. 예: `docs/minipowers/2026-09-27-01-minipowers/`. 경로는 프로젝트 루트("폴더 구조" 절) 기준이다.

- 폴더 안의 `spec.md` 경로를 받으면 그 폴더로 해석한다.
- spec-design만 예외다. 인자는 todo 파일 경로 또는 요구를 적은 문장이고, 작업 폴더는 spec-design이 만든다.
- 인자가 없으면 무엇을 넣어야 하는지 한 줄로 안내하고 끝낸다. 폴더를 추측하지 않는다.
- 승인된 spec은 병합 전까지 feature 브랜치에만 있다. spec-design이 승인 때 메인 체크아웃을 그 브랜치로 전환하므로 대개 현재 체크아웃에 있다. `spec.md`는 다음 순서로 찾는다.
  1. 현재 체크아웃의 프로젝트 루트 아래 `<작업 폴더>/spec.md`
  2. `git worktree list --porcelain`에 나오는 다른 체크아웃마다 `<체크아웃 경로>/<prefix><작업 폴더>/spec.md`. 사용자가 spec 브랜치를 직접 worktree로 checkout해 둔 경우다.
  3. 둘 다 없으면 `<prefix><작업 폴더>/spec.md`를 가진 로컬 브랜치를 찾는다. 사용자가 메인 체크아웃을 기반 브랜치로 되돌려 둔 경우다.
     ```bash
     for b in $(git for-each-ref --format='%(refname:short)' refs/heads); do
       git cat-file -e "$b:<prefix>docs/minipowers/<stem>/spec.md" 2>/dev/null && echo "$b"
     done
     ```
- 찾은 뒤에는 spec 머리말의 `- 브랜치:` 값을 읽고 **작업 위치**를 정한다. 작업 위치는 그 브랜치를 checkout한 체크아웃의 프로젝트 루트다. 이하 파일 읽기, 쓰기, git 명령, 커밋은 모두 거기서 한다.
  - 현재 브랜치(`git rev-parse --abbrev-ref HEAD`)가 spec의 브랜치이면 현재 체크아웃의 프로젝트 루트다.
  - 아니면 `git worktree list --porcelain`에서 `branch refs/heads/<브랜치>` 줄이 붙은 `worktree <경로>`를 찾는다. 있으면 `<경로>/<prefix>`다.
  - 어느 체크아웃에도 없으면 스킬은 브랜치를 전환하지 않고 worktree도 만들지 않는다. 현재 브랜치와 spec의 브랜치를 보고하고 "메인 체크아웃에서 `git switch <브랜치>`로 전환하거나, 나란히 두려면 프로젝트 루트에서 `git worktree add .worktrees/<stem> <브랜치>`로 만든 뒤 다시 실행한다"고 안내하고 끝낸다. spec-digest만 예외다. spec.md를 찾은 곳에서 digest.md와 index.md를 쓰고 커밋하지 않는다(spec-digest/SKILL.md 6절).
  - 3에서 찾은 브랜치가 여럿이면 목록을 보고하고 끝낸다.
  - 어느 브랜치에도 없으면 현재 브랜치 이름과 함께 "`/spec-design`을 먼저 실행한다"고 안내하고 끝낸다.

## 스킬 파일 경로

Claude Code는 SKILL.md 본문의 `${CLAUDE_PLUGIN_ROOT}`를 플러그인 설치 루트로, `${CLAUDE_SKILL_DIR}`를 그 SKILL.md가 있는 폴더로 치환한다. 현재 작업 디렉터리와 무관하게 같은 경로가 나온다.

- 이 규약: `${CLAUDE_PLUGIN_ROOT}/skills/_shared/conventions.md`
- 각 스킬의 템플릿, 프롬프트, 스크립트: `${CLAUDE_SKILL_DIR}/<파일>`

## 폴더 구조

### 프로젝트 루트와 저장소 루트

두 루트를 구분한다. 한 저장소에 프로젝트가 여럿 있을 수 있기 때문이다(예: `tools/baw-pos-deployment`와 `tools/DTOGenerator`가 한 저장소에 있다).

- **저장소 루트**: `.git`이 있는 곳.
- **프로젝트 루트**: 세션을 연 작업 디렉터리. 저장소 루트와 같거나 그 아래 폴더다. 이 규약의 `docs/minipowers/`, `.minipowers/`, `.worktrees/`, `.gitignore`는 모두 프로젝트 루트 기준이다. 스킬은 프로젝트 루트에서 명령을 실행한다.
- **`<prefix>`**: 저장소 루트에서 프로젝트 루트까지의 상대경로. 프로젝트 루트에서 실행한 아래 명령의 출력이고, 비어 있지 않으면 끝에 `/`가 붙는다(예: `baw-pos-deployment/`). 저장소 루트가 프로젝트 루트이면 빈 문자열이다.
  ```bash
  git rev-parse --show-prefix
  ```
  `git show <브랜치>:<경로>`, `git cat-file`, `git ls-tree --full-tree`, `git sparse-checkout set`처럼 저장소 루트 기준 경로를 받는 명령에는 `<prefix>`를 붙인다. 프로젝트 루트에서 실행하는 `git add <경로>`, `git diff -- <경로>`는 현재 디렉터리 기준이므로 붙이지 않는다.
- **메인 체크아웃**: `git worktree list --porcelain` 첫 줄 `worktree <경로>`. 다른 체크아웃(worktree) 안의 프로젝트 루트는 `<체크아웃 경로>/<prefix>`다. worktree 안에서 실행한 `git rev-parse --show-toplevel`은 그 worktree의 루트를 돌려준다.

```
<프로젝트 루트>/
├── docs/minipowers/
│   ├── index.md                      spec-digest가 매번 다시 생성하는 누적 목록
│   ├── todo/<이름>.md                사용자가 쓰는 todo. 형식은 자유. spec-design의 입력
│   └── <stem>/                       작업 하나 = 폴더 하나
│       ├── spec.md                   spec-design이 쓴다. 승인 뒤에는 고치지 않는다. 개정은 amendment로 한다
│       ├── amendment-<N>.md          spec-design이 `--amend`로 쓴다. N은 1부터 차례로
│       ├── progress.md               spec-implement가 쓴다
│       ├── findings.md               spec-review가 쓴다. spec-implement 수정 모드가 읽는다
│       └── digest.md                 spec-digest가 쓴다
├── .minipowers/<stem>/work/          subagent에게 넘기는 brief · report · diff 패키지. 일회용
└── .worktrees/<stem>-slice-N/        spec-implement가 슬라이스를 나란히 구현할 때만 만드는 격리 작업 공간
```

`docs/minipowers/`가 없으면 spec-design이 만든다. `.minipowers/`와 `.worktrees/`는 작업 위치("인자 해석")의 프로젝트 루트에 둔다. subagent에게는 절대경로로 넘긴다.

### 브랜치와 체크아웃

- spec-design은 승인 뒤 메인 체크아웃을 기반 브랜치에서 feature 브랜치로 전환(`git switch -c`)하고 spec.md를 첫 커밋으로 넣는다. 그래서 spec 브랜치는 대개 메인 체크아웃에 checkout되어 있고, spec, progress, findings, 코드 변경이 IDE와 CLI에 그대로 보인다.
- spec-implement · spec-review · spec-digest는 브랜치를 전환하지 않는다. 작업 위치는 "인자 해석"이 정한다.
- worktree는 spec-implement의 orchestrator 방식이 슬라이스를 나란히 구현할 때만 만든다. 경로는 `<프로젝트 루트>/.worktrees/<stem>-slice-N`이고, 병합이 끝나면 지운다. `<prefix>`가 비어 있지 않으면 sparse-checkout으로 프로젝트 루트만 받는다("worktree 준비").
- 병합은 사용자가 한다. 메인 체크아웃이 spec 브랜치에 있으면 `git switch <기반 브랜치>`로 돌아간 뒤 병합한다.

`index.md`는 spec-digest가 브랜치마다 전체를 다시 생성하므로, 작업 둘이 나란히 진행되면 병합 때 충돌할 수 있다. 충돌하면 병합 뒤 `/spec-digest`를 다시 불러 재생성한다.

| 파일 | 쓰는 스킬 | 읽는 스킬 |
|---|---|---|
| `spec.md` | spec-design | spec-implement · spec-review · spec-digest |
| `amendment-<N>.md` | spec-design(`--amend`) | spec-implement · spec-review · spec-digest |
| `progress.md` | spec-implement | spec-review · spec-digest |
| `findings.md` | spec-review | spec-implement(수정 모드) · spec-digest |
| `digest.md`, `index.md` | spec-digest | 사람 |

각 파일의 절 제목과 줄 형식은 그 파일을 쓰는 스킬의 템플릿이 정한다. 읽는 스킬은 그 템플릿의 제목 문자열을 그대로 찾는다.

## 유효 spec

spec.md 하나만 있으면 그것이 유효 spec이다. `amendment-<N>.md`가 있으면 spec.md를 읽고 amendment-1.md, amendment-2.md, …를 번호(숫자) 순서로 겹친 결과가 유효 spec이다. spec-implement · spec-review · spec-digest는 spec을 읽는 곳마다 이 절차로 유효 spec을 만들어 쓴다.

겹치는 규칙은 다음 넷이다.

- amendment의 `##` 절(`## 개정 이유` 제외)은 spec.md와 앞 amendment의 같은 제목 절 전체를 대체한다.
- `## 구현 슬라이스`만 예외다. 절 전체가 아니라 `### 슬라이스 N:` 블록 단위로 같은 N을 대체하거나 새 N을 추가한다.
- 머리말(작성일, 기준 커밋, 브랜치, 원 요구, 전체 테스트 명령)은 개정하지 않는다. spec.md의 머리말 그대로 쓴다.
- 뒤 번호가 이긴다. 코드 펜스 안의 제목은 제목으로 치지 않는다.

## stem 규칙

`<stem>`은 `yyyy-mm-dd-##-subject`다.

- `yyyy-mm-dd`는 spec을 쓴 날이다. 날짜는 기억으로 쓰지 않고 실행해서 얻는다.
  ```bash
  date +%F
  ```
  ```powershell
  (Get-Date).ToString('yyyy-MM-dd')
  ```
- `##`는 그날의 2자리 일련번호다. 같은 날짜로 시작하는 폴더를 아래 세 곳에서 모두 찾아 가장 큰 번호에 1을 더한다. 그날 첫 폴더면 `01`이다. 병합 전 spec은 feature 브랜치에만 있고 그 브랜치가 어디에도 checkout되어 있지 않을 수 있으므로 브랜치도 본다.
  - 현재 체크아웃의 `docs/minipowers/`. 커밋하지 않은 초안 폴더도 포함한다.
  - `git worktree list --porcelain`의 다른 체크아웃마다 `<체크아웃 경로>/<prefix>docs/minipowers/`
  - 모든 로컬 브랜치
    ```bash
    for b in $(git for-each-ref --format='%(refname:short)' refs/heads); do
      git ls-tree --full-tree --name-only "$b" "<prefix>docs/minipowers/" 2>/dev/null
    done | sed 's#.*/##' | sort -u
    ```
- `subject`는 소문자와 하이픈으로 된 짧은 주제어다.

feature 브랜치 이름은 프로젝트 지시 파일의 규칙을 따른다. 규칙이 없으면 stem을 그대로 쓴다.

## 정지 조건

spec-implement · spec-review · spec-digest는 진행 중에 설계에 관한 질문을 하지 않는다. 모호한 것은 spec을 기준으로 스스로 판정하고 `progress.md`에 `Ruling:` 줄로 남긴다.

멈추고 사용자에게 묻는 경우는 다음 넷뿐이다.

1. 되돌릴 수 없거나 파괴적인 조작을 해야 할 때
2. 보안에 민감한 조작을 해야 할 때. worktree에 없는 설정 파일이나 비밀 값이 필요할 때도 여기 해당한다("worktree 준비" 절)
3. 작업 위치 밖으로 나가는 부작용이 생길 때. 병합, 공유 브랜치로 push, 배포가 여기 해당한다
4. spec이 틀려서 어느 방향으로 가도 추측일 때. 이 경우 spec 결함을 보고하고 끝낸다. 고치는 일은 spec-design의 몫이다

네 스킬 모두 병합 · push · Pull Request 생성을 하지 않는다. 마무리 보고의 마지막 줄에 사용자가 할 다음 단계 하나를 적는다.

## gitignore 처리

`.minipowers/` 또는 `.worktrees/`를 처음 만드는 스킬은 **프로젝트 루트**의 `.gitignore`를 확인한다. 저장소 루트의 `.gitignore`는 보지 않는다. 하위 폴더의 `.gitignore`는 그 폴더 아래에만 적용되므로 프로젝트 루트에 두는 것이 맞다.

- 해당 줄(`.minipowers/`, `.worktrees/`)이 없으면 파일 끝에 줄바꿈을 확인한 뒤 추가한다.
- 있으면 건드리지 않는다.
- `.gitignore`가 없으면 두 줄로 새로 만든다.

## worktree 준비

새로 만든 worktree에는 gitignore된 파일이 없다. 의존성 폴더, 로컬 설정 파일, 비밀 값이 여기 든다. 다음 세 단계를 합쳐 "준비"라고 부르고, 준비를 하는 때는 spec-implement/SKILL.md "준비와 기준 테스트"와 orchestrator.md가 정한다. 작업 위치가 메인 체크아웃이면 0과 1을 건너뛴다. worktree를 만든 것이 아니고, 복사할 원본과 대상이 같은 폴더이기 때문이다.

0. **sparse-checkout.** `<prefix>`가 비어 있지 않을 때만 한다. worktree를 `--no-checkout`으로 만들고 프로젝트 루트만 받는다. 저장소의 다른 프로젝트가 worktree마다 복사되지 않게 하기 위해서다. 프로젝트 지시 파일에 `minipowers worktree 포함:`으로 시작하는 줄이 있으면, 그 뒤에 쉼표로 나열한 경로(저장소 루트 기준)를 `<prefix>`와 함께 받는다. 프로젝트가 저장소의 형제 폴더에 의존할 때 쓴다. 예: `minipowers worktree 포함: DTOGenerator, shared/protos`
   ```bash
   git worktree add --no-checkout -b <브랜치> <worktree 경로> <시작점>
   git -C <worktree 경로> sparse-checkout set <prefix> [포함 경로...]
   git -C <worktree 경로> checkout <브랜치>
   ```
   `<prefix>`가 비어 있으면 이 단계를 건너뛰고 `git worktree add -b <브랜치> <worktree 경로> <시작점>`으로 만든다. 어느 쪽이든 worktree 안의 프로젝트 루트는 `<worktree 경로>/<prefix>`다. 아래 1, 2와 subagent에게 넘기는 작업 위치는 이 폴더다.
1. **파일 복사.** 프로젝트 지시 파일에 `minipowers worktree 복사:`로 시작하는 줄이 있으면, 그 뒤에 쉼표로 나열한 경로(프로젝트 루트 기준)를 작업 위치의 프로젝트 루트에서 worktree의 프로젝트 루트로 복사한다.
   - 목록에 있는 파일만 복사한다. 목록은 사용자가 미리 허락한 것이므로 정지 조건 2에 해당하지 않는다. 목록 밖의 gitignore된 파일은 복사하지 않는다.
   - worktree에 같은 경로의 파일이 이미 있으면 덮어쓰지 않는다.
   - 원본에 없는 경로는 건너뛰고, 건너뛴 경로를 마무리 보고의 수동 확인 항목에 적는다.
   - 예: `minipowers worktree 복사: .env, src/backend/appsettings.Development.json`
2. **준비 명령.** 프로젝트 지시 파일에 준비 명령(의존성 설치 등)이 있으면 그것을, 없으면 프로젝트의 lock 파일로 정해지는 표준 설치 명령(`pnpm install`, `npm ci`, `dotnet restore` 등)을 worktree의 프로젝트 루트에서 한 번 돌린다. 해당하는 것이 없으면 건너뛴다.

준비 뒤에 테스트가 worktree에 없는 파일 때문에 실패하면 그 실패를 기존 실패로 넘기지 않는다. 목록에 없는 설정 파일, 연결 문자열, 인증서가 여기 해당한다. 그대로 두면 그 테스트가 기준 테스트부터 리뷰까지 전부 제외되어 아무것도 검증되지 않기 때문이다. 정지 조건 2로 멈추고, 빠진 것으로 보이는 파일과 함께 "프로젝트 지시 파일에 `minipowers worktree 복사:` 줄을 추가하거나 파일을 직접 worktree에 복사한 뒤 다시 실행한다"고 보고한다.

## 문체 규칙

네 스킬이 쓰는 문서(spec.md · progress.md · findings.md · digest.md)에 적용한다.

- 독자는 그 작업을 지켜보지 않은 개발자다. 대화에서만 통하는 표현을 쓰지 않는다.
- 문장이 길어져도 풀어 쓴다. 항목이 셋 이상이면 한 줄에 `·`로 잇지 않고 줄을 나눈다.
- 템플릿의 절과 하위 항목을 지우거나 비우지 않는다. 해당 사항이 없으면 "없음"이라고 쓴다.
- 코드의 위치는 `파일:줄`로 가리킨다.
- 현행 동작의 정본은 소스코드다. spec · progress · findings · digest는 작성 시점의 기록이다. 문서와 소스가 다르면 소스가 맞다.
- 한글로 쓴다. 코드 식별자와 명령은 원문 그대로 둔다.

## 증거 규칙

"테스트가 통과한다", "빌드가 된다", "끝났다"는 **지금 이 메시지에서 돌린 명령의 출력**과 함께 쓴다. 이전에 돌린 결과나 "통과할 것이다"는 증거가 아니다.

| 주장 | 필요한 증거 |
|---|---|
| 테스트가 통과한다 | 지금 돌린 테스트 명령의 출력. 실패 0 |
| 빌드가 된다 | 빌드 명령의 종료 코드 0 |
| 테스트가 동작을 검증한다 | 구현 전 실패 출력(RED)과 구현 후 통과 출력(GREEN) |
| subagent가 작업을 끝냈다 | `git diff`로 변경 내용을 직접 확인한 결과 |
| 수용 기준을 충족했다 | 기준을 한 줄씩 대조한 결과 |
