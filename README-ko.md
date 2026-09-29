# pyan-minipowers

[English](README.md) | 한국어

**설계도를 먼저 정하고, AI가 짠 코드는 그 설계도를 따르게 한다.**

Claude Code와 Codex에서 쓰는 플러그인 **[minipowers](packages/minipowers/README-ko.md)**의 마켓플레이스입니다. 설계도는 사람이 승인한 spec 파일입니다.

---

## 핵심

코드 변경 한 건을 **설계 → 구현 → 리뷰 → 기록** 네 단계로 진행합니다. 단계마다 skill 하나가 맡고, 결과를 파일로 남깁니다.

| 단계 | 호출 | 산출물 | 산출물 설명 |
| --- | --- | --- | --- |
| 1. 설계 | `/spec-design <todo 파일 또는 문장>` | `spec.md` | 사용자와 질의응답으로 정하고 승인받은 설계도 |
| 2. 구현 | `/spec-implement <작업 폴더>` | 슬라이스별 커밋, `progress.md` | spec을 슬라이스 단위로 구현한 커밋과 진행 기록 |
| 3. 리뷰 | `/spec-review <작업 폴더>` | `findings.md` | 구현 대화를 모르는 새 세션에서 spec 기준으로 diff를 검토한 지적 |
| 4. 기록 | `/spec-digest <작업 폴더>` | `digest.md`, `docs/minipowers/index.md` | 소스코드로 확인한 결과 중심 기록과 작업 목록 색인 |

작업 하나는 `docs/minipowers/<날짜-번호-주제>/` 폴더 하나에 모이고, 인자의 `<작업 폴더>`가 이 경로입니다.

세 가지 원칙이 전부입니다.

- **파일이 단계를 잇는다.** 단계 사이를 대화가 아니라 spec 파일이 잇습니다. compact나 세션 교체로 대화가 사라져도 결정은 남고, 각 단계를 새 세션·다른 모델에서 이어받을 수 있습니다.
- **명시적 호출로 실행한다.** Claude Code에서는 `/spec-design`, Codex에서는 `$spec-design`처럼 사용자가 직접 부릅니다. Claude Code에서는 "리뷰해줘" 같은 자연어로 시작되지 않습니다. 두 도구 모두 세션이 시작될 때 skill을 쓰라는 지시를 주입하지 않습니다.
- **결정은 설계 단계에서 끝낸다.** 사용자에게 설계를 묻는 skill은 `spec-design`뿐입니다. 나머지 셋은 승인된 spec을 따르고, 병합·push·PR은 만들지 않습니다. 끝맺음은 사람이 합니다.

이름의 "mini"는 기능이 적다는 뜻이 아니라, 에이전트에게 주는 개입을 최소로 줄였다는 뜻입니다. 단계별 입출력과 폴더 구조는 [플러그인 README](packages/minipowers/README-ko.md)에 있습니다.

---

## 🚀 설치 (최초 1회)

Claude Code 명령은 **대화창**에, Codex 명령은 **터미널**에 입력합니다.

| 하고 싶은 일 | Claude Code | Codex CLI |
| --- | --- | --- |
| 1. 마켓플레이스 등록 | `/plugin marketplace add pyan-labs/pyan-minipowers` | `codex plugin marketplace add pyan-labs/pyan-minipowers` |
| 2. 플러그인 설치 | `/plugin install minipowers` | `codex plugin add minipowers@pyan-minipowers` |
| 3. 설치 확인 | `/plugin` | `codex plugin list` (skill 목록은 세션에서 `/skills`) |
| 업데이트 | `/plugin marketplace update pyan-minipowers` 후 `/plugin update minipowers@pyan-minipowers` | `codex plugin marketplace upgrade pyan-minipowers` 후 `codex plugin add minipowers@pyan-minipowers` |
| 플러그인 제거 | `/plugin uninstall minipowers` | `codex plugin remove minipowers@pyan-minipowers` |
| 마켓플레이스 해제 | `/plugin marketplace remove pyan-minipowers` | `codex plugin marketplace remove pyan-minipowers` |

- Claude Code에서 설치 위치(scope)를 물으면 **user**를 고릅니다. project로 설치하면 그 프로젝트에서만 명령이 보입니다.
- 설치하면 skill이 자동 등록됩니다. 설정 파일을 손으로 만들 필요도, 프로젝트마다 준비할 것도 없습니다.
- minipowers를 쓸 때는 **superpowers를 설치하지 않습니다.** superpowers가 세션마다 자기 skill을 쓰라는 지시를 주입해 minipowers 흐름과 충돌합니다.
- 변경 내역은 [CHANGELOG](CHANGELOG.md)에 있습니다. 업데이트 후에는 새 세션에서 쓰거나, Claude Code에서 `/reload-plugins`로 다시 불러옵니다.

---

## superpowers와 무엇이 다른가

[superpowers](https://github.com/obra/superpowers)는 AI 코딩 에이전트에게 brainstorming, TDD, 계획, 리뷰 같은 개발 습관을 skill로 가르치는 훌륭한 플러그인입니다. minipowers는 그 아이디어에서 출발했고, 써 보며 부딪힌 두 가지를 다르게 풀었습니다.

| | superpowers | minipowers |
| --- | --- | --- |
| skill을 실행하는 때 | 세션 시작·clear·compact마다 "skill을 써라"는 지시를 주입해, 원하지 않는 순간에도 끼어든다 | 사용자가 `/`로 부를 때만 |
| 단계를 잇는 것 | 대화 컨텍스트 | spec 파일 (`spec.md`, `progress.md`, `findings.md`) |

> minipowers는 superpowers에서 영감을 받은 독립 프로젝트입니다. superpowers 프로젝트나 원작자 Jesse Vincent와 관계가 없습니다. 일부 스크립트는 superpowers(MIT)에서 가져왔고 [출처와 라이선스](packages/minipowers/README-ko.md#출처)를 밝혀 두었습니다.
