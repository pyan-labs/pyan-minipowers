# progress.md 형식

spec-implement가 쓰는 progress.md의 머리말과 줄 형식이다. 읽는 스킬은 여기 적힌 문자열을 그대로 찾는다. `<sha>`는 7자리 short SHA다.

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

`- 준비:` 줄은 spec-implement/SKILL.md "준비와 기준 테스트" 1에서 복사한 경로와 돌린 명령을 적는다. 해당하는 것이 없는 쪽은 `없음`이라고 적는다. orchestrator가 슬라이스 worktree를 준비할 때도 이 줄의 목록과 명령을 쓴다.

`- 기준 테스트:` 줄은 spec-implement/SKILL.md "준비와 기준 테스트" 2의 결과다. spec-review와 spec-digest가 읽는다. 실패가 없으면 `실패: 없음`이다.

`- 묶음:` 줄은 orchestrator 방식일 때 의존 관계로 만든 묶음 순서를 적고, inline 방식이면 `없음`이라고 적는다. `- 준비:`와 `- 묶음:` 줄은 orchestrator가 읽는다.

읽는 스킬 열의 spec-implement는 모드 결정, 이어서 하기, orchestrator가 자기 줄을 다시 읽는 경우다. 없음은 어느 스킬도 읽지 않는 기록용 줄이다.

| 줄 | 쓰는 때 | 읽는 스킬 |
|---|---|---|
| `슬라이스 N: RED <테스트 이름> — <실패 요지 한 줄>` | RED 출력을 본 테스트마다 한 줄. inline 방식은 RED를 본 직후 적고, orchestrator 방식은 컨트롤러가 report의 TDD 증거를 옮겨 적는다. 그 슬라이스의 `complete` 줄과 같은 progress.md 커밋에 들어간다 | spec-review · spec-digest |
| `슬라이스 N: RED 없음 — <테스트를 두지 않는 이유 한 줄>` | 슬라이스의 Files가 모두 테스트를 두지 않는 곳일 때 한 줄 | spec-review · spec-digest |
| `슬라이스 N: complete (commits <a>..<b>)` | 슬라이스가 끝났을 때. `<a>`는 슬라이스 시작 직전의 커밋(BASE), `<b>`는 슬라이스의 마지막 코드 커밋이다. `git log <a>..<b>`가 그 슬라이스의 커밋이고 progress.md 커밋은 여기 들어가지 않는다 | spec-implement · spec-digest |
| `Ruling: <결정> — <근거> — <틀렸다면 잘못되는 것>` | spec을 기준으로 스스로 판정했을 때 | spec-review · spec-digest |
| `finding <ID>: <sha>` | 수정 모드에서 findings.md의 `<ID>` 항목(예: `I1`, `C2`)을 고친 커밋 | spec-digest |
| `finding <ID>: 반박 — <근거 file:line>` | 수정 모드에서 findings.md의 `<ID>` 항목이 지금 코드 기준으로 틀렸다고 판단해 고치지 않았을 때 | spec-review · spec-digest |
| `묶음 W: 슬라이스 a, b 동시 시작 (base <sha>)` | orchestrator가 슬라이스 둘 이상인 묶음을 시작할 때 | spec-implement |
| `묶음 W: 병합 완료 (head <sha>)` | 그 묶음의 슬라이스가 전부 병합됐을 때 | spec-implement |
| `spec 결함: <틀린 전제 또는 항목> — <확인한 결과>` | 정지 조건 4로 멈출 때. 이 줄 다음에 중단 todo를 쓴다 | spec-implement |
| `발견: <내용> — <file:line>` | 마무리 3에서 `수동 확인:` 줄 다음. 작업 중 발견했지만 고치지 않은 기존 버그나 요청 밖 동작 하나마다 한 줄. 기준 테스트의 기존 실패는 머리말 `- 기준 테스트:` 줄에 있으므로 쓰지 않는다 | spec-review · spec-digest |
| `승인: <조작> — <사용자 답>` | 정지 조건 1~3에서 멈춰 사용자가 허락하고 이어 갈 때. 이 줄이 있는 조작은 다시 묻지 않는다 | spec-implement · spec-review · spec-digest |
| `수동 확인: <항목>` | 마무리 3에서. 사람이 확인해야 할 항목 하나마다 한 줄 | spec-digest |
| `완료: head <sha>` | 마무리 3에서 `수동 확인:` 줄 다음. `<sha>`는 마무리 2가 끝난 시점의 HEAD다 | spec-implement · spec-review · spec-digest |
