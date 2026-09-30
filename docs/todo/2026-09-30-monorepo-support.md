# 모노레포 지원: 저장소 루트와 프로젝트 루트를 구분한다

origin/dev의 커밋 e2a2876(2026-09-29, "spec 작업을 메인 체크아웃에서 진행하고 프로젝트 루트 기준으로 동작하게 변경")에 들어 있던 두 갈래 중 하나다. 다른 갈래(메인 체크아웃 전환, `--amend`)는 2026-09-30의 worktree 기반 설계와 반대라 버렸고, 이 갈래는 그 설계와 직교하므로 다시 얹는다. 원문은 `git show e2a2876 -- packages/minipowers/skills`로 본다.

## 현상

네 스킬과 스크립트는 프로젝트 루트가 저장소 루트와 같다고 가정한다.

- conventions.md "폴더 구조"는 `docs/minipowers/`, `.minipowers/`, `.worktrees/`를 메인 체크아웃 루트(`git worktree list --porcelain | head -1`)에 둔다.
- `git show <브랜치>:docs/minipowers/<stem>/spec.md`, `git cat-file -e "$b:docs/minipowers/<stem>/spec.md"`처럼 저장소 루트 기준 경로를 받는 명령에 prefix가 없다.
- `scripts/workspace`는 `git rev-parse --show-toplevel`을 루트로 쓴다.
- 슬라이스 worktree와 `.worktrees/<stem>`은 저장소 전체를 checkout한다.

한 저장소에 프로젝트가 여럿이면(예: `tools/baw-pos-deployment`와 `tools/DTOGenerator`가 한 저장소) `docs/minipowers/`가 저장소 루트에 생겨 어느 프로젝트의 것인지 구분되지 않고, worktree마다 다른 프로젝트까지 복사된다.

## 결정할 것

1. **프로젝트 루트의 정의.** e2a2876은 "현재 작업 디렉터리에서 가장 가까운 프로젝트 지시 파일이나 프로젝트 파일이 있는 폴더"로 잡고 `git rev-parse --show-prefix`로 `<prefix>`를 얻었다. 관찰 가능한 조건으로 다시 정한다. 후보는 다음이다.
   - 사용자가 스킬을 부른 현재 작업 디렉터리를 프로젝트 루트로 본다. 가장 단순하고 관찰 가능하다.
   - 인자로 받은 `docs/minipowers/<stem>/`의 세 단계 위를 프로젝트 루트로 본다. spec-implement 이후 세 스킬은 이것으로 충분하고 e2a2876의 workspace 스크립트가 이 방식이다. spec-design만 첫 후보가 필요하다.
2. **`.worktrees/`와 `.minipowers/`의 위치.** 프로젝트 루트 아래(e2a2876) 또는 저장소 루트 아래에 `<prefix>`를 이름에 넣는 방식. 프로젝트 루트 아래에 두면 `.gitignore`도 프로젝트 루트의 것을 고쳐야 한다.
3. **sparse-checkout 범위.** `<prefix>`만 받으면 프로젝트가 저장소 루트의 공용 파일(lock 파일, 공용 설정)에 의존할 때 테스트가 깨진다. e2a2876은 `[포함 경로...]`를 프로젝트 지시 파일에서 받았다. 그 줄의 형식을 정한다(예: `minipowers sparse 포함: <경로>, <경로>`).

## fix plan (결정 뒤)

1. conventions.md "폴더 구조"에 "프로젝트 루트와 저장소 루트" 소절을 더한다. `<prefix>`를 얻는 명령, 저장소 루트 기준 명령에 `<prefix>`를 붙이는 규칙, 프로젝트 루트에서 실행하는 명령은 붙이지 않는 규칙을 적는다. `<prefix>`가 비어 있으면 지금과 같다.
2. "작업 위치 결정"의 spec.md 찾기 경로와 브랜치 검색 명령에 `<prefix>`를 붙인다.
3. "gitignore 처리"를 프로젝트 루트의 `.gitignore` 기준으로 바꾼다. 저장소 루트의 것은 보지 않는다.
4. "worktree 준비"에 단계 0 sparse-checkout을 더한다. `<prefix>`가 비어 있지 않을 때만 한다.
   ```bash
   git worktree add --no-checkout -b <브랜치> <worktree 경로> <시작점>
   git -C <worktree 경로> sparse-checkout set <prefix> [포함 경로...]
   git -C <worktree 경로> checkout <브랜치>
   ```
   spec-design이 만드는 `.worktrees/<stem>`과 orchestrator가 만드는 `-slice-N` 둘 다 이 단계를 탄다. 2026-09-30 설계에서는 spec-design도 worktree를 만들므로 e2a2876보다 적용 지점이 하나 더 있다.
5. spec-design 2절: 프로젝트 루트를 정하고, 깨끗한 상태 확인(`git status --porcelain`)의 범위를 프로젝트 루트로 좁힐지 정한다. 다른 프로젝트의 변경이 있어도 이 프로젝트의 spec 작업과 무관하다.
6. orchestrator.md: 슬라이스 worktree 생성 명령과 `<슬라이스 worktree>` 경로(`<worktree 경로>/<prefix>`)를 고친다. subagent에게 넘기는 절대경로는 프로젝트 루트다.
7. `scripts/workspace`: spec 경로에서 프로젝트 루트를 잡는다. e2a2876의 구현(spec.md의 세 단계 위가 `docs/minipowers/<stem>` 모양이면 그 위, 아니면 저장소 루트)을 그대로 가져온다. `slice-brief`, `review-package`는 workspace를 통해 루트를 얻으므로 함께 맞는지 확인한다.
8. stem 규칙의 일련번호 검색 범위를 프로젝트 루트의 `docs/minipowers/`로 좁힌다.
9. README 두 언어의 요구사항 절에 모노레포에서의 동작 한 줄을 더한다.

## 검증

- 프로젝트 둘이 있는 임시 저장소를 만들고 한 프로젝트 폴더에서 `workspace`, `slice-brief`, `review-package`를 실행해 `.minipowers/`가 프로젝트 루트에 생기는지 본다.
- 같은 저장소에서 sparse-checkout으로 만든 worktree에 다른 프로젝트 폴더가 없는지 본다.
- `<prefix>`가 빈 단일 프로젝트 저장소에서 지금과 같은 결과가 나오는지 본다. release 테스트에 이 경우를 더한다.

## 바뀌는 파일

`_shared/conventions.md`, `spec-design/SKILL.md`, `spec-implement/orchestrator.md`, `spec-implement/scripts/workspace`, `README.md`, `README-ko.md`, `scripts/release.test.mjs`.
