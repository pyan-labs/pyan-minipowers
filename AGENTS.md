# AGENTS.md

**pyan-minipowers**는 Claude/Codex 플러그인 마켓플레이스 저장소다. 주된 작업은 `packages/<plugin>/skills/`의 skill을 새로 만들거나 고치는 것이다. 명령은 루트 `package.json` scripts를 본다.

## 플러그인의 핵심 명제

`packages/minipowers`는 코드 변경 한 건을 네 skill이 차례로 맡는다. 각 skill은 산출물을 `docs/minipowers/<stem>/`에 남긴다.

| skill | 산출물 |
|---|---|
| `spec-design` | `spec.md`, feature 브랜치와 worktree, spec만 든 첫 커밋 |
| `spec-implement` | 슬라이스별 커밋, `progress.md`. spec 결함으로 멈추면 후속 todo |
| `spec-review` | `findings.md` |
| `spec-digest` | `digest.md`, `docs/minipowers/index.md` |

**각 skill은 대화 context를 이어받지 않고, 앞 단계들의 산출물만 받아 독립적으로 진행할 수 있어야 한다.** 이것이 이 플러그인의 핵심이다. 앞 단계와 같은 세션이 아니어도, 다른 모델이어도 같게 동작해야 한다.

- 뒤 단계가 필요로 하는 정보는 앞 단계의 산출물에 적혀 있어야 한다. 대화에서만 합의한 내용은 입력이 아니다.
- 산출물의 절 제목과 줄 형식은 다음 단계가 읽는 계약이다. 형식을 바꾸면 그것을 읽는 skill을 함께 바꾼다.
- 뒤 단계는 앞 단계들의 산출물을 쌓아서 받는다. 예를 들어 `spec-review`는 `spec.md`, `progress.md`, 구현 커밋의 diff를 함께 읽는다.
- 승인된 `spec.md`는 고치지 않는다. 바꿀 것이 생기면 새 todo로 새 사이클을 돈다.

## skill 작성 방향

- **같은 입력이면 같은 종류의 산출물.** 산출물의 종류·개수가 모델 판단이나 숫자 상한으로 갈리지 않게 한다. 분기는 파일 존재·도구 존재·파일 내용처럼 관찰 가능한 조건만 쓴다.
- **방향을 주고 세부는 모델에 맡긴다.** 목적·정지 조건·산출물 형태를 분명히 하고, 모델이 알아서 할 절차를 길게 늘어놓지 않는다.
- 여러 skill이 공유하는 규약은 플러그인의 `_shared/` 같은 한 곳에 두고 참조한다.

## 배포 규칙

- **Claude와 Codex 양쪽에서 동작해야 한다.** skill은 공용이고 매니페스트만 따로다(`.claude-plugin/`, `.codex-plugin/`, `.agents/plugins/`). 새 skill이나 플러그인을 추가하면 양쪽 등록을 함께 맞춘다.
- **`dist/`는 배포물이다.** 손으로 고치지 말고 `pnpm run dist`로 다시 만들어 소스 변경과 함께 커밋한다.
- 변경을 배포할 때는 `pnpm run version:bump <plugin> <level>`로 해당 플러그인 버전을 올린다.
