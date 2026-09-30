---
name: spec-implement
description: 승인된 spec 작업 폴더(docs/minipowers/<stem>/)를 feature 브랜치에서 슬라이스 단위로 구현하거나 findings.md의 지적을 고친다.
argument-hint: "<작업 폴더 docs/minipowers/<stem>/>"
disable-model-invocation: true
---

# spec-implement — spec 하나를 슬라이스 단위로 구현한다

유효 spec을 계약서로 삼아 브랜치 안에서 코드를 쓰고 슬라이스마다 커밋하고, 진행을 `progress.md`에 남긴다. 입력은 spec.md와 amendment, 프로젝트 지시 파일, 소스코드뿐이다.

## 시작

1. `${CLAUDE_PLUGIN_ROOT}/skills/_shared/conventions.md`를 읽는다. 네 스킬이 공유하는 규칙(인자 해석, 폴더 구조, 유효 spec, 정지 조건, gitignore 처리, 증거 규칙, 스킬 파일 경로)은 거기 있고, 이 문서는 그것을 가리키기만 한다.
2. 인자를 작업 폴더로 해석한다. 이하 `<폴더>`는 `docs/minipowers/<stem>/`, `<stem>`은 폴더 이름이다.
3. spec.md를 찾는다. spec은 병합 전까지 feature 브랜치에만 있고, 그 브랜치는 대개 메인 체크아웃에 checkout되어 있다(spec-design이 승인 때 전환한다). conventions.md "인자 해석"의 순서(현재 체크아웃 → 다른 체크아웃 → 로컬 브랜치)로 찾는다.
   - 어느 브랜치에만 있고 checkout된 곳이 없으면 `git show <브랜치>:<prefix>docs/minipowers/<stem>/spec.md`로 머리말의 `- 브랜치:` 값을 읽어 찾은 브랜치와 같은지 확인한다. 다르면 두 이름을 보고하고 끝낸다. 같아도 worktree를 만들거나 브랜치를 전환하지 않는다. conventions.md "인자 해석"의 안내 문구(`git switch <브랜치>` 또는 `git worktree add`)를 쓰고 끝낸다.
   - 여럿이면 브랜치 목록을 보고하고 끝낸다.
   - 없으면 conventions.md "인자 해석"대로 안내하고 끝낸다.

   spec.md를 전부 읽는다. 머리말의 `- 기준 커밋:`과 `- 브랜치:` 줄에서 값을 얻는다. 값을 감싼 백틱과 뒤의 괄호 설명은 떼고 읽는다. 모드 결정에서 읽는 progress.md와 findings.md, 4의 amendment도 spec.md를 찾은 폴더의 것을 읽는다. 여기서는 파일을 읽을 곳만 찾는다. 작업 위치는 구현 모드와 수정 모드 모두 "작업 공간과 기준 커밋 확인"이 정하고, 그 뒤로는 작업 위치의 파일을 쓴다.
4. `<폴더>`에 `amendment-<N>.md`가 있으면 conventions.md `## 유효 spec`대로 spec.md에 겹쳐 유효 spec을 만든다. 이하 spec을 읽는 곳은 모두 유효 spec을 읽는다. 머리말은 spec.md의 것 그대로다.
5. 프로젝트 지시 파일(CLAUDE.md, AGENTS.md 등)에서 전체 테스트 명령, 테스트 위치, 코딩 규칙, 준비 명령(의존성 설치 등), worktree 복사 목록(`minipowers worktree 복사:` 줄), worktree 포함 목록(`minipowers worktree 포함:` 줄)을 찾는다. spec 머리말의 전체 테스트 명령과 다르면 spec 머리말을 쓴다.
6. 스크립트는 `bash ${CLAUDE_SKILL_DIR}/scripts/<name> ...`으로 부른다. `${CLAUDE_SKILL_DIR}`는 Claude Code가 이 SKILL.md가 있는 폴더의 절대경로로 치환한다. 보조 문서(orchestrator.md, implementer-prompt.md, reviewer-prompt.md)도 같은 폴더에 있다.

## 모드 결정

위에서부터 처음 성립하는 것 하나다. findings.md의 현재 판정은 `## Verdict` 절 하나에만 있으므로 그 절만 읽는다.

- `<폴더>/findings.md`가 있고 `## Verdict` 절에 `Rounds: 2/2` 줄이 있으면 남은 항목은 사용자가 판정할 차례다. 수정 모드로 들어가지 않고 `Verdict:` 줄의 목록을 보고하고 끝낸다. 마지막 줄은 "다음 단계: 고칠 항목을 정한 뒤 findings.md `## Verdict` 절의 `Rounds:` 줄을 지우고 `/spec-implement <폴더>`를 다시 호출한다"이다.
- 유효 spec `## 구현 슬라이스` 절의 `### 슬라이스 N:`(코드 펜스 안의 제목은 치지 않는다, slice-brief와 같은 규칙) 가운데 progress.md에 `슬라이스 N: complete` 줄이 없는 슬라이스가 있으면 **구현 모드**다. progress.md가 없으면 모든 슬라이스가 여기 해당한다. `완료: head` 뒤에 amendment가 슬라이스를 추가한 경우도 여기서 구현 모드로 이어 간다.
- `<폴더>/findings.md`가 있고, `## Verdict` 절의 `Verdict:` 줄이 `Verdict: needs fixes`로 시작하면 **수정 모드**다. 고칠 항목은 그 줄의 `— ` 뒤 목록(예: `I1, I3`)이다.
- `<폴더>/progress.md`에 `완료: head` 줄이 있으면 구현이 끝난 것이다. 할 일이 없다고 보고하고 끝낸다. 마지막 줄은 findings.md가 없으면 `다음 단계: /spec-review <폴더>`, 있으면 `다음 단계: /spec-digest <폴더>`다.
- 그 밖에는 **구현 모드**다.

## 구현 모드

### 작업 공간과 기준 커밋 확인

1. 현재 체크아웃의 브랜치가 spec의 브랜치이면 현재 체크아웃의 프로젝트 루트에서 작업한다. spec-design이 승인 때 메인 체크아웃을 전환해 두므로 보통 여기다.
2. 아니면 `git worktree list --porcelain`에서 `branch refs/heads/<spec의 브랜치>` 줄이 붙은 체크아웃을 찾는다. 있으면 그 `<체크아웃 경로>/<prefix>`에서 작업한다. 사용자가 spec 브랜치를 직접 worktree로 checkout해 둔 경우다.
3. 둘 다 아니고 브랜치가 있으면 worktree를 만들거나 브랜치를 전환하지 않는다. conventions.md "인자 해석"의 안내 문구(`git switch <브랜치>` 또는 `git worktree add`)를 쓰고 끝낸다.
4. 브랜치가 없으면 spec-design이 승인 단계를 끝내지 않은 것이다. 그렇게 안내하고 끝낸다.
5. `git merge-base --is-ancestor <기준 커밋> HEAD`가 실패하면 progress.md에 `spec 결함:` 줄을 적고 사용자에게 보고하고 끝낸다.
6. `git diff --name-only <기준 커밋> HEAD`에 `<폴더>` 밖의 파일이 있고, progress.md에 `슬라이스 N: complete` 줄이 하나도 없으면, HEAD가 기준 커밋에서 움직인 것이다. 유효 spec의 `## 검증된 전제` 절 항목을 하나씩 적힌 방법으로 다시 확인한다. 하나라도 틀리면 progress.md에 `spec 결함:` 줄로 적고 사용자에게 보고하고 끝낸다. `슬라이스 N: complete` 줄이 하나라도 있으면 이 확인을 건너뛴다. 끝난 슬라이스의 커밋이 전제를 바꾼 것이기 때문이다.

이하 파일 읽기, 쓰기, 명령, 커밋은 모두 정한 작업 위치에서 한다. 1~2의 작업 위치는 spec의 브랜치를 checkout한 프로젝트 루트다. 한 브랜치는 한 체크아웃에만 있으므로 "시작" 3에서 spec.md를 찾은 폴더와 대개 같다. 다르면(예: 병합 뒤 기반 브랜치에 남은 같은 폴더를 먼저 찾은 경우) 작업 위치의 spec.md, amendment, progress.md, findings.md로 다시 읽고 모드 결정을 다시 한다.

### 이어서 하기

`progress.md`가 있으면 이전 세션이 진행하던 작업이다. `슬라이스 N: complete` 줄이 있는 슬라이스는 건너뛰고 다음 슬라이스부터 이어 간다. 기억보다 progress.md와 `git log`를 믿는다.

### 실행 방식

유효 spec의 `## 구현 슬라이스` 절에서 `### 슬라이스 N: 이름` 제목마다 Files와 Consumes/Produces를 읽어 의존 관계를 만든다.

- 슬라이스 B의 Consumes에 슬라이스 A의 Produces가 있으면 B는 A 뒤에 온다.
- 두 슬라이스의 Files에 같은 파일이 있으면 spec에서 뒤에 적힌 슬라이스가 앞의 것 뒤에 온다.

실행 방식은 두 조건으로 정한다.

- subagent를 띄우는 도구(Claude Code의 Agent 도구)가 있고, 서로 의존하지 않는 슬라이스가 둘 이상이면 **orchestrator** 방식이다. [orchestrator.md](orchestrator.md)를 읽는다. 아래 "준비와 기준 테스트"를 끝낸 뒤 그 문서의 절차대로 진행한다.
- 둘 중 하나라도 아니면 **inline** 방식이다.

정한 방식은 progress.md 머리말의 `- 실행 방식:` 줄에 근거와 함께 적는다. 머리말은 아래 "준비와 기준 테스트"에서 쓴다.

### 준비와 기준 테스트

progress.md가 없을 때만 한다. 실행 방식을 정한 직후, 첫 슬라이스를 시작하기 전이다. inline과 orchestrator 공통이다. progress.md가 이미 있으면(이전 세션을 이어받으면) 준비도 기준 테스트도 다시 하지 않는다.

1. 작업 위치에서 conventions.md "worktree 준비"를 한다. 작업 위치가 메인 체크아웃이면(보통 그렇다) 준비 명령만 돌리고 sparse-checkout과 파일 복사는 건너뛴다. 작업 위치가 사용자가 만든 worktree이면 파일 복사와 준비 명령을 한다.
2. spec 머리말의 전체 테스트 명령을 한 번 돌린다. 이것이 기준 테스트다. 여기서 나온 실패는 구현을 시작하기 전 HEAD에서 이미 있던 것이므로 고치지 않는다.
3. 기준 테스트의 실패가 worktree에 없는 파일 때문이면 기존 실패로 기록하지 않는다. conventions.md "worktree 준비"의 마지막 문단대로 멈춘다. 이때 progress.md 머리말을 쓰지 않으므로, 사용자가 파일을 채운 뒤 다시 부르면 1부터 다시 한다.
4. progress.md 머리말 전체를 아래 "progress.md 형식"대로 쓴다. `- 준비:` 줄에는 1에서 복사한 경로와 돌린 명령을, `- 기준 테스트:` 줄에는 2의 결과를 적는다. orchestrator 방식이면 `- 묶음:` 줄은 orchestrator.md "실행 순서"대로 정한다.

### inline 방식

에이전트 하나가 슬라이스를 spec에 적힌 순서대로 구현한다. subagent를 띄우지 않으므로 슬라이스의 `- 모델:` 줄은 쓰지 않는다.

1. 슬라이스를 시작하기 직전의 커밋을 BASE로 기록한다.
2. 슬라이스의 Files를 아래 TDD 순서로 구현한다. RED 출력을 본 직후 테스트마다 progress.md에 `슬라이스 N: RED <테스트 이름> — <실패 요지 한 줄>`을 적는다. 슬라이스의 Files가 모두 테스트를 두지 않는 곳이면 `슬라이스 N: RED 없음 — <테스트를 두지 않는 이유 한 줄>`을 한 줄 적는다.
3. 슬라이스의 완료 판정을 명령으로 확인한다.
4. 슬라이스의 파일을 경로로 지정해 스테이징하고 커밋한다. progress.md는 이 커밋에 넣지 않는다. 슬라이스 하나가 커밋 하나다.
5. progress.md에 `슬라이스 N: complete (commits <BASE>..<끝 커밋>)`을 적고, progress.md만 스테이징해 따로 커밋한다. 2의 RED 줄도 이 커밋에 들어간다. 다음 슬라이스의 BASE는 이 커밋이다.

슬라이스 리뷰 없이 완료 판정만 확인한다. 리뷰는 spec-review가 브랜치 전체를 대상으로 한다.

### TDD (inline과 orchestrator 공통)

테스트를 두는 곳의 코드는 다음 순서로 쓴다.

1. 바꿀 동작을 검증하는 테스트를 먼저 쓴다.
2. 돌려서 실패하는 출력을 본다. 이것이 RED 증거다.
3. 테스트를 통과시키는 최소한의 구현을 한다.
4. 돌려서 통과하는 출력을 본다. 이것이 GREEN 증거다.
5. 정리하고 다시 돌린다.

테스트의 위치와 명령은 프로젝트 지시 파일이 정한다. 테스트를 두지 않는 곳의 코드는 테스트 없이 구현하고, 그 경우 순서는 자유다. 작업 중에는 관련 테스트만 돌리고 슬라이스를 커밋하기 전에 전체 테스트를 돌린다. 명령은 포그라운드로 돌린다.

RED 증거는 슬라이스마다 progress.md에 `슬라이스 N: RED` 줄로 남는다. inline 방식은 위 2에서 직접 적고, orchestrator 방식은 컨트롤러가 report에서 옮겨 적는다.

사람의 눈이나 브라우저가 필요한 확인은 그것이 의존하는 구조(DOM 관계, 설정 값 등)를 테스트로 단언해 대신한다. 그렇게 바꿀 수 없는 것은 마무리 보고의 수동 확인 항목으로 넘긴다.

### 판정과 정지 조건

설계가 모호하면 spec을 기준으로 스스로 판정하고 progress.md에 `Ruling:` 줄로 남긴 뒤 계속한다. 멈추고 사용자에게 묻는 경우는 conventions.md "정지 조건" 절의 넷(되돌릴 수 없거나 파괴적인 조작, 보안에 민감한 조작, worktree 밖으로 나가는 부작용, 어느 방향으로 가도 추측인 spec 결함)뿐이다. 넷째는 spec 결함을 보고하고 끝낸다.

## 수정 모드

1. 작업 공간은 구현 모드의 "작업 공간과 기준 커밋 확인" 1~5를 따른다. 준비, 기준 테스트, 머리말은 다시 하지 않는다.
2. `Verdict: needs fixes — ` 뒤 목록의 항목만 목록 순서대로 하나씩 처리한다. 항목의 내용은 findings.md의 `#### <ID>` 제목(예: `#### I1`) 아래에 있다. 목록에 없는 항목은 그대로 둔다.
3. 항목마다 고치기 전에 finding이 가리키는 `file:line`을 열어, 지적이 지금 코드 기준으로 맞는지 확인한다.
   - 틀렸다고 판단하면 고치지 않는다. progress.md에 `finding <ID>: 반박 — <근거 file:line>`을 적고 progress.md만 스테이징해 커밋한다.
   - 맞으면 고친다. 테스트를 두는 곳이면 finding을 재현하는 테스트로 RED를 먼저 본다.
4. finding 하나를 고칠 때마다 고친 파일을 커밋하고, progress.md에 `finding <ID>: <sha>`를 적은 뒤 progress.md만 스테이징해 따로 커밋한다. `<ID>`는 findings.md의 finding ID 그대로다(예: `finding I1: a1b2c3d`).
5. 끝나면 전체 테스트를 돌리고 보고한다. 고친 finding과 커밋 목록, 반박한 finding과 그 근거를 따로 적는다. 보고의 마지막 줄은 `다음 단계: /spec-review <폴더>`다.

findings.md는 읽기만 한다. ADDRESSED와 WITHDRAWN 판정은 spec-review가 한다.

## 마무리 (구현 모드)

1. 브랜치의 전체 테스트를 돌린다. 실패가 있으면 고치고 다시 돌린다. 단, progress.md 머리말 `- 기준 테스트:` 줄의 실패 목록에 있는 테스트는 구현을 시작하기 전 HEAD에서 이미 실패하던 것이므로 고치지 않고, 4의 "발견했지만 고치지 않은 것"에 적는다. 고칠 수 없는 실패가 남으면 그 출력을 보고에 넣는다.
2. 남은 변경을 커밋한다.
3. progress.md에 수동 확인 항목을 `수동 확인: <항목>` 줄로 하나씩 적고(4의 두 번째 항목과 같은 내용), 이어서 `완료: head <sha>`를 적고 progress.md만 스테이징해 커밋한다. `<sha>`는 2가 끝난 시점의 HEAD다. amendment가 슬라이스를 추가해 이전 `완료: head` 줄이 이미 있어도 새 줄을 하나 더 쓴다.
4. 마무리 보고를 한다. 네 가지를 넣는다.
   - 수용 기준 대조: 유효 spec의 `## 수용 기준` 항목마다 통과 또는 실패와 그 증거(명령과 출력)
   - 수동 확인 항목: 유효 spec `## 수용 기준` 절의 `- 수동 확인 항목:` 줄을 옮기고, 작업 중 테스트로 대신할 수 없던 것을 더한다. 준비의 파일 복사에서 메인 체크아웃에 없어 건너뛴 경로가 있으면 적는다. 이 스킬이 프로젝트 `.gitignore`에 줄을 추가했으면 그 사실도 적는다. 그 변경의 커밋 여부는 사용자가 정한다
   - 발견했지만 고치지 않은 것: 작업 중 발견한 기존 버그나 요청 밖 동작, 기준 테스트에서 이미 실패하던 테스트
   - Ruling 목록: progress.md의 `Ruling:` 줄 전부
5. 보고의 마지막 줄은 `다음 단계: /spec-review <폴더>`다.

병합, push, Pull Request 생성은 하지 않는다. 작업 위치는 spec 브랜치에 남는다. 슬라이스 worktree는 orchestrator가 병합할 때마다 지웠으므로 남아 있지 않다.

## progress.md 형식

spec-review와 spec-digest가 아래 문자열로 이 파일을 읽는다. 줄 형식은 아래 그대로 쓴다. `<sha>`는 7자리 short SHA다.

```markdown
# minipowers progress — spec: docs/minipowers/<stem>/spec.md

- 브랜치: <브랜치>
- 기준 커밋: <sha>
- 준비: 복사: <경로 목록 또는 없음>; 명령: <명령 또는 없음>
- 기준 테스트: <통과/실패 수 한 줄>, 실패: <테스트 이름 목록 또는 없음>
- 실행 방식: inline | orchestrator (<근거 한 줄>)
- 묶음: [1] → [2, 3] → [4]

## 기록

<아래 줄들을 일어난 순서대로 한 줄씩 덧붙인다>
```

`- 준비:` 줄은 "준비와 기준 테스트" 1에서 복사한 경로와 돌린 명령을 적는다. 해당하는 것이 없는 쪽은 `없음`이라고 적는다. orchestrator가 슬라이스 worktree를 준비할 때도 이 줄의 목록과 명령을 쓴다.

`- 기준 테스트:` 줄은 "준비와 기준 테스트" 2의 결과다. 실패가 없으면 `실패: 없음`이다. 이 줄이 없는 progress.md는 이 형식 전에 쓴 것이다.

`- 묶음:` 줄은 orchestrator 방식일 때 의존 관계로 만든 묶음 순서를 적고, inline 방식이면 `없음`이라고 적는다.

| 줄 | 쓰는 때 |
|---|---|
| `슬라이스 N: RED <테스트 이름> — <실패 요지 한 줄>` | RED 출력을 본 테스트마다 한 줄. inline 방식은 RED를 본 직후 적고, orchestrator 방식은 컨트롤러가 report의 TDD 증거를 옮겨 적는다. 그 슬라이스의 `complete` 줄과 같은 progress.md 커밋에 들어간다 |
| `슬라이스 N: RED 없음 — <테스트를 두지 않는 이유 한 줄>` | 슬라이스의 Files가 모두 테스트를 두지 않는 곳일 때 한 줄 |
| `슬라이스 N: complete (commits <a>..<b>)` | 슬라이스가 끝났을 때. `<a>`는 슬라이스 시작 직전의 커밋(BASE), `<b>`는 슬라이스의 마지막 코드 커밋이다. `git log <a>..<b>`가 그 슬라이스의 커밋이고 progress.md 커밋은 여기 들어가지 않는다 |
| `슬라이스 N: complete (commits <a>..<b>, K parked)` | 수정 라운드 뒤에 남은 finding K개를 parked로 두고 끝냈을 때 |
| `슬라이스 N: fix round R/2 (해결 X건, 남은 Y건; commits <a>..<b>)` | orchestrator의 수정 라운드 하나가 끝났을 때. 해결 X건에는 ADDRESSED와 WITHDRAWN을 함께 센다 |
| `슬라이스 N: withdrawn — <finding 한 줄> — <근거 file:line>` | orchestrator 수정 라운드의 재리뷰가 구현 subagent의 반박을 WITHDRAWN으로 판정했을 때. finding마다 한 줄 |
| `슬라이스 N: minor(deferred): <한 줄>` | 슬라이스 리뷰의 Minor, 구현 subagent가 남긴 관찰 |
| `슬라이스 N: parked — <finding> — Ruling: <근거>` | 수정 라운드 2회 뒤 남은 finding을 그대로 둘 때 |
| `Ruling: <결정> — <근거> — <틀렸다면 잘못되는 것>` | spec을 기준으로 스스로 판정했을 때 |
| `finding <ID>: <sha>` | 수정 모드에서 findings.md의 `<ID>` 항목(예: `I1`, `C2`)을 고친 커밋 |
| `finding <ID>: 반박 — <근거 file:line>` | 수정 모드에서 findings.md의 `<ID>` 항목이 지금 코드 기준으로 틀렸다고 판단해 고치지 않았을 때 |
| `묶음 W: 슬라이스 a, b 동시 시작 (base <sha>)` | orchestrator가 슬라이스 둘 이상인 묶음을 시작할 때 |
| `묶음 W: 병합 완료 (head <sha>)` | 그 묶음의 슬라이스가 전부 병합됐을 때 |
| `spec 결함: <틀린 전제 또는 항목> — <확인한 결과>` | 기준 커밋 확인이나 전제 재확인이 실패했을 때 |
| `수동 확인: <항목>` | 마무리 3에서. 사람이 확인해야 할 항목 하나마다 한 줄. spec-digest가 이 줄을 옮긴다 |
| `완료: head <sha>` | 마무리 3에서 `수동 확인:` 줄 다음. `<sha>`는 마무리 2가 끝난 시점의 HEAD다 |

progress.md는 `<폴더>` 안에 있으므로 브랜치에 커밋된다. 어느 방식이든 코드 커밋과 섞지 않고 progress.md만 스테이징해 따로 커밋한다. 줄에 적는 sha는 그 줄을 쓰기 전에 만든 커밋이므로, 커밋한 뒤에 줄을 쓰는 순서를 지키면 sha를 미리 알 필요가 없다.

- inline 방식은 슬라이스마다, 수정 모드는 finding마다 progress.md를 커밋한다.
- orchestrator 방식은 컨트롤러가 묶음이 끝날 때마다 커밋한다.
- 마무리의 `완료:` 줄은 마무리 3의 커밋에 들어간다.
