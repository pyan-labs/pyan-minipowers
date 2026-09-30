# minipowers 공용 규약

minipowers의 네 스킬(spec-design · spec-implement · spec-review · spec-digest)이 공유하는 규칙이다. 각 스킬은 시작할 때 이 문서(`${CLAUDE_PLUGIN_ROOT}/skills/_shared/conventions.md`)를 읽는다. 여기 적힌 것을 각 SKILL.md는 반복하지 않고 가리킨다.

프로젝트 지시 파일(CLAUDE.md, AGENTS.md 등)이 이 규약과 다르게 정한 것이 있으면 지시 파일을 따른다.

## 인자 해석

네 스킬 모두 인자는 **작업 폴더 경로 하나**다. 예: `docs/minipowers/2026-09-27-01-minipowers/`.

- 폴더 안의 `spec.md` 경로를 받으면 그 폴더로 해석한다.
- spec-design만 예외다. 인자는 todo 파일 경로 또는 요구를 적은 문장이고, 작업 폴더는 spec-design이 만든다.
- 인자가 없으면 무엇을 넣어야 하는지 한 줄로 안내하고 끝낸다. 폴더를 추측하지 않는다.
- 승인된 spec은 병합 전까지 feature 브랜치에만 있고, 그 브랜치는 대개 `.worktrees/<stem>`에 checkout되어 있다. 메인 체크아웃에는 없는 것이 보통이다. 그래서 `spec.md`는 다음 순서로 찾는다.
  1. 현재 체크아웃의 `<작업 폴더>/spec.md`
  2. `<메인 체크아웃 루트>/.worktrees/<stem>/<작업 폴더>/spec.md`. 메인 체크아웃 루트는 "폴더 구조" 절의 명령으로 얻는다.
- 둘 다 없으면 `<작업 폴더>/spec.md`를 가진 로컬 브랜치를 찾는다. 메인 체크아웃이 기반 브랜치에 있고 `.worktrees/<stem>`이 아직 없거나 지워진 경우다.
  ```bash
  for b in $(git for-each-ref --format='%(refname:short)' refs/heads); do
    git cat-file -e "$b:docs/minipowers/<stem>/spec.md" 2>/dev/null && echo "$b"
  done
  ```
- 찾은 뒤 할 일은 스킬마다 다르다. 어느 경우든 메인 체크아웃의 브랜치를 바꾸라고 안내하지 않는다.
  - spec-implement: 찾은 브랜치가 하나면 그 브랜치로 `.worktrees/<stem>`을 만들어 진행한다(spec-implement/SKILL.md "시작" 3).
  - spec-review, spec-digest: worktree를 만들지 않는다. 현재 브랜치 이름(`git rev-parse --abbrev-ref HEAD`)과 찾은 브랜치 이름을 넣어 "`/spec-implement <작업 폴더>`를 먼저 부르거나, 메인 체크아웃 루트에서 `git worktree add .worktrees/<stem> <찾은 브랜치>`로 만든 뒤 다시 실행한다"고 안내하고 끝낸다.
  - 찾은 브랜치가 여럿이면 목록을 보고하고 끝낸다.
  - 어느 브랜치에도 없으면 현재 브랜치 이름과 함께 "`/spec-design`을 먼저 실행한다"고 안내하고 끝낸다.

## 스킬 파일 경로

Claude Code는 SKILL.md 본문의 `${CLAUDE_PLUGIN_ROOT}`를 플러그인 설치 루트로, `${CLAUDE_SKILL_DIR}`를 그 SKILL.md가 있는 폴더로 치환한다. 현재 작업 디렉터리와 무관하게 같은 경로가 나온다.

- 이 규약: `${CLAUDE_PLUGIN_ROOT}/skills/_shared/conventions.md`
- 각 스킬의 템플릿, 프롬프트, 스크립트: `${CLAUDE_SKILL_DIR}/<파일>`

## 폴더 구조

```
docs/minipowers/
├── index.md                          spec-digest가 매번 다시 생성하는 누적 목록
├── todo/<이름>.md                    사용자가 쓰는 todo. 형식은 자유. spec-design의 입력. spec 결함으로 멈춘 사이클의 todo는 spec-implement가 쓴다("중단 todo" 절)
└── <stem>/                           작업 하나 = 폴더 하나
    ├── spec.md                       spec-design이 쓴다. 승인 뒤에는 고치지 않는다. 바꿀 것이 생기면 새 todo로 새 사이클을 돈다
    ├── progress.md                   spec-implement가 쓴다
    ├── findings.md                   spec-review가 쓴다. spec-implement 수정 모드가 읽는다
    └── digest.md                     spec-digest가 쓴다

.minipowers/<stem>/work/              subagent에게 넘기는 brief · report · diff 패키지. 일회용
.worktrees/<stem>[-slice-N]           격리 작업 공간
```

`docs/minipowers/`가 없으면 spec-design이 만든다. `.minipowers/`와 `.worktrees/`는 **메인 체크아웃의 루트**에 둔다. 그 경로는 어디서 실행하든 아래 명령의 첫 줄 `worktree <경로>`에서 얻고, subagent에게는 절대경로로 넘긴다. worktree 안에서 실행한 `git rev-parse --show-toplevel`은 그 worktree의 루트를 돌려주므로 쓰지 않는다.

```bash
git worktree list --porcelain | head -1
```

`index.md`는 spec-digest가 브랜치마다 전체를 다시 생성하므로, 작업 둘이 나란히 진행되면 병합 때 충돌할 수 있다. 충돌하면 병합 뒤 `/spec-digest`를 다시 불러 재생성한다.

| 파일 | 쓰는 스킬 | 읽는 스킬 |
|---|---|---|
| `spec.md` | spec-design | spec-implement · spec-review · spec-digest |
| `todo/<stem>-followup.md` | spec-implement(spec 결함으로 멈출 때) | spec-design |
| `progress.md` | spec-implement | spec-review · spec-digest |
| `findings.md` | spec-review | spec-implement(수정 모드) · spec-digest |
| `digest.md`, `index.md` | spec-digest | 사람 |

각 파일의 절 제목과 줄 형식은 그 파일을 쓰는 스킬의 템플릿이 정한다. 읽는 스킬은 그 템플릿의 제목 문자열을 그대로 찾는다.

## stem 규칙

`<stem>`은 `yyyy-mm-dd-##-subject`다.

- `yyyy-mm-dd`는 spec을 쓴 날이다. 날짜는 기억으로 쓰지 않고 실행해서 얻는다.
  ```bash
  date +%F
  ```
  ```powershell
  (Get-Date).ToString('yyyy-MM-dd')
  ```
- `##`는 그날의 2자리 일련번호다. 병합 전 spec은 worktree에만 있으므로, 메인 체크아웃의 `docs/minipowers/`와 `git worktree list --porcelain`에 나오는 모든 worktree의 `docs/minipowers/`에서 같은 날짜로 시작하는 폴더를 모두 찾아 가장 큰 번호에 1을 더한다. 그날 첫 폴더면 `01`이다.
- `subject`는 소문자와 하이픈으로 된 짧은 주제어다.

feature 브랜치 이름은 프로젝트 지시 파일의 규칙을 따른다. 규칙이 없으면 stem을 그대로 쓴다.

## 정지 조건

spec-implement · spec-review · spec-digest는 진행 중에 설계에 관한 질문을 하지 않는다. 모호한 것은 spec을 기준으로 스스로 판정하고 `progress.md`에 `Ruling:` 줄로 남긴다.

멈추고 사용자에게 묻는 경우는 다음 넷뿐이다.

1. 되돌릴 수 없거나 파괴적인 조작을 해야 할 때
2. 보안에 민감한 조작을 해야 할 때. worktree에 없는 설정 파일이나 비밀 값이 필요할 때도 여기 해당한다("worktree 준비" 절)
3. worktree 밖으로 나가는 부작용이 생길 때. 병합, 공유 브랜치로 push, 배포가 여기 해당한다
4. spec이 틀려서 어느 방향으로 가도 추측일 때. 이 경우 spec 결함을 보고하고 끝낸다. spec-implement는 끝내기 전에 "중단 todo" 절대로 todo를 쓴다. 승인된 spec은 고치지 않는다. 고치는 일은 그 todo로 도는 새 사이클(spec-design)의 몫이다

네 스킬 모두 병합 · push · Pull Request 생성을 하지 않는다. 마무리 보고의 마지막 줄에 사용자가 할 다음 단계 하나를 적는다.

## 중단 todo

사이클이 spec 결함(정지 조건 4)으로 멈추면 spec-implement가 다음 사이클의 입력으로 todo 하나를 쓴다. spec을 고치는 대신 새 사이클로 고친다. 정지 조건 1~3은 사용자가 허락하거나 조건을 채운 뒤 같은 작업 폴더로 이어 가는 것이므로 todo를 쓰지 않는다. 사용자의 허락은 progress.md의 `승인:` 줄로 남긴다.

- 위치: `<메인 체크아웃 루트>/docs/minipowers/todo/<stem>-followup.md`. 폴더가 없으면 만든다. 같은 이름이 이미 있으면 덮어쓰지 않고 `<stem>-followup-2.md`, `-3.md`처럼 처음 비는 번호를 쓴다.
- 커밋하지 않는다. todo는 브랜치 밖의 사용자 파일이다.
- 형식은 아래 그대로다. spec-design이 이 파일을 읽어 새 spec의 "원 요구"로 옮긴다.

```markdown
# <해결할 것을 한 줄로> (spec 결함으로 중단된 <stem>의 후속)

- 중단된 작업: docs/minipowers/<stem>/spec.md
- 브랜치: <브랜치> (중단 시점 HEAD <sha>)
- 기준 커밋: <sha>

## spec 결함

progress.md의 `spec 결함:` 줄과 같은 내용. 틀린 전제 또는 항목과 확인한 결과를 `파일:줄`이나 명령 출력으로 쓴다.

## 끝난 것

progress.md의 `슬라이스 N: complete (commits <a>..<b>)` 줄마다 슬라이스 이름과 그 커밋 범위. 없으면 "없음".

## 남은 것

complete가 아닌 슬라이스의 제목과 Files. 없으면 "없음".

## 해결할 요구

새 사이클이 해결할 것. 원 spec의 요구 가운데 아직 이뤄지지 않은 것과 spec 결함을 고친 요구를 문장으로 쓴다.
```

## gitignore 처리

`.minipowers/` 또는 `.worktrees/`를 처음 만드는 스킬은 프로젝트 루트의 `.gitignore`를 확인한다.

- 해당 줄(`.minipowers/`, `.worktrees/`)이 없으면 파일 끝에 줄바꿈을 확인한 뒤 추가한다.
- 있으면 건드리지 않는다.
- `.gitignore`가 없으면 두 줄로 새로 만든다.

## worktree 준비

새로 만든 worktree에는 gitignore된 파일이 없다. 의존성 폴더, 로컬 설정 파일, 비밀 값이 여기 든다. 다음 두 단계를 합쳐 "준비"라고 부르고, 준비를 하는 때는 spec-implement/SKILL.md "준비와 기준 테스트"와 orchestrator.md가 정한다.

1. **파일 복사.** 프로젝트 지시 파일에 `minipowers worktree 복사:`로 시작하는 줄이 있으면, 그 뒤에 쉼표로 나열한 경로(메인 체크아웃 루트 기준)를 메인 체크아웃에서 worktree의 같은 경로로 복사한다.
   - 목록에 있는 파일만 복사한다. 목록은 사용자가 미리 허락한 것이므로 정지 조건 2에 해당하지 않는다. 목록 밖의 gitignore된 파일은 복사하지 않는다.
   - worktree에 같은 경로의 파일이 이미 있으면 덮어쓰지 않는다.
   - 메인 체크아웃에 없는 경로는 건너뛰고, 건너뛴 경로를 마무리 보고의 수동 확인 항목에 적는다.
   - 예: `minipowers worktree 복사: .env, src/backend/appsettings.Development.json`
2. **준비 명령.** 프로젝트 지시 파일에 준비 명령(의존성 설치 등)이 있으면 그것을, 없으면 저장소의 lock 파일로 정해지는 표준 설치 명령(`pnpm install`, `npm ci`, `dotnet restore` 등)을 worktree에서 한 번 돌린다. 해당하는 것이 없으면 건너뛴다.

준비 뒤에 테스트가 worktree에 없는 파일 때문에 실패하면 그 실패를 기존 실패로 넘기지 않는다. 목록에 없는 설정 파일, 연결 문자열, 인증서가 여기 해당한다. 그대로 두면 그 테스트가 기준 테스트부터 리뷰까지 전부 제외되어 아무것도 검증되지 않기 때문이다. 정지 조건 2로 멈추고, 빠진 것으로 보이는 파일과 함께 "프로젝트 지시 파일에 `minipowers worktree 복사:` 줄을 추가하거나 파일을 직접 worktree에 복사한 뒤 다시 실행한다"고 보고한다.

## 문체 규칙

네 스킬이 쓰는 문서(spec.md · progress.md · findings.md · digest.md · 중단 todo)에 적용한다.

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
