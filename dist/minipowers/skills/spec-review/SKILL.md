---
name: spec-review
description: 구현 대화 이력이 없는 독립 세션에서 minipowers 작업의 구현을 리뷰하거나, 저장된 findings.md를 기준으로 재리뷰할 때 사용한다.
argument-hint: "<작업 폴더 docs/minipowers/<stem>/>"
disable-model-invocation: true
---

# spec-review

spec을 기준으로 리뷰하고 `findings.md`를 쓴다. 리뷰 대상은 spec이 아니라 구현이다.

사용자가 새 독립 세션에서 시작한다. 구현 세션과 다른 모델, effort, LLM을 사용해도 된다. 이 스킬은 모델이나 effort를 지정하지 않으며, 리뷰를 subagent로 자동 위임하지 않는다. 파일 읽기, git, 프로젝트 테스트 실행, findings.md 작성과 커밋이 가능한 환경에서 진행한다.

## 독립 세션과 입력 계약

- **context 0**은 이전 설계·구현·리뷰 대화의 이력, 요약, 메모리를 넘겨받지 않은 상태를 뜻한다. 현재 세션의 시스템 지침, 이 스킬, 프로젝트 지시 파일까지 없다는 뜻은 아니다.
- 사용자는 사용할 모델과 effort를 선택한 새 세션에서 이 스킬과 작업 폴더 경로를 전달한다. Claude Code에서는 새 세션에서 `/spec-review <작업 폴더>`를 호출한다. 다른 LLM에서도 이 문서와 참조 파일을 읽고 같은 절차를 수행할 수 있어야 한다.
- 판단에 필요한 맥락은 디스크에서 다시 읽는다. 유효 spec(spec.md와 amendment), progress.md, 기존 findings.md, 프로젝트 지시 파일, 코드베이스, git 이력·diff, 이번에 실행한 테스트 결과가 근거다. 대화에서만 합의한 내용은 요구사항이나 완료 증거로 쓰지 않는다. 추가 리뷰 기준은 승인된 spec 또는 amendment에 기록한다.
- 재리뷰도 새 독립 세션에서 시작할 수 있다. 이전 리뷰어의 기억 대신 findings.md의 범위·항목·회차와 progress.md의 수정·반박 기록을 읽는다. 기록의 주장은 현재 코드와 대조한다.
- 구현 대화가 남아 있는 세션에서 호출되었음을 알면, 새 세션에서 같은 작업 폴더로 실행하도록 안내하고 끝낸다. 이 스킬의 지시만으로 기존 대화 이력을 지우거나 context 0을 보장할 수는 없다.

설계에 관한 질문은 하지 않는다. 파일 누락과 정지 조건은 공용 규약과 아래 절차를 따른다.

## 시작

1. 이 SKILL.md가 있는 디렉터리를 기준으로 `../_shared/conventions.md`와 `./findings-template.md`를 읽는다. 상대경로는 프로젝트의 현재 작업 디렉터리 기준이 아니다. 공용 규약의 스킬 파일 경로도 같은 설치 위치를 기준으로 해석한다. 이 문서가 반복하지 않는 공용 규칙은 그 문서를 따른다.
2. 사용자가 전달한 작업 폴더 경로를 conventions.md의 "인자 해석"대로 해석한다. 이하 `<폴더>`, 폴더 이름을 `<stem>`이라 부른다.
3. `<폴더>/spec.md`의 위치를 찾는다. 새 세션을 메인 체크아웃에서 열었다면, 승인된 spec이 메인 체크아웃에 없고 `.worktrees/<stem>`에만 있을 수 있다.
   - 현재 체크아웃에 `<폴더>/spec.md`가 있으면 그것을 읽는다.
   - 없으면 메인 체크아웃 루트(conventions.md "폴더 구조"의 명령으로 얻는다)의 `.worktrees/<stem>/<폴더>/spec.md`가 있으면 그것을 읽는다.
   - 둘 다 없으면 conventions.md "인자 해석"대로 안내하고 끝낸다. `findings.md`는 쓰지 않는다.
4. 3에서 찾은 spec.md와 같은 폴더의 `amendment-<N>.md`(있으면), `progress.md`, 기존 `findings.md`(있으면)를 읽는다. `amendment-<N>.md`가 있으면 conventions.md `## 유효 spec`대로 유효 spec을 만든다. 이하 "수용 기준", "리뷰 기준", "구현 슬라이스"는 유효 spec의 것을 쓴다. `progress.md`가 없으면 "구현 기록 없음"으로 보고 계속한다.
5. spec 머리말에서 세 값을 얻는다. 값을 감싼 백틱과 뒤의 괄호 설명은 떼고 읽는다. 머리말은 amendment로 개정하지 않으므로 spec.md 그대로 읽는다.
   - 기준 커밋: `- 기준 커밋: <sha>` 줄
   - 브랜치: `- 브랜치:` 줄
   - 전체 테스트 명령: `- 전체 테스트 명령:` 줄
6. 작업 위치를 정한다. 현재 브랜치(`git rev-parse --abbrev-ref HEAD`)가 spec의 브랜치이면 그 자리에서 리뷰한다. 아니면 메인 체크아웃 루트의 `.worktrees/<stem>`이 있고 그 안의 브랜치가 spec의 브랜치이면, 이하 모든 git 명령과 파일 읽기를 그 안에서(`git -C <경로>`) 한다. 둘 다 아니면 현재 브랜치와 spec의 브랜치를 보고하고 끝낸다. `findings.md`는 쓰지 않는다. spec의 브랜치가 아닌 곳에서 `<기준 커밋>..HEAD`는 다른 작업의 커밋을 담기 때문이다.

7. 6에서 정한 작업 위치의 프로젝트 지시 파일(AGENTS.md, CLAUDE.md 등)과 리뷰 대상 경로에 적용되는 지침을 읽는다. 이전 세션에서 읽었다고 가정하지 않는다. 현재 실행 환경의 지침 우선순위를 따른다.

## 모드 결정

- 작업 폴더에 `findings.md` 파일이 있으면 **재리뷰 모드**다.
- `findings.md` 파일이 없으면 **전체 리뷰 모드**다.

처음부터 다시 리뷰하려면 사용자가 `findings.md`를 지우고 부른다.

## 공통 원칙

- 발견한 문제는 모두 보고한다. 어느 것을 고칠지는 심각도 분류가 가린다.
- progress.md의 기록은 검증되지 않은 주장이다. 코드를 그 자체로 판단하고, 심각도도 코드만 보고 정한다.
- diff 밖의 코드는 spec의 `## 리뷰 기준`이 가리키는 곳과, 이름 붙일 수 있는 위험(바뀐 함수의 호출부, 공유 상태, API 계약)이 있는 곳만 본다. 무엇을 왜 봤는지 finding이나 리뷰 기준 대조 표에 적는다.
- diff가 커서 한 번에 읽을 수 없으면 `git diff <기준 커밋>..HEAD -- <경로>`로 파일별로 나눠 읽는다.
- 코딩 규칙, 테스트 위치, 커밋 메시지 형식은 프로젝트 지시 파일이 정한다. 지시 파일의 규칙 위반도 finding이다.
- 이 스킬이 쓰는 파일은 `findings.md` 하나다.
- 병합, push, Pull Request 생성을 하지 않는다.

## 심각도

- **Critical**: 동작이 틀리거나 데이터가 깨진다.
- **Important**: 고치기 전에는 믿을 수 없다. 다음이 여기 속한다.
  - 빠진 요구사항
  - 삼킨 에러
  - 아무것도 단언하지 않는 테스트
  - spec의 `## 리뷰 기준`이 지적하는 위반(리뷰 기준이 심각도를 따로 정했으면 그 심각도)
  - 결정 1의 TDD 증거 위반: 슬라이스에 `슬라이스 N: RED ...`도 `슬라이스 N: RED 없음 — ...`도 없거나, `RED 없음`인데 그 슬라이스의 diff가 테스트를 두는 곳의 코드를 바꾼 경우(이전 형식 progress.md는 제외)
- **Minor**: 다듬기. 테스트 범위를 넓힐 여지, 이름, 중복 등.

## 전체 리뷰 모드

### 1. diff 범위 확인

```bash
git merge-base --is-ancestor <기준 커밋> HEAD
```

종료 코드가 0이 아니면 HEAD가 기준 커밋의 자손이 아니다. 리뷰하지 않고 그 사실과 두 커밋의 sha를 보고하고 끝낸다. `findings.md`는 쓰지 않는다.

`git status --short`가 비어 있지 않으면 커밋되지 않은 변경은 리뷰 대상이 아니라고 findings.md 머리말에 적는다.

```bash
git rev-parse HEAD
git log --oneline <기준 커밋>..HEAD
git diff --stat <기준 커밋>..HEAD
git diff <기준 커밋>..HEAD
```

### 2. 읽는 순서

1. 유효 spec의 `## 수용 기준`과 `## 리뷰 기준`
2. 유효 spec의 `## 구현 슬라이스`에서 슬라이스별 Files와 완료 판정
3. progress.md의 다음 줄
   - 머리말의 `- 기준 테스트:` 줄(있으면)
   - `Ruling:`으로 시작하는 줄
   - `슬라이스 N: RED <테스트 이름> — <실패 요지 한 줄>` 또는 `슬라이스 N: RED 없음 — <테스트를 두지 않는 이유 한 줄>`
   - `finding <ID>: 반박 — <근거 file:line>`
   - `슬라이스 N: minor(deferred): <한 줄>`
   - `슬라이스 N: parked — <finding> — Ruling: <근거>`
   - `완료: head <sha>`
4. diff 전체

### 3. TDD 증거와 기준 테스트 확인

progress.md 머리말에 `- 기준 테스트:` 줄이 있으면 이 개선 뒤에 쓴 것이다. 없으면 **이전 형식 progress.md**이고, 아래 RED 검사를 건너뛴다.

- **RED 검사(이전 형식 제외)**: 슬라이스마다 `슬라이스 N: RED <테스트 이름> — <실패 요지 한 줄>` 또는 `슬라이스 N: RED 없음 — <테스트를 두지 않는 이유 한 줄>` 줄이 progress.md에 있는지 본다. 둘 다 없으면 Important다. `RED 없음`인데 그 슬라이스의 diff가 테스트를 두는 곳의 코드를 바꿨으면 그것도 Important다.
- **기존 실패**: `- 기준 테스트:` 줄의 실패 목록을 findings.md 머리말 `- 기존 실패: <목록 또는 없음>`에 그대로 옮긴다. 6단계에서 전체 테스트를 돌린 뒤, 이 목록에 있는 테스트가 다시 실패해도 finding으로 올리지 않는다.
- 이전 형식이면 findings.md 머리말에 `- 기존 실패: 기록 없음(이전 형식 progress.md)`라고 쓴다. 이 경우 6단계에서 실패한 테스트는 제외 없이 모두 finding이다.

### 4. 구현 요약

`findings-template.md`의 `## 구현 요약` 절을 먼저 채운다.

- **바뀐 파일**: `git diff --stat`의 파일마다 생성/변경/삭제와 역할 한 줄.
- **수용 기준별 구현 위치**: 수용 기준마다 구현한 `file:line`과 그것을 검증하는 테스트.
- **동작 흐름**: 수용 기준 하나당 3~5줄. 사용자 행동 → 진입점 → 거치는 계층 → 저장 또는 응답.

이 표를 채우면서 요구사항 대조를 한다. 결과는 Findings에 태그를 붙여 올린다.

- `[Missing]`: 수용 기준이나 슬라이스 Files에 있는데 구현이 없다. progress.md에 했다고 적혔지만 코드에 없는 것도 여기 속한다. Important 이상이다.
- `[Extra]`: 요청에 없는 기능, 과설계, spec이 바꾸지 않는다고 적은 곳의 변경.
- `[Misunderstood]`: 맞는 기능을 틀린 방식으로 만들었거나 다른 문제를 풀었다.

### 5. Findings

- 항목마다 위치(`file:line`), 무엇, 왜, 어떻게를 쓴다.
- 항목은 해당 심각도 절(`### Critical`, `### Important`, `### Minor`) 아래에 두고, 제목은 `#### C1`, `#### I1`, `#### M1`처럼 한 단계 낮은 제목에 심각도 머리글자와 번호로 시작한다. 번호는 findings.md 전체에서 심각도별로 이어진다.
- spec의 `## 리뷰 기준`이 명시한 검사 항목은 하나씩 확인한 곳과 결과를 "리뷰 기준 대조" 표에 적는다. 위반이 없는 항목도 확인한 곳을 적는다.
- progress.md의 `minor(deferred)`, `parked`, `슬라이스 N: withdrawn — <finding 한 줄> — <근거 file:line>` 줄은 지금 코드에서 다시 보고, "progress.md 이월 항목" 표에 상태를 적는다. 병합 전에 고쳐야 하는 것은 심각도에 맞게 finding으로 올린다.
- 슬라이스 리뷰에서 이미 본 부분도 다시 본다. 이 리뷰는 브랜치 전체를 한 번에 보는 리뷰다.

### 6. 테스트

spec 머리말의 전체 테스트 명령을 한 번 돌린다. 출력의 마지막 부분(통과·실패 수가 보이는 줄)을 `## Verdict` 절에 붙인다. 테스트가 실패하면 실패한 테스트마다 Critical 또는 Important finding이다. 단, 3단계에서 findings.md 머리말에 적은 `- 기존 실패:` 목록에 있는 테스트는 제외한다.

### 7. Verdict

- Critical과 Important가 없으면: `Verdict: ready to merge (<HEAD sha>)`
- 있으면: `Verdict: needs fixes — <Critical·Important 번호 목록>` (예: `Verdict: needs fixes — C1, I2, I3`)

`<HEAD sha>`는 1단계에서 얻은 40자 sha다. Verdict 줄 형식은 이 둘뿐이다.

### 8. findings.md 쓰기

`findings-template.md`의 `---` 선 위까지를 작업 폴더의 `findings.md`로 쓴다. 절 제목과 `Verdict:` 줄 형식은 템플릿 그대로 둔다. spec-implement 수정 모드와 spec-digest가 이 문자열로 파싱한다.

`## Verdict` 절의 마지막 줄에 다음 단계 하나를 쓴다.

- needs fixes: 다음 단계: `/spec-implement <폴더>` (수정 모드)
- ready to merge: 다음 단계: `/spec-digest <폴더>`, 그 뒤 프로젝트 규칙대로 PR

`findings.md` 한 파일만 커밋한다. 커밋 메시지는 프로젝트 지시 파일의 형식을 따른다. `Verdict:`의 sha는 이 커밋 이전의 HEAD, 곧 리뷰한 코드의 HEAD이고, 그 뒤에는 findings.md 커밋만 있다.

## 재리뷰 모드

### 1. 회차와 범위

- `## Verdict` 절에 `Rounds: 2/2` 줄이 있으면 남은 항목은 사용자가 판정할 차례다. 리뷰 대신 그 절의 판정과 남은 항목을 보고하고 끝낸다. 사용자가 고칠 항목을 정해 spec-implement로 고친 뒤에는 그 줄을 지우고 다시 부른다. 그러면 라운드 수는 3 이상이 되고 아래 절차를 그대로 따른다.
- 이전 리뷰의 HEAD는 마지막 재리뷰 절의 `- 범위:` 줄 오른쪽 sha, 재리뷰 절이 없으면 첫 줄 제목의 `(<기준 커밋>..<HEAD>)` 오른쪽 sha다.

```bash
git merge-base --is-ancestor <이전 HEAD> HEAD
git log --oneline <이전 HEAD>..HEAD
git diff --stat <이전 HEAD>..HEAD
git diff <이전 HEAD>..HEAD
git log --oneline <이전 HEAD>..HEAD -- <폴더>/amendment-*.md
```

`--is-ancestor`의 종료 코드가 0이 아니면 이력이 다시 쓰인 것이다. 재리뷰하지 않고 그 사실을 보고하고 끝낸다.

마지막 명령의 결과가 비어 있지 않으면 이번 범위에 amendment 커밋이 있다. 이 경우 이번 재리뷰는 **개정 재리뷰**다. 개정 재리뷰는 amendment가 추가하거나 바꾼 슬라이스를 처음 보는 리뷰다.

회차는 두 값으로 센다.

- 제목 번호 R: findings.md에 있는 `## 재리뷰` 절 전체의 개수에 1을 더한 값이다. 절 제목은 `## 재리뷰 R`이고, 개정 재리뷰면 `## 재리뷰 R (개정)`이다.
- 라운드 수: 제목에 `(개정)`이 붙지 않은 `## 재리뷰` 절의 개수다. 이번이 개정 재리뷰가 아니면 1을 더한다. 개정 재리뷰는 수정 라운드가 아니므로 세지 않는다. 6단계의 `Rounds:` 줄은 이 값으로 정한다.

### 2. 판정할 항목

`## Findings`와 이전 재리뷰 절에서 제목에 `— ADDRESSED` 또는 `— WITHDRAWN`이 붙지 않은 `#### C<n>`, `#### I<n>`, `#### M<n>` 항목이 대상이다. Minor도 판정하되, Verdict 계산에는 Critical과 Important만 쓴다.

항목마다 progress.md의 `finding <ID>: <sha>` 줄(예: `finding I1: a1b2c3d`)에서 수정 커밋을 찾는다. 줄이 없으면 수정 커밋 칸에 "없음"이라고 쓰고 판정은 코드로 한다.

progress.md에 `finding <ID>: 반박 — <근거 file:line>` 줄이 있는 항목은 3단계의 반박 판정을 먼저 따른다.

### 3. ADDRESSED / WITHDRAWN 판정

- 지적한 결함이 지금 코드에서 사라졌으면 ADDRESSED다.
- 수정을 시도했지만 결함이 남았으면 NOT ADDRESSED다.
- progress.md에 `finding <ID>: 반박 —` 줄이 있으면 그 줄의 `<근거 file:line>`을 코드로 확인한다.
  - 근거가 맞으면(지적이 틀렸으면) WITHDRAWN이다.
  - 근거가 틀리면(지적이 맞으면) NOT ADDRESSED다.
- 근거가 되는 `file:line`을 적는다.

ADDRESSED인 항목은 그 finding의 원래 제목 뒤에 `— ADDRESSED (<수정 커밋 sha>)`를 붙인다. 예: `#### I1 [Missing] 빈 입력 처리 없음 — ADDRESSED (a1b2c3d)`. WITHDRAWN인 항목은 원래 제목 뒤에 `— WITHDRAWN (<근거 file:line>)`을 붙인다. 예: `#### I2 [Misunderstood] 잘못된 검증 — WITHDRAWN (path/to/file.ts:30)`. 제목 외의 기존 내용은 그대로 둔다.

제목에 `— ADDRESSED` 또는 `— WITHDRAWN`이 붙은 항목은 이후 회차에서 판정 대상이 아니다. Verdict 계산에서 WITHDRAWN은 남은 항목이 아니다.

### 4. 새로 깨뜨린 것

수정 diff(`<이전 HEAD>..HEAD`)가 건드린 코드만 본다. 그 diff가 새로 깨뜨린 것을 재리뷰 절의 `### 새로 깨뜨린 것` 아래에 새 finding으로 덧붙인다. 번호는 파일 전체에서 이어진다.

spec 머리말의 전체 테스트 명령을 한 번 돌리고 출력의 마지막 부분을 새 `## Verdict` 절에 붙인다. findings.md 머리말의 `- 기존 실패:` 목록에 있는 테스트가 이번에도 실패해도 finding으로 올리지 않는다.

### 5. 개정 대조

개정 재리뷰가 아니면 `### 개정 대조` 소절에 "없음"이라고 쓰고 넘어간다.

개정 재리뷰면 이번 범위에 커밋된 amendment를 읽는다. 그 amendment에 `### 슬라이스 N:` 블록이 있는 슬라이스가 **개정 슬라이스**다. 개정 슬라이스는 이번에 처음 리뷰하므로 4단계의 "새로 깨뜨린 것"만으로는 부족하다. 개정 슬라이스와 개정된 절에 전체 리뷰의 검사를 적용한다.

1. **범위.** 개정 슬라이스마다 progress.md의 `슬라이스 N: complete (commits <a>..<b>)` 줄에서 커밋 범위를 얻는다. 줄이 없으면 `[Missing]` finding이다.
2. **요구사항 대조.** 개정 슬라이스마다 Files의 파일에 해당하는 hunk가 `<a>..<b>`에 있는지, 완료 판정을 충족하는지 본다. 전체 리뷰 4단계의 `[Missing]`, `[Extra]`, `[Misunderstood]` 기준을 쓴다.
3. **RED 검사.** 개정 슬라이스마다 전체 리뷰 3단계의 RED 검사를 한다. 이전 형식 progress.md면 건너뛴다.
4. **품질.** 개정 슬라이스의 `<a>..<b>` diff를 이 문서의 공통 원칙과 심각도 기준으로 본다.
5. **개정된 수용 기준과 리뷰 기준.** amendment가 `## 수용 기준`을 바꿨으면, 바뀐 절의 항목마다 구현 위치 `file:line`과 검증한 테스트를 지금 코드에서 찾는다. amendment가 `## 리뷰 기준`을 바꿨으면, 그 항목마다 확인한 곳과 결과를 적는다. 둘 다 `### 개정 대조` 소절에 표로 쓴다.

찾은 것은 `### 개정 대조` 소절에 새 finding으로 적는다. 태그는 요구사항 대조에서 나온 것에만 `[Missing]`, `[Extra]`, `[Misunderstood]` 중 하나를 붙이고, 번호는 파일 전체에서 이어진다.

### 6. 재리뷰 절과 Verdict 쓰기

`findings.md` 끝에 템플릿의 `## 재리뷰 R` 형식으로 절을 덧붙인다. 개정 재리뷰면 제목은 `## 재리뷰 R (개정)`이다. 이 절에는 항목별 ADDRESSED / WITHDRAWN / NOT ADDRESSED, 새로 깨뜨린 것, 개정 대조만 적고 `Verdict:` 줄은 `## Verdict` 절에만 둔다. 기존 절은 그대로 둔다.

`## Verdict` 절이 유일한 현재 판정이다. 재리뷰 때 그 절의 내용을 새 판정으로 교체한다. 다른 스킬이 `## Verdict` 절 하나만 읽으면 되게 하려는 것이다.

- 남은 Critical·Important가 없으면: `Verdict: ready to merge (<HEAD sha>)`
- 남아 있으면: `Verdict: needs fixes — <남은 번호 목록>`
- 남아 있고, 개정 재리뷰가 아니고, 라운드 수가 2 이상이면: `needs fixes` 줄 바로 아래에 `Rounds: 2/2 — 남은 항목은 사용자가 판정한다` 한 줄을 덧붙인다. 줄의 문자열은 라운드 수와 관계없이 이것 하나다. 개정 재리뷰에서는 이 줄을 붙이지 않는다. 개정 슬라이스의 지적이 수정 라운드를 한 번도 거치지 않고 사용자 판정으로 넘어가지 않게 하려는 것이다.

`## Verdict` 절의 마지막 줄에 다음 단계 하나를 쓴다.

- needs fixes이고 `Rounds:` 줄이 없으면: 다음 단계: `/spec-implement <폴더>` (수정 모드)
- needs fixes이고 `Rounds:` 줄이 있으면: 다음 단계: 남은 항목을 사용자가 판정한다
- ready to merge: 다음 단계: `/spec-digest <폴더>`, 그 뒤 프로젝트 규칙대로 PR

전체 리뷰 모드 8단계처럼 `findings.md` 한 파일만 커밋한다.

## 마무리 보고

- 모드와 회차(제목 번호 R, 라운드 수, 개정 재리뷰 여부)
- 리뷰 범위(`<시작 sha>..<HEAD sha>`)
- `Verdict:` 줄
- Critical · Important 번호와 한 줄 제목
- 전체 테스트 결과 한 줄

마지막 줄은 `## Verdict` 절의 다음 단계 줄과 같다.
