# orchestrator 방식 — 슬라이스마다 구현 subagent와 검사 subagent를 띄운다

SKILL.md "실행 방식"에서 orchestrator를 골랐을 때의 절차다. 이 절차를 진행하는 세션을 **컨트롤러**라고 부른다. 컨트롤러는 subagent를 띄우고, 보고를 받고, 판정하고, progress.md에 기록한다. 코드는 구현 subagent가 고친다.

기본 규칙은 셋이다.

- 슬라이스마다 새 구현 subagent를 띄운다. 이전 슬라이스의 subagent를 이어 쓰는 것은 같은 슬라이스의 수정뿐이다.
- brief, report, diff 패키지는 파일로 만들어 경로만 넘긴다.
- 슬라이스 검사는 구현 subagent와 다른 subagent가 한다. 검사는 슬라이스가 brief대로 끝났는지만 본다. 코드 리뷰는 spec-review가 브랜치 전체를 대상으로 한다.

## 용어

| 용어 | 뜻 |
|---|---|
| 슬라이스 | spec의 `## 구현 슬라이스` 절에 있는 `### 슬라이스 N: 이름` 하나. Files, Consumes/Produces, 완료 판정 세 항목과 선택 항목 `- 모델:`으로 정의된다 |
| brief | 슬라이스 하나의 본문을 spec에서 뽑아낸 파일. 구현 subagent가 읽는다 |
| report | 구현 subagent가 무엇을 했고 어떤 테스트를 돌렸는지 쓴 파일. 검사 subagent가 읽는다 |
| diff 패키지 | 슬라이스의 커밋 목록, 바뀐 파일 목록, 문맥 10줄 diff를 한 파일로 만든 것. `review-package` 스크립트가 만든다 |
| 검사 | 검사 subagent가 슬라이스 하나를 brief의 Files, Consumes/Produces, 완료 판정과 대조하는 것. 결과는 `<워크스페이스>/slice-N-check.md`에 남고 뒤 단계는 읽지 않는다 |
| progress.md | `docs/minipowers/<stem>/progress.md`. 진행 기록이다. 줄 형식은 `./progress-template.md` 절이 정한다 |
| 워크스페이스 | brief, report, diff 패키지, 검사 결과가 사는 일회용 디렉터리. `<ROOT>/.minipowers/<stem>/work/`. git이 추적하지 않는다 |
| Ruling | 컨트롤러가 spec을 기준으로 스스로 내린 판정. progress.md에 `Ruling:` 줄로 남긴다 |
| 묶음 | 서로 의존하지 않아 동시에 시작하는 슬라이스들 |

## 경로 표기

- `<ROOT>`: 메인 체크아웃의 절대경로. conventions.md "폴더 구조"의 명령(`git worktree list --porcelain | head -1`)으로 얻는다
- `<SPEC_WT>`: conventions.md "작업 위치 결정"으로 정한 작업 위치의 절대경로. 대개 `<ROOT>/.worktrees/<stem>`이고, 사용자가 spec 브랜치를 직접 checkout해 둔 경우에는 현재 체크아웃이다
- `<SPEC>`: `<SPEC_WT>/docs/minipowers/<stem>/spec.md`의 절대경로. 워크스페이스는 spec 경로로 소유를 확인하므로 같은 경로를 계속 써야 같은 워크스페이스가 나온다
- `<SKILL_DIR>`: conventions.md "스킬 파일 경로"대로 실제 절대경로로 바꾼다

스크립트는 `<ROOT>`에서 실행한다. worktree 안에서 실행하면 `.minipowers/`가 그 worktree 안에 생긴다. 커밋은 SHA로 넘긴다. `<ROOT>`의 `HEAD`는 spec 브랜치의 HEAD가 아닐 수 있다.

## 준비

1. **작업 공간을 확인한다.** SKILL.md "기준 커밋 확인"과 "준비와 기준 테스트"를 끝낸 상태여야 한다.
2. **워크스페이스를 만든다.** 아래 명령이 디렉터리를 만들고 절대경로를 출력한다. 프로젝트 `.gitignore`의 `.minipowers/` 줄도 이 스크립트가 처리한다.
   ```bash
   cd "<ROOT>" && bash "<SKILL_DIR>/scripts/workspace" "<SPEC>"
   ```
3. **progress.md를 확인한다.**
   - 파일이 있고 첫 줄이 이 spec을 가리키면 이전 세션이 진행하던 작업이다. `슬라이스 N: complete` 줄이 있는 슬라이스는 건너뛴다. 묶음이 `동시 시작`만 있고 `병합 완료`가 없으면, 그 묶음에서 complete가 아닌 슬라이스만 다시 처리한다.
   - `슬라이스 N: blocked` 줄이 있고 그 뒤에 같은 N의 `complete` 줄이 없으면 그 슬라이스를 처음부터 다시 한다. 구현 subagent 프롬프트의 brief 뒤에 blocked 줄의 FAIL 항목을 "이전 시도에서 빠진 것"으로 넣는다.
   - 머리말은 SKILL.md "준비와 기준 테스트"에서 이미 만들어져 있다. 여기서는 `- 준비:`와 `- 기준 테스트:` 줄이 있는지 확인만 한다.
   - 컨텍스트가 압축된 뒤에는 기억보다 progress.md와 `git log`를 믿는다.
4. **spec을 읽는다.** spec.md의 `## 검증된 전제`, `## 구현 맥락`, `## 구현 슬라이스`, `## 수용 기준`, `## 리뷰 기준`을 읽는다. 슬라이스끼리 Consumes와 Produces가 맞물리는지 대조한다. 어긋난 곳은 spec을 기준으로 판정하고 `Ruling:`으로 남긴다. spec.md는 고치지 않는다.

## 슬라이스 하나를 처리하는 순서

```
1. BASE 기록 → 2. 구현 subagent → 3. 보고 처리 → 4. diff 패키지 → 5. 슬라이스 검사
   → PASS면 7. 완료
   → FAIL이면 6. 수정(한 번) → 4 → 5 → PASS면 7. 완료, 다시 FAIL이면 6의 마지막 문단
```

### 1. BASE를 기록한다

구현 subagent를 띄우기 직전, 그 슬라이스가 작업할 worktree의 HEAD를 기록한다.
```bash
BASE=$(git -C <슬라이스 worktree> rev-parse HEAD)
```

### 2. 구현 subagent를 띄운다

brief를 만든다. 아래 명령이 spec에서 슬라이스 N의 본문을 뽑아 워크스페이스에 쓰고 경로를 출력한다.
```bash
cd "<ROOT>" && bash "<SKILL_DIR>/scripts/slice-brief" "<SPEC>" N
```

slice-brief는 `<SPEC>`에서 `### 슬라이스 N:` 블록을 뽑는다. 출력 줄은 `wrote <out>: <k> lines`이다.

[implementer-prompt.md](implementer-prompt.md)의 템플릿을 채워 띄운다. 프롬프트에 넣는 것은 다음이다.

- 슬라이스 worktree의 절대경로와 BASE
- brief 경로
- 앞 슬라이스가 만들어 이 슬라이스가 써야 하는 이름과 시그니처. brief에 없을 수 있다
- brief에 모호한 부분이 있으면 그에 대한 Ruling
- report 경로. `<워크스페이스>/slice-N-report.md`
- 모델. 아래 "모델 선택"대로 고른다

### 3. 보고를 처리한다

구현 subagent는 네 상태 중 하나로 보고한다.

| 상태 | 컨트롤러가 할 일 |
|---|---|
| `DONE` | `git -C <슬라이스 worktree> log BASE..HEAD`와 `git diff --stat`으로 커밋을 직접 확인하고 4로 간다 |
| `DONE_WITH_CONCERNS` | 걱정 내용을 읽는다. 완료 판정이나 Files 범위에 관한 것이면 SendMessage로 같은 subagent에게 고치게 한다. 그 밖의 관찰은 `발견: <내용> — <file:line>`으로 적고 4로 간다 |
| `NEEDS_CONTEXT` | 빠진 정보를 채워 SendMessage로 이어 가게 한다 |
| `BLOCKED` | 원인에 맞는 것을 바꾼다. 정보가 부족하면 채운다. spec이 모호하면 판정해 `Ruling:`을 남긴다. 조건을 바꾼 뒤에 다시 띄운다 |

`DONE`과 `DONE_WITH_CONCERNS`면 report의 TDD 증거를 progress.md에 같은 형식으로 옮겨 적는다.

- RED를 본 테스트마다 `슬라이스 N: RED <테스트 이름> — <실패 요지 한 줄>`을 한 줄씩 적는다.
- 슬라이스의 Files가 모두 테스트를 두지 않는 곳이면 `슬라이스 N: RED 없음 — <테스트를 두지 않는 이유 한 줄>`을 한 줄 적는다.
- report에 테스트를 두는 곳의 RED 증거가 없으면 줄을 지어내지 않는다. 검사 subagent가 검사 항목 5에서 FAIL로 올린다.

report에 `Ruling:` 줄이 있으면 progress.md에 그대로 옮겨 적는다. BLOCKED의 원인이 어느 방향으로 가도 추측인 spec 결함이면 conventions.md 정지 조건 4에 해당한다. SKILL.md "spec 결함으로 멈출 때"대로 todo를 쓰고 끝낸다. 원인이 worktree에 없는 파일(설정, 비밀 값)이면 conventions.md "worktree 준비"의 마지막 문단대로 멈춘다.

### 4. diff 패키지를 만든다

```bash
cd "<ROOT>" && bash "<SKILL_DIR>/scripts/review-package" "<SPEC>" <BASE> <HEAD sha>
```

BASE는 1에서 기록한 커밋을 쓴다. `HEAD~1`을 쓰지 않는 이유는 슬라이스 하나가 커밋 여러 개일 수 있기 때문이다. 스크립트가 exit 3으로 끝나면 범위가 비었거나 HEAD가 BASE의 자손이 아니다. worktree와 BASE를 다시 확인한다.

### 5. 슬라이스 검사

[checker-prompt.md](checker-prompt.md)를 채워 검사 subagent를 띄운다. 넣는 것은 brief 경로, report 경로, diff 패키지 경로, BASE와 HEAD, 검사 결과 파일 경로 `<워크스페이스>/slice-N-check.md`다. spec의 수용 기준과 리뷰 기준은 넣지 않는다.

검사 항목은 다섯이다. Files 범위, Files 누락, Produces, 완료 판정, TDD 증거. 결과는 `PASS` 또는 `FAIL`과 FAIL 항목 목록이다. 검사 결과는 progress.md에 적지 않는다.

### 6. 수정 (한 번)

1. 같은 구현 subagent를 SendMessage로 깨워 FAIL 항목 목록을 그대로 넘긴다. 깨울 수 없으면 brief 경로, report 경로, FAIL 항목을 넣어 같은 모델로 새 구현 subagent를 띄운다.
2. 구현 subagent는 항목마다 고치고 관련 테스트를 다시 돌리고 커밋한다. 틀렸다고 판단한 항목은 고치지 않고 report 끝의 수정 보고에 `반박: <항목> — <근거 file:line>` 줄을 쓴다.
3. BASE부터 지금 HEAD까지로 diff 패키지를 다시 만들고(4), 검사 subagent를 새로 띄운다(5). 반박 줄이 있으면 검사 subagent 프롬프트의 입력 절 끝에 "report의 반박 줄은 근거 file:line을 열어 확인한다. 근거가 맞으면 그 항목은 PASS다"를 한 줄 더한다.

수정은 한 번이다. 두 번째 검사도 FAIL이면 컨트롤러가 FAIL 항목을 명령으로 직접 확인한다. 항목이 실제로는 충족되어 있으면 `Ruling:`으로 근거를 남기고 7로 간다. 충족되어 있지 않으면 FAIL 항목이 brief에 구현 방법이 정해질 만큼 적혀 있는지 본다.

- 적혀 있지 않으면 spec 결함이다. SKILL.md "spec 결함으로 멈출 때"대로 progress.md에 `spec 결함:` 줄을 적고 todo를 쓰고 끝낸다.
- 적혀 있으면 구현 실패다. 재시도 한도에 닿은 것이지 spec이 틀린 것이 아니므로 todo를 쓰지 않고 같은 사이클에서 다시 시작할 수 있게 남긴다. 슬라이스의 코드를 BASE로 되돌린다(`<SPEC_WT>`에서 작업했으면 `git -C <SPEC_WT> reset --hard <BASE>`, 슬라이스 worktree였으면 병합하지 않은 것이므로 `cd <ROOT> && git worktree remove --force <이번 시도의 worktree> && git branch -D <이번 시도의 브랜치>`로 지운다. 이름은 "묶음에 슬라이스가 둘 이상일 때" 2에서 이번 시도에 실제로 만든 것이다. 접미사를 붙였으면 `-r2` 같은 접미사가 붙은 그 이름이고, 접미사 없는 이전 worktree와 브랜치는 건드리지 않는다). progress.md에 `슬라이스 N: blocked — <FAIL 항목> — <확인한 결과>`를 적고 progress.md만 스테이징해 커밋한다. 같은 묶음의 다른 슬라이스는 마저 끝내고 병합한다. 묶음에 blocked 슬라이스가 있으므로 `병합 완료` 줄은 적지 않되, 끝난 슬라이스의 `complete`와 RED 줄이 담기도록 progress.md만 스테이징해 한 번 더 커밋한다. 그 뒤 다음 묶음으로 가지 않고 마무리 없이 보고하고 끝낸다. 보고에는 FAIL 항목과 확인한 결과, 다시 부르면 이 슬라이스부터 새 subagent로 다시 시작한다는 것을 적는다. 마지막 줄은 `다음 단계: /spec-implement docs/minipowers/<stem>/`다.

### 7. 완료

`슬라이스 N: complete (commits <BASE>..<끝 커밋>)`을 적는다.

## 실행 순서 — 의존 관계가 묶음을 정한다

SKILL.md "실행 방식"의 두 규칙으로 의존 관계를 만든다. 서로 의존하지 않는 슬라이스는 같은 묶음에 넣는다. 묶음 안의 슬라이스는 동시에 띄우고, 묶음끼리는 순서대로 진행한다. 만든 묶음 순서는 progress.md 머리말의 `- 묶음:` 줄에 적는다.

프로젝트 지시 파일이나 spec의 `## 구현 맥락`이 테스트가 공유 자원(공유 DB, 고정 포트, 고정 경로의 임시 파일)을 쓴다고 적고 있으면, 모든 묶음을 슬라이스 하나짜리로 만든다. 그렇게 했으면 `Ruling:`으로 남긴다.

### 묶음에 슬라이스가 하나일 때

`<SPEC_WT>`에서 바로 작업한다. "슬라이스 하나를 처리하는 순서"를 그대로 따른다. 슬라이스가 complete가 되면 컨트롤러가 progress.md만 스테이징해 커밋한다.

### 묶음에 슬라이스가 둘 이상일 때

1. `<SPEC_WT>`의 HEAD를 기록한다. 이 커밋이 묶음의 시작점이다. `묶음 W: 슬라이스 a, b 동시 시작 (base <sha>)`를 적는다.
2. 슬라이스마다 시작점에서 갈라진 worktree와 브랜치를 만든다. `.worktrees/`는 `<ROOT>` 아래에 두고, 처음 만들 때는 conventions.md의 gitignore 처리를 따른다. 같은 이름의 worktree나 브랜치가 이미 있으면(중단된 묶음을 다시 시작하거나 충돌한 슬라이스를 다시 구현할 때) 이름 끝에 `-r2`, `-r3`처럼 처음 비는 번호를 붙인다. 남은 이전 worktree와 브랜치는 병합되지 않은 작업이라 지우지 않고, 마무리 보고의 수동 확인 항목에 경로를 적는다. 접미사를 붙였으면 아래 5와 7의 명령에서도 `<브랜치>-slice-N`과 `.worktrees/<stem>-slice-N` 자리에 실제로 만든 이름을 쓴다.
   ```bash
   cd <ROOT> && git worktree add .worktrees/<stem>-slice-N -b <브랜치>-slice-N <시작점>
   ```
   만든 worktree마다 conventions.md "worktree 준비"를 한다. 복사 목록과 준비 명령은 progress.md 머리말 `- 준비:` 줄과 같다. 새 worktree에는 의존성과 설정 파일이 없어서, 준비 없이 띄우면 구현 subagent의 RED가 구현이 없어서가 아니라 환경 때문에 난 실패가 된다. 준비는 구현 subagent를 띄우기 전에 끝낸다. 이미 있던 worktree를 다시 쓰는 경우에도 한 번 한다. 복사는 있는 파일을 덮어쓰지 않으므로 다시 해도 된다.
3. 슬라이스마다 구현 subagent를 한 메시지에서 동시에 띄운다. 프롬프트의 worktree 경로와 BASE는 그 슬라이스의 것이다. BASE는 시작점이다.
4. 슬라이스마다 3~7을 각자의 worktree에서 진행한다.
5. 검사를 통과한 슬라이스는 `<SPEC_WT>`에서 병합한다. 이 병합은 spec 브랜치 안의 절차이므로 정지 조건의 병합에 해당하지 않는다.
   ```bash
   git -C <SPEC_WT> merge --no-ff <브랜치>-slice-N
   ```
   충돌이 나면 `git merge --abort`로 되돌리고, 그 슬라이스를 다음 묶음으로 옮겨 병합된 HEAD에서 새로 구현하게 하고 `Ruling:`을 남긴다.
6. 병합할 때마다 `<SPEC_WT>`에서 전체 테스트를 돌린다. 실패하면 그 슬라이스의 구현 subagent를 SendMessage로 깨워 `<SPEC_WT>`에서 고치게 한다.
7. 병합이 끝난 슬라이스의 worktree와 브랜치를 지운다.
   ```bash
   cd <ROOT> && git worktree remove .worktrees/<stem>-slice-N && git -C <SPEC_WT> branch -d <브랜치>-slice-N
   ```
   브랜치 삭제는 `<SPEC_WT>`에서 한다. `git branch -d`는 명령을 실행한 체크아웃의 HEAD로 병합 여부를 본다. 메인 체크아웃은 기반 브랜치에 남아 있으므로 `<ROOT>`에서 지우면 "not fully merged"로 실패한다.
8. 묶음의 슬라이스가 전부 병합되면 `묶음 W: 병합 완료 (head <sha>)`를 적고 progress.md만 스테이징해 커밋한다. 다음 묶음의 시작점은 이 커밋이다.

## 멈추지 않고 판정한다

슬라이스 사이에서 계속할지 확인받지 않고 다음 슬라이스로 간다. brief의 모호함, spec의 결함, 슬라이스끼리의 충돌은 spec을 기준으로 판정하고 progress.md에 남긴다.

```
Ruling: <결정> — <근거> — <틀렸다면 잘못되는 것>
```

멈추는 경우는 conventions.md "정지 조건" 절의 넷뿐이다.

## 모델 선택

subagent를 띄울 때마다 모델을 지정한다. 값은 `sonnet`, `opus`, `fable` 중 하나다.

- 구현 subagent: spec의 슬라이스에 `- 모델:` 줄이 있으면 그 값이다. 값을 감싼 백틱은 떼고 읽는다. 줄이 없거나 값이 셋 중 하나가 아니면 컨트롤러가 슬라이스의 작업 성격으로 정한다. 기본은 `sonnet`이다. brief를 읽고 틀리기 쉬운 로직이면 올린다. 동시성, 트랜잭션, 보안, 여러 곳이 공유하는 파싱 문자열, 여러 파일에 걸친 구조 변경이 여기 해당한다. `opus`는 그중 범위가 슬라이스 안에 닫히는 것, `fable`은 잘못되면 다른 슬라이스나 기존 동작까지 깨지는 것이다. `sonnet`이 아닌 모델을 골랐으면 `Ruling: 슬라이스 N 모델 <값> — <성격 한 줄> — <sonnet이면 잘못되는 것>`으로 남긴다. 파일 수로 정하지 않는다.
- 검사 subagent: `sonnet`. 검사는 brief와 diff, report의 대조이므로 구현 모델보다 큰 모델을 쓰지 않는다.
- 수정: 처음 띄운 구현 subagent와 같은 모델.

## 기다리는 법

subagent를 띄운 뒤에는 progress.md 기록이나 다음 diff 패키지 준비처럼 할 일을 하고, 할 일이 없으면 완료 알림을 기다린다. 상태는 알림으로 받는다.

구현 subagent가 테스트를 돌리다 응답 없이 멈춰 있으면, 컨트롤러가 그 worktree에서 테스트 상태를 직접 확인하고 SendMessage로 이어 가게 한다. 작업물은 그대로 남아 있다.

## 마무리

모든 묶음이 끝나면 SKILL.md "마무리 (구현 모드)"로 간다. 워크스페이스(`<ROOT>/.minipowers/<stem>/work/`)는 일회용이라 뒤 단계가 읽지 않는다. 지우는 것은 spec-digest의 병합 뒤 정리 안내다.
