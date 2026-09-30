---
name: spec-digest
description: minipowers 작업 폴더(docs/minipowers/<stem>/)의 spec.md, progress.md, findings.md를 소스코드로 확인해 결과 중심 기록 digest.md를 쓰고 docs/minipowers/index.md를 다시 생성한다.
argument-hint: "<작업 폴더 docs/minipowers/<stem>/>"
disable-model-invocation: true
---

# spec-digest — 결과 중심 기록

작업 폴더 하나의 spec.md, progress.md, findings.md를 읽고, 소스코드로 확인해 `digest.md`를 쓴다. 이어서 `docs/minipowers/index.md`를 다시 생성한다.

독자는 그 작업을 지켜보지 않은 개발자다. digest 하나만 읽고 무엇이 바뀌었고 어떻게 동작하는지 알 수 있어야 한다.

## 정본 규칙

```
spec.md, progress.md, findings.md  →  어느 소스를 열어야 하는지 알려 주는 지도
소스코드                              →  무엇이 만들어졌는지의 정본
```

digest에는 소스를 열어 확인한 것만 쓴다. 문서와 소스가 다르면 소스대로 쓰고, 어긋난 사실을 해당 절에 "문서와 다름 — 소스 기준"으로 한 줄 남긴다.

필요한 만큼만 쓴다. 채우기용 절이나 반복 요약을 넣지 않는다.

## 1. 시작

1. 이 SKILL.md가 있는 폴더를 기준으로 `../_shared/conventions.md`를 읽는다. 스킬에 딸린 파일의 상대경로는 프로젝트의 현재 작업 디렉터리 기준이 아니다. 인자 해석, 폴더 구조, 정지 조건, 문체 규칙은 거기 있는 대로 따른다. 템플릿은 `./digest-template.md`와 `./index-template.md`다.
2. 인자로 작업 폴더를 정한다. 이하 `<폴더>`, 폴더 이름을 `<stem>`이라 부른다. 현재 체크아웃에 `<폴더>/spec.md`가 없고 메인 체크아웃 루트(conventions.md "폴더 구조"의 명령으로 얻는다)의 `.worktrees/<stem>`에 있으면, 이하 모든 명령과 파일 읽기와 쓰기를 그 안에서 한다. 둘 다 없으면 conventions.md "인자 해석"대로 안내하고 끝낸다.
3. `<폴더>/spec.md`를 읽는다. 머리말에서 다음 세 줄을 찾는다.
   - `- 기준 커밋: <sha>`
   - `- 브랜치: <이름>`
   - `- 원 요구:`

   값이 백틱으로 감싸여 있으면 첫 백틱 안의 문자열을 값으로 쓴다.
4. `<폴더>/progress.md`와 `<폴더>/findings.md`가 있으면 읽는다.

절 제목과 줄 형식은 아래 문자열을 그대로 찾는다. 코드 펜스(```) 안의 줄은 제목으로 치지 않는다.

```
spec.md       ## 문제
              ## 결정
              ### 바꾸는 것
              ### 바꾸지 않는 것
              ### 감수하는 것
              ## 검증된 전제
              ## 구현 슬라이스
              ### 슬라이스 N: 이름
              ## 수용 기준
progress.md   슬라이스 N: complete (commits <a>..<b>)
              Ruling: <결정> — <근거> — <틀렸다면 잘못되는 것>
              슬라이스 N: minor(deferred): ...
              슬라이스 N: parked — ... — Ruling: ...
              finding <ID>: <sha>
              수동 확인: <항목>
              발견: <내용> — <file:line>
              승인: <조작> — <사용자 답>
              완료: head <sha>
              - 기준 테스트: <통과/실패 수 한 줄>, 실패: <테스트 이름 목록 또는 없음>
              슬라이스 N: RED <테스트 이름> — <실패 요지 한 줄>
              슬라이스 N: RED 없음 — <테스트를 두지 않는 이유 한 줄>
              finding <ID>: 반박 — <근거 file:line>
              슬라이스 N: withdrawn — <finding 한 줄> — <근거 file:line>
findings.md   ## 구현 요약
              ### 바뀐 파일
              ### 수용 기준별 구현 위치
              ### 동작 흐름
              ## Findings
              ### Critical
              ### Important
              ### Minor
              ## Verdict
              Verdict: ready to merge (<sha>)
              Verdict: needs fixes — <목록>
              Rounds: 2/2 — 남은 항목은 사용자가 판정한다
              - 기존 실패: <목록 또는 없음>
              — WITHDRAWN (<근거 file:line>)
```

현재 판정은 findings.md의 `## Verdict` 절 하나다. 재리뷰는 이 절을 교체하므로 다른 절의 `Verdict:` 줄은 판정으로 읽지 않는다.

**이전 형식**: progress.md 머리말에 `- 기준 테스트:` 줄이 없으면 이 개선 전에 쓴 파일이다.
`RED` 줄, `반박` 줄, `withdrawn` 줄이 없어도 마찬가지다.
findings.md에 `- 기존 실패:` 줄이나 `WITHDRAWN`이 없어도 마찬가지다.
새 형식에서 채우는 항목은 채우지 않고 "없음"이라고 쓴다. 회귀 0이므로 이런 파일을 만나도 오류 없이 처리한다.

## 2. 상태와 커밋 범위

상태는 파일 존재와 내용으로 정한다. 값은 넷이고, 위에서부터 처음 성립하는 것 하나다. index.md도 같은 표로 판정한다.

| 조건 | 상태 |
|---|---|
| findings.md의 `## Verdict` 절에 `Verdict: ready to merge` 줄이 있다 | ready to merge |
| progress.md에 `완료: head` 줄이 있다 | 구현 완료 |
| progress.md가 있다 | 구현 중 |
| 그 밖 (spec.md만 있다) | 설계 |

findings.md가 없고 상태가 설계가 아니면 상태 값 뒤에 "(리뷰 전)"을 붙인다. 예: `구현 완료 (리뷰 전)`. `## Verdict` 절에 `Rounds: 2/2` 줄이 있으면 "(사용자 판정 필요)"를 붙인다.

커밋 범위는 `<기준 커밋>..<끝 커밋>`이다. 기준 커밋은 spec 머리말 값이다. 끝 커밋은 아래에서 처음 있는 것이다.

1. 상태가 ready to merge이면 `Verdict: ready to merge (<sha>)` 줄의 `<sha>`
2. progress.md의 마지막 `완료: head <sha>`의 `<sha>`

둘 다 없으면 커밋 범위를 `<기준 커밋>..(끝 커밋 없음)`으로 적는다. 상태가 설계이면 커밋 범위는 "없음"이다.

## 3. 파일별 처리

digest.md의 절은 상태와 관계없이 항상 여섯 개다. 파일이 없을 때 달라지는 것은 각 절을 채우는 소스뿐이다.

**progress.md가 없으면** 상태는 "설계"다. 다음 절은 본문을 "없음"으로 쓴다.

- `## 바뀐 파일`
- `## 구현된 기능`
- `## 동작 흐름 (e2e)`
- `## 결정과 판정`의 Ruling, 리뷰 판정, 수동 확인 항목, parked

**findings.md가 없으면 상태에 "리뷰 전"이라고 적는다(2절의 표시).** findings.md에서 오는 세 절(바뀐 파일, 구현된 기능, 동작 흐름)은 다음으로 채운다.

- progress.md의 `complete (commits <a>..<b>)` 줄로 슬라이스별 커밋 범위를 본다.
- `git diff --stat <기준 커밋>..<끝 커밋>`으로 전체 범위를 보고, `git diff --name-status <기준 커밋>..<끝 커밋>`의 A, M, D로 생성, 변경, 삭제를 가른다.
- 끝 커밋이 없으면 progress.md에 적힌 커밋마다 `git show --name-status <sha>`로 같은 표를 만든다.
- 수용 기준마다 관련 소스를 열어 `파일:줄`을 찾는다.

리뷰 판정은 "없음(리뷰 전)"으로 쓴다.

**progress.md와 findings.md가 둘 다 있으면** findings.md의 `## 구현 요약`을 출발점으로 삼는다. 표와 흐름의 `파일:줄`을 소스에서 열어 확인하고, 줄 번호가 바뀌었거나 빠진 것을 보강한다.

## 4. digest.md 작성

`./digest-template.md`를 복사해 `<폴더>/digest.md`로 채운다. 절 제목은 템플릿과 같은 문자열을 쓴다. 이미 digest.md가 있으면 전체를 새로 쓴다.

머리말에는 작성일, 상태, 커밋 범위, 브랜치를 둔다. 작성일은 conventions.md의 날짜 명령으로 얻는다. 머리말 바로 아래 줄에 다음 문장을 그대로 둔다.

> 이 문서는 기록이다. 소스코드와 다르면 소스코드가 맞다.

### `## 한 줄 요약`

spec `### 바꾸는 것`을 과거형 한 문장으로 쓴다. 상태가 설계이면 예정형으로 쓰고 끝에 "(구현 전)"을 붙인다.

### `## 바뀐 파일`

열이 파일, 구분(생성/변경/삭제), 역할 한 줄인 표다. findings.md `### 바뀐 파일` 표를 `git diff --name-status` 결과와 대조해 옮긴다. 역할은 파일을 열어 확인한 내용으로 쓴다. `docs/minipowers/<stem>/` 아래 파일은 표에 넣지 않는다.

### `## 구현된 기능`

spec `## 수용 기준`의 항목마다 한 행이다. 열은 수용 기준, 구현 위치(`파일:줄`), 검증 테스트다. findings.md `### 수용 기준별 구현 위치`를 출발점으로 소스와 테스트 파일을 열어 확인한다. 검증 테스트 열을 채울 때는 progress.md의 `슬라이스 N: RED <테스트 이름> — ...` 줄의 테스트 이름을 출발점으로 삼는다. RED 줄이 없으면(이전 형식이거나 `RED 없음`) 지금처럼 findings.md와 테스트 파일에서 찾는다.

### `## 동작 흐름 (e2e)`

spec 수용 기준마다 소절을 하나 두고, 사용자 행동 → 진입점 → 거치는 계층 → 저장/응답 순서로, 단계마다 `파일:줄`을 붙인다. findings.md `### 동작 흐름`을 출발점으로 소스를 열어 호출을 따라가며 확인 · 보강한다.

이어서 슬라이스가 맞물리는 지점을 표로 적는다. spec `### 슬라이스 N: 이름`의 Consumes/Produces 쌍마다, 생산하는 쪽과 소비하는 쪽이 실제 코드에서 만나는 `파일:줄`을 찾는다. 슬라이스가 하나면 "없음"이다.

### `## 결정과 판정`

- spec의 결정: `### 바꾸는 것`, `### 바꾸지 않는 것`, `### 감수하는 것`을 각각 한두 줄로 줄인다.
- Ruling: progress.md에서 `Ruling:`을 포함하는 줄을 전부 원문 그대로 옮긴다.
- 발견: progress.md에서 `발견:`으로 시작하는 줄을 전부 원문 그대로 옮긴다.
- 승인: progress.md에서 `승인:`으로 시작하는 줄을 전부 원문 그대로 옮긴다.
- 리뷰 판정: findings.md `## Verdict` 절의 `Verdict:` 줄과 `Rounds:` 줄을 원문 그대로 옮긴다. 제목에 `— WITHDRAWN (<근거 file:line>)`이 붙은 finding 제목이 있으면 원문 그대로 옮긴다.
- 수동 확인 항목: spec `## 수용 기준` 절의 `- 수동 확인 항목:` 줄과 progress.md의 `수동 확인:`으로 시작하는 줄을 옮긴다.
- parked: progress.md에서 `슬라이스 N: parked —`로 시작하는 줄을 원문 그대로 옮긴다.

해당하는 줄이 없는 항목은 "없음"이라고 쓴다.

### `## 관련`

- 선행 spec: spec.md 본문에서 다른 stem을 가리키는 경로(`docs/minipowers/<다른 stem>/` 또는 `../<다른 stem>/`)를 찾아 적는다.
- 뒤 spec: 이 spec을 참조하는 다른 spec을 찾는다.
  ```bash
  grep -l "<stem>" docs/minipowers/*/spec.md
  ```
  자기 자신의 spec.md는 뺀다.
- 후속 todo: 메인 체크아웃 루트(conventions.md "폴더 구조"의 명령으로 얻는다)의 `docs/minipowers/todo/<stem>-followup*.md`를 찾아 경로를 나열한다. spec-implement가 spec 결함으로 멈추며 쓴 것이다(conventions.md "중단 todo"). 없으면 "없음".
- 커밋 범위: 2절에서 정한 값.
- 브랜치: spec 머리말의 브랜치.

## 5. index.md 재생성

`docs/minipowers/index.md` 전체를 `./index-template.md`의 형식과 생성 절차대로 다시 쓴다. 기존 index.md는 읽지 않는다. 손으로 고친 내용이 남지 않는 대신 어느 시점에 불러도 같은 목록이 나온다. 브랜치마다 다시 생성되므로 병합 때 충돌할 수 있고, 그때는 병합 뒤 이 스킬을 다시 불러 재생성한다.

`docs/minipowers/*/` 폴더 중 `todo/`와 `spec.md`가 없는 폴더를 뺀 전부가 한 행씩 된다. 상태는 2절의 표로 정하고 "(리뷰 전)" 같은 표시는 붙이지 않는다.

## 6. 커밋과 마무리

두 파일을 쓴 뒤 현재 브랜치를 확인한다.

```bash
git rev-parse --abbrev-ref HEAD
```

- 현재 브랜치가 spec 머리말의 브랜치와 같으면 `<폴더>/digest.md`와 `docs/minipowers/index.md`를 한 커밋으로 넣는다. 커밋 메시지 형식은 프로젝트 지시 파일이 정한다. 정하지 않았으면 `docs(<stem>): digest`를 쓴다.
- 다르면 커밋하지 않는다. 공유 브랜치에 직접 커밋하는 일을 막기 위해서다.

병합, push, Pull Request 생성은 하지 않는다.

마무리 보고에는 digest.md 경로, 상태, 커밋 범위, index.md의 행 수를 적는다. 커밋하지 않았으면 "digest.md와 index.md를 썼고 커밋하지 않았다. 현재 브랜치가 spec의 브랜치와 다르다"를 마지막 줄로 적는다. 커밋했으면 마지막 줄은 상태에 따른 다음 단계 하나다.

상태가 ready to merge이면 다음 단계 줄 바로 위에 병합 뒤 정리 명령을 적는다. 스킬이 직접 지우지는 않고 안내만 한다.

```
병합 뒤 정리: git worktree remove .worktrees/<stem>
              git branch -d <브랜치>
              <메인 체크아웃>/.minipowers/<stem>/ 삭제
```

위에서부터 처음 성립하는 행 하나를 쓴다.

| 조건 | 마지막 줄 |
|---|---|
| 상태가 ready to merge | 다음 단계: 프로젝트 지시 파일의 git 규칙대로 브랜치 `<브랜치>`의 Pull Request를 만든다 |
| findings.md `## Verdict` 절에 `Rounds: 2/2` 줄이 있다 | 다음 단계: findings.md `## Verdict` 절의 남은 항목을 판정한다 |
| findings.md `## Verdict` 절에 `Verdict: needs fixes` 줄이 있다 | 다음 단계: `/spec-implement <폴더>`로 남은 finding을 고친 뒤 `/spec-review <폴더>` |
| 상태가 구현 완료 (findings.md 없음) | 다음 단계: `/spec-review <폴더>` |
| 상태가 구현 중 | 다음 단계: `/spec-implement <폴더>`로 남은 슬라이스를 구현한다 |
| 상태가 설계 | 다음 단계: `/spec-implement <폴더>` |
