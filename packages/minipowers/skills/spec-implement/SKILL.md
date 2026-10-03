---
name: spec-implement
description: 승인된 spec 작업 폴더(docs/minipowers/<stem>/)를 feature 브랜치에서 슬라이스 단위로 구현하거나 findings.md의 지적을 고친다.
argument-hint: "<작업 폴더 docs/minipowers/<stem>/>"
disable-model-invocation: true
---

# spec-implement — spec 하나를 슬라이스 단위로 구현한다

spec을 계약서로 삼아 브랜치 안에서 코드를 쓰고 슬라이스마다 커밋하고, 진행을 `progress.md`에 남긴다. 입력은 spec.md, 프로젝트 지시 파일, 소스코드뿐이다. spec에 결함이 있어 진행할 수 없으면 spec을 고치지 않고 멈춰서, 다음 사이클의 todo를 남긴다.

## 시작

1. 이 SKILL.md가 있는 폴더를 기준으로 `../_shared/conventions.md`를 읽는다. 스킬에 딸린 파일의 상대경로는 프로젝트의 현재 작업 디렉터리 기준이 아니다. 네 스킬이 공유하는 규칙(작업 위치 결정, 폴더 구조, 정지 조건, 중단 todo, gitignore 처리, worktree 준비, 증거 규칙, 스킬 파일 경로)은 거기 있고, 이 문서는 그것을 가리키기만 한다.
2. conventions.md "작업 위치 결정"대로 `<폴더>`, spec.md, 작업 위치를 정한다. 이하 `<폴더>`는 `docs/minipowers/<stem>/`, `<stem>`은 폴더 이름이다. 작업 위치가 나오지 않으면 그 절의 문제 시나리오를 따른다. 이후 파일 읽기, 쓰기, 명령, 커밋은 모두 작업 위치에서 한다.
3. 작업 위치의 spec.md를 전부 읽는다. 머리말의 `- 기준 커밋:`과 `- 브랜치:` 값은 "작업 위치 결정"에서 읽은 것이다. 모드 결정에서 읽는 progress.md와 findings.md도 작업 위치의 것이다.
4. 프로젝트 지시 파일(CLAUDE.md, AGENTS.md 등)에서 전체 테스트 명령, 테스트 위치, 코딩 규칙, 준비 명령(의존성 설치 등), worktree 복사 목록(`minipowers worktree 복사:` 줄)을 찾는다. spec 머리말의 전체 테스트 명령과 다르면 spec 머리말을 쓴다.
5. 스크립트는 `bash "<SKILL_DIR>/scripts/<name>" ...`으로 부른다. `<SKILL_DIR>`는 conventions.md "스킬 파일 경로"대로 실제 절대경로로 바꾼다. 보조 문서(orchestrator.md, implementer-prompt.md, checker-prompt.md)와 `progress-template.md`도 같은 폴더에 있다.

## 모드 결정

위에서부터 처음 성립하는 것 하나다. findings.md의 현재 판정은 `## Verdict` 절 하나에만 있으므로 그 절만 읽는다.

- `<폴더>/findings.md`가 있고 `## Verdict` 절에 `Rounds: 2/2` 줄이 있으면 남은 항목은 사용자가 판정할 차례다. 수정 모드로 들어가지 않고 `Verdict:` 줄의 목록을 보고하고 끝낸다. 마지막 줄은 "다음 단계: 고칠 항목을 정한 뒤 findings.md `## Verdict` 절의 `Rounds:` 줄을 지우고 `/spec-implement <폴더>`를 다시 호출한다"이다.
- spec `## 구현 슬라이스` 절의 `### 슬라이스 N:`(코드 펜스 안의 제목은 치지 않는다, slice-brief와 같은 규칙) 가운데 progress.md에 `슬라이스 N: complete` 줄이 없는 슬라이스가 있으면 **구현 모드**다. progress.md가 없으면 모든 슬라이스가 여기 해당한다.
- `<폴더>/findings.md`가 있고, `## Verdict` 절의 `Verdict:` 줄이 `Verdict: needs fixes`로 시작하면 **수정 모드**다. 고칠 항목은 그 줄의 `— ` 뒤 목록(예: `I1, I3`)이다.
- `<폴더>/progress.md`에 `완료: head` 줄이 있으면 구현이 끝난 것이다. 할 일이 없다고 보고하고 끝낸다. 마지막 줄은 findings.md가 없으면 `다음 단계: /spec-review <폴더>`, 있으면 `다음 단계: /spec-digest <폴더>`다.
- 그 밖에는 **구현 모드**다.

## 구현 모드

### 기준 커밋 확인

작업 위치에서 한다.

1. `git merge-base --is-ancestor <기준 커밋> HEAD`가 실패하면 progress.md에 `spec 결함:` 줄을 적고, "spec 결함으로 멈출 때" 절대로 todo를 쓰고, 사용자에게 보고하고 끝낸다.
2. `git diff --name-only <기준 커밋> HEAD`에 `<폴더>` 밖의 파일이 있고, progress.md에 `슬라이스 N: complete` 줄이 하나도 없으면, HEAD가 기준 커밋에서 움직인 것이다. spec의 `## 검증된 전제` 절 항목을 하나씩 적힌 방법으로 다시 확인한다. 하나라도 틀리면 progress.md에 `spec 결함:` 줄로 적고, "spec 결함으로 멈출 때" 절대로 todo를 쓰고, 사용자에게 보고하고 끝낸다. `슬라이스 N: complete` 줄이 하나라도 있으면 이 확인을 건너뛴다. 끝난 슬라이스의 커밋이 전제를 바꾼 것이기 때문이다.

### 이어서 하기

`progress.md`가 있으면 이전 세션이 진행하던 작업이다. `슬라이스 N: complete` 줄이 있는 슬라이스는 건너뛰고 다음 슬라이스부터 이어 간다. 기억보다 progress.md와 `git log`를 믿는다. `슬라이스 N: blocked` 줄이 있고 그 뒤에 같은 N의 `complete` 줄이 없으면 그 슬라이스의 코드는 되돌려져 있는 것이다. 그 슬라이스를 처음부터 다시 한다. orchestrator 방식은 orchestrator.md 준비 3대로 blocked 줄의 FAIL 항목을 새 구현 subagent에게 넘긴다.

### 실행 방식

spec의 `## 구현 슬라이스` 절에서 `### 슬라이스 N: 이름` 제목마다 Files와 Consumes/Produces를 읽어 의존 관계를 만든다.

- 슬라이스 B의 Consumes에 슬라이스 A의 Produces가 있으면 B는 A 뒤에 온다.
- 두 슬라이스의 Files에 같은 파일이 있으면 spec에서 뒤에 적힌 슬라이스가 앞의 것 뒤에 온다.

실행 방식은 두 조건으로 정한다.

- subagent를 띄우는 도구(Claude Code의 Agent 도구)가 있고, 서로 의존하지 않는 슬라이스가 둘 이상이면 **orchestrator** 방식이다. [orchestrator.md](orchestrator.md)를 읽는다. 아래 "준비와 기준 테스트"를 끝낸 뒤 그 문서의 절차대로 진행한다.
- 둘 중 하나라도 아니면 **inline** 방식이다.

정한 방식은 progress.md 머리말의 `- 실행 방식:` 줄에 근거와 함께 적는다. 머리말은 아래 "준비와 기준 테스트"에서 쓴다.

### 준비와 기준 테스트

progress.md가 없을 때만 한다. 실행 방식을 정한 직후, 첫 슬라이스를 시작하기 전이다. inline과 orchestrator 공통이다. progress.md가 이미 있으면(이전 세션을 이어받으면) 준비도 기준 테스트도 다시 하지 않는다.

1. 작업 위치에서 conventions.md "worktree 준비"의 두 단계(파일 복사, 준비 명령)를 한다.
2. spec 머리말의 전체 테스트 명령을 한 번 돌린다. 이것이 기준 테스트다. 여기서 나온 실패는 구현을 시작하기 전 HEAD에서 이미 있던 것이므로 고치지 않는다.
3. 기준 테스트의 실패가 작업 위치에 없는 파일(gitignore된 설정 파일 등) 때문이면 기존 실패로 기록하지 않는다. conventions.md "worktree 준비"의 마지막 문단대로 멈춘다. 이때 progress.md 머리말을 쓰지 않으므로, 사용자가 파일을 채운 뒤 다시 부르면 1부터 다시 한다.
4. progress.md 머리말 전체를 `./progress-template.md`대로 쓴다. `- 준비:` 줄에는 복사 목록과 1에서 돌린 명령을, `- 기준 테스트:` 줄에는 2의 결과를 적는다. orchestrator 방식이면 `- 묶음:` 줄은 orchestrator.md "실행 순서"대로 정한다.

### inline 방식

에이전트 하나가 슬라이스를 spec에 적힌 순서대로 구현한다. subagent를 띄우지 않으므로 슬라이스의 `- 모델:` 줄은 쓰지 않는다.

1. 슬라이스를 시작하기 직전의 커밋을 BASE로 기록한다.
2. 슬라이스의 Files를 아래 TDD 순서로 구현한다. RED 출력을 본 직후 테스트마다 progress.md에 `슬라이스 N: RED <테스트 이름> — <실패 요지 한 줄>`을 적는다. 슬라이스의 Files가 모두 테스트를 두지 않는 곳이면 `슬라이스 N: RED 없음 — <테스트를 두지 않는 이유 한 줄>`을 한 줄 적는다.
3. 슬라이스의 완료 판정을 명령으로 확인한다.
4. 슬라이스의 파일을 경로로 지정해 스테이징하고 커밋한다. progress.md는 이 커밋에 넣지 않는다. 슬라이스 하나가 커밋 하나다.
5. progress.md에 `슬라이스 N: complete (commits <BASE>..<끝 커밋>)`을 적고, progress.md만 스테이징해 따로 커밋한다. 2의 RED 줄도 이 커밋에 들어간다. 다음 슬라이스의 BASE는 이 커밋이다.

3의 완료 판정 확인이 orchestrator 방식의 슬라이스 검사에 해당한다. 어느 방식이든 progress.md에 남는 줄은 같다. 코드 리뷰는 spec-review가 브랜치 전체를 대상으로 한다.

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

설계가 모호하면 spec을 기준으로 스스로 판정하고 progress.md에 `Ruling:` 줄로 남긴 뒤 계속한다. 멈추고 사용자에게 묻는 경우는 conventions.md "정지 조건"의 넷뿐이다. 넷째(spec 결함)는 progress.md에 `spec 결함:` 줄을 적고, "spec 결함으로 멈출 때" 절대로 todo를 쓰고, 보고하고 끝낸다. 앞의 셋에서 사용자가 허락하면 그 조작과 답을 progress.md에 `승인:` 줄로 적고 progress.md만 스테이징해 커밋한 뒤 이어 간다. 다시 부르면 progress.md에 이미 `승인:` 줄이 있는 조작은 묻지 않는다. 새 세션이 대화 없이 같은 곳에서 다시 멈추지 않게 하려는 것이다.

### spec 결함으로 멈출 때

정지 조건 4로 멈출 때마다 다음을 순서대로 하고 끝낸다. 승인된 spec.md는 고치지 않는다. 구현 모드의 "기준 커밋 확인", 판정과 정지 조건, orchestrator의 BLOCKED가 여기로 온다.

1. progress.md에 `spec 결함:` 줄이 없으면 적는다. 적은 뒤 progress.md만 스테이징해 커밋한다.
2. conventions.md "중단 todo"의 형식과 위치대로 todo를 쓴다. `끝난 것`은 progress.md의 `complete` 줄에서, `남은 것`은 spec의 슬라이스 가운데 complete가 아닌 것에서 뽑는다. `사용자가 할 일`은 끝난 것이 있으면 형식의 두 줄, 없으면 "없음"이다. 커밋하지 않는다.
3. 보고한다. 틀린 전제와 확인한 결과, 끝난 슬라이스의 커밋 목록, 쓴 todo의 경로, todo의 "사용자가 할 일" 절을 그대로 적는다. 마지막 줄은 다음 단계 하나다.
   ```
   다음 단계: todo의 "사용자가 할 일"을 정한 뒤 `/spec-design docs/minipowers/todo/<파일 이름>`
   ```

브랜치는 그대로 두고 메인 체크아웃도 옮기지 않는다. 끝난 슬라이스의 커밋은 그 브랜치에만 있고, 이어받을지는 사용자가 todo를 보고 정한다.

## 수정 모드

1. 작업 위치는 "시작"에서 정한 곳이다. 구현 모드의 "기준 커밋 확인" 1을 한다.
2. `Verdict: needs fixes — ` 뒤 목록의 항목만 목록 순서대로 하나씩 처리한다. 항목의 내용은 findings.md의 `#### <ID>` 제목(예: `#### I1`) 아래에 있다. 목록에 없는 항목은 그대로 둔다.
3. 항목마다 고치기 전에 finding이 가리키는 `file:line`을 열어, 지적이 지금 코드 기준으로 맞는지 확인한다.
   - 틀렸다고 판단하면 고치지 않는다. progress.md에 `finding <ID>: 반박 — <근거 file:line>`을 적고 progress.md만 스테이징해 커밋한다.
   - 맞으면 고친다. 테스트를 두는 곳이면 finding을 재현하는 테스트로 RED를 먼저 본다.
4. finding 하나를 고칠 때마다 고친 파일을 커밋하고, progress.md에 `finding <ID>: <sha>`를 적은 뒤 progress.md만 스테이징해 따로 커밋한다. `<ID>`는 findings.md의 finding ID 그대로다(예: `finding I1: a1b2c3d`).
5. 끝나면 전체 테스트를 돌린다. progress.md에 `완료: head <sha>`를 새로 적고 progress.md만 스테이징해 커밋한다. `<sha>`는 마지막 finding 커밋이다. spec-digest가 마지막 `완료: head` 줄을 끝 커밋으로 읽으므로 수정 커밋이 커밋 범위에 들어간다.
6. 보고한다. 고친 finding과 커밋 목록, 반박한 finding과 그 근거를 따로 적는다. 보고의 마지막 줄은 `다음 단계: /spec-review <폴더>`다.

findings.md는 읽기만 한다. ADDRESSED와 WITHDRAWN 판정은 spec-review가 한다.

## 마무리 (구현 모드)

1. 브랜치의 전체 테스트를 돌린다. 실패가 있으면 고치고 다시 돌린다. 단, progress.md 머리말 `- 기준 테스트:` 줄의 실패 목록에 있는 테스트는 구현을 시작하기 전 HEAD에서 이미 실패하던 것이므로 고치지 않는다. 그 목록은 머리말에 이미 있다. 고칠 수 없는 실패가 남으면 그 출력을 보고에 넣는다.
2. 남은 변경을 커밋한다.
3. progress.md에 수동 확인 항목을 `수동 확인: <항목>` 줄로 하나씩 적고(4의 두 번째 항목과 같은 내용), 작업 중 발견했지만 고치지 않은 기존 버그나 요청 밖 동작을 `발견: <내용> — <file:line>` 줄로 하나씩 적고(4의 세 번째 항목과 같은 내용), 이어서 `완료: head <sha>`를 적고 progress.md만 스테이징해 커밋한다. `<sha>`는 2가 끝난 시점의 HEAD다.
4. 마무리 보고를 한다. 네 가지를 넣는다.
   - 수용 기준 대조: spec의 `## 수용 기준` 항목마다 통과 또는 실패와 그 증거(명령과 출력)
   - 수동 확인 항목: spec `## 수용 기준` 절의 `- 수동 확인 항목:` 줄을 옮기고, 작업 중 테스트로 대신할 수 없던 것을 더한다. 준비의 파일 복사에서 메인 체크아웃에 없어 건너뛴 경로가 있으면 적는다. 이 스킬이 프로젝트 `.gitignore`에 줄을 추가했으면 그 사실도 적는다. 그 변경의 커밋 여부는 사용자가 정한다
   - 발견했지만 고치지 않은 것: progress.md의 `발견:` 줄 전부, 그리고 기준 테스트에서 이미 실패하던 테스트
   - Ruling 목록: progress.md의 `Ruling:` 줄 전부
5. 보고의 마지막 줄은 `다음 단계: /spec-review <폴더>`다.

브랜치는 그대로 두고 메인 체크아웃도 옮기지 않는다.

## progress.md 형식

머리말과 줄 형식은 `./progress-template.md`가 정한다. 줄은 거기 적힌 문자열 그대로 쓴다. 표의 읽는 스킬 열이 어느 줄을 누가 읽는지 보여 준다.

progress.md는 `<폴더>` 안에 있으므로 브랜치에 커밋된다. 어느 방식이든 코드 커밋과 섞지 않고 progress.md만 스테이징해 따로 커밋한다. 줄에 적는 sha는 그 줄을 쓰기 전에 만든 커밋이므로, 커밋한 뒤에 줄을 쓰는 순서를 지키면 sha를 미리 알 필요가 없다.

- inline 방식은 슬라이스마다, 수정 모드는 finding마다 progress.md를 커밋한다.
- orchestrator 방식은 컨트롤러가 묶음이 끝날 때마다 커밋한다.
- 마무리의 `완료:` 줄은 마무리 3의 커밋에 들어간다.
