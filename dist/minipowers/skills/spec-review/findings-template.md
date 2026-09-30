# <spec 제목> — 리뷰 (<기준 커밋>..<HEAD>)

- 리뷰 일시: <conventions.md의 날짜 명령으로 얻은 일시>
- 리뷰어: <모델 또는 도구 이름>
- 전체 테스트: <spec 머리말의 명령> — <통과 또는 실패 한 줄 요약>
- 커밋되지 않은 변경: <`git status --short` 결과가 비었으면 "없음", 있으면 "있음, 리뷰 대상 아님">
- 기존 실패: <progress.md 머리말 `- 기준 테스트:` 줄의 실패 목록 또는 "없음". 그 줄이 없으면 `기록 없음(이전 형식 progress.md)`>

## 구현 요약

### 바뀐 파일

`git diff --stat <기준 커밋>..HEAD`의 파일마다 한 줄. 역할은 이 변경에서 그 파일이 맡은 일이다.

| 파일 | 생성/변경/삭제 | 역할 |
|---|---|---|

### 수용 기준별 구현 위치

spec의 `## 수용 기준` 항목마다 한 줄. 구현 위치가 없으면 `file:line` 칸에 "없음"이라고 쓰고 Findings에 Missing으로 올린다.

| 수용 기준 | file:line | 검증한 테스트 |
|---|---|---|

### 동작 흐름

수용 기준 하나당 3~5줄. 사용자 행동 → 진입점 → 거치는 계층 → 저장 또는 응답 순서로, 각 단계에 `file:line`을 붙인다.

**수용 기준 1: <요약>**
1. 사용자 행동:
2. 진입점:
3. 거치는 계층:
4. 저장/응답:

## Findings

**리뷰 기준 대조.** spec의 `## 리뷰 기준`이 명시한 검사 항목마다 한 줄. 위반이면 아래 finding 번호를 적는다.

| 리뷰 기준 항목 | 확인한 곳(file:line 또는 명령) | 결과 |
|---|---|---|

finding은 해당 심각도 절 아래에 둔다. 제목은 한 단계 낮은 `#### <번호> <태그> <한 줄 제목>` 형식이고(예: `#### I1 [Missing] 빈 입력 처리 없음`), 아래에 `- 위치: file:line`, `- 무엇:`, `- 왜:`, `- 어떻게:` 네 줄을 둔다. 번호는 심각도 머리글자(C, I, M)와 파일 전체에서 이어지는 번호다. 태그는 요구사항 대조에서 나온 항목에만 `[Missing]`, `[Extra]`, `[Misunderstood]` 중 하나를 붙인다.

### Critical

동작이 틀리거나 데이터가 깨지는 것. 없으면 "없음".

### Important

고치기 전에는 믿을 수 없는 것. 없으면 "없음".

### Minor

다듬기. 없으면 "없음".

## Verdict

이 절이 findings.md의 유일한 현재 판정이다. 재리뷰 때 이 절의 내용을 새 판정으로 교체한다. Verdict 줄 형식은 아래 둘뿐이다.

Verdict: ready to merge (<리뷰한 HEAD sha>)
또는
Verdict: needs fixes — <C1, I2 처럼 남은 Critical·Important 번호 목록>

라운드 수(재리뷰의 수)가 2 이상인데도 남은 항목이 있으면 `needs fixes` 줄 바로 아래에 다음 줄을 덧붙인다. 사용자가 고칠 항목을 정하면 이 줄을 지우고 spec-implement를 부른다.

Rounds: 2/2 — 남은 항목은 사용자가 판정한다

`ready to merge (<sha>)`의 `<sha>`는 리뷰한 HEAD다. 이 findings.md를 넣은 커밋은 그 뒤에 온다.

전체 테스트 명령과 출력의 마지막 부분(통과·실패 수가 보이는 줄)을 코드 블록으로 붙인다.

다음 단계: `/spec-implement <폴더>` (수정 모드)
또는
다음 단계: 남은 항목을 사용자가 판정한다 (`Rounds:` 줄이 있을 때)
또는
다음 단계: `/spec-digest <폴더>`, 그 뒤 프로젝트 규칙대로 PR

---

전체 리뷰에서는 위 `---` 선 위까지만 쓴다. 재리뷰 회차마다 파일 끝에 아래 절을 덧붙이고, `## Verdict` 절의 내용을 새 판정으로 교체한다. 다른 절은 그대로 둔다. 해결된 항목은 그 finding의 원래 제목 뒤에 `— ADDRESSED (<수정 커밋 sha>)`를 붙인다. 예: `#### I1 [Missing] <한 줄 제목> — ADDRESSED (a1b2c3d)`. progress.md에 `finding <ID>: 반박 —` 줄이 있고 그 근거가 맞으면 `— WITHDRAWN (<근거 file:line>)`을 붙인다. 예: `#### I2 [Misunderstood] <한 줄 제목> — WITHDRAWN (path/to/file.ts:30)`.

## 재리뷰 R

- 리뷰 일시: <conventions.md의 날짜 명령으로 얻은 일시>
- 리뷰어: <모델 또는 도구 이름>
- 범위: <이전 리뷰의 HEAD>..<HEAD>
- 전체 테스트: <명령> — <한 줄 요약>

### 이전 finding 판정

progress.md에 `finding <ID>: 반박 —` 줄이 있는 항목은 그 근거를 코드로 확인해 근거가 맞으면 WITHDRAWN, 틀리면 NOT ADDRESSED로 적는다.

| finding | 수정 커밋(progress.md) | 판정 | 근거 file:line |
|---|---|---|---|
| I1 | a1b2c3d | ADDRESSED | path/to/file.ts:42 |
| I2 | 없음(반박) | WITHDRAWN | path/to/file.ts:30 |
| I3 | 없음 | NOT ADDRESSED | path/to/file.ts:77 |
| M1 | 없음 | NOT ADDRESSED | path/to/file.ts:12 |

### 새로 깨뜨린 것

수정 diff가 새로 깨뜨린 것을 `## Findings`와 같은 형식의 finding으로 적는다. 번호는 파일 전체에서 이어지고 태그는 `[새로 깨뜨림]`이다(예: `#### I4 [새로 깨뜨림] <한 줄 제목>`). 없으면 "없음"이라고 쓴다. 판정은 `## Verdict` 절에만 쓴다.
