# 검사 subagent 프롬프트

orchestrator.md "5. 슬라이스 검사"에서 쓴다. `[ ]` 자리를 채워 Agent 도구(general-purpose)로 띄운다.

검사는 슬라이스 하나가 brief대로 끝났는지 확인하는 것이다. 기준은 brief의 Files, Consumes/Produces, 완료 판정뿐이다. 코드 품질, 수용 기준, 리뷰 기준은 보지 않는다. 그것은 spec-review가 브랜치 전체를 대상으로 한다.

## 자리표시자

| 자리표시자 | 넣는 것 |
|---|---|
| `[N]` | 슬라이스 번호 |
| `[worktree 절대경로]` | 검사 대상 슬라이스의 worktree 절대경로 |
| `[BRIEF_FILE]` | 구현 subagent가 읽은 것과 같은 brief 파일 |
| `[REPORT_FILE]` | 구현 subagent의 report 파일. 수정 보고는 이 파일 끝에 덧붙어 있다 |
| `[DIFF_FILE]` | `review-package`가 출력한 경로 |
| `[BASE_SHA]`, `[HEAD_SHA]` | 슬라이스의 BASE와 지금 HEAD |
| `[CHECK_FILE]` | `<워크스페이스>/slice-N-check.md` |
| `[모델]` | orchestrator.md "모델 선택"에 따라 고른 모델 이름 |

## 템플릿

```
description: "슬라이스 [N] 검사"
model: [모델]
prompt: |
  슬라이스 [N]이 brief대로 끝났는지 검사한다.

  ## 작업 위치와 제약
  `cd [worktree 절대경로]`로 이동한다.
  이 체크아웃은 읽기 전용이다. working tree, index, HEAD, 브랜치를 그대로 둔다.
  다른 subagent를 띄우지 않는다.

  ## 입력
  - [BRIEF_FILE]: 이 슬라이스의 Files, Consumes/Produces, 완료 판정. 검사 기준의 전부다.
  - [REPORT_FILE]: 구현 subagent의 보고. 검증되지 않은 주장으로 본다.
  - [DIFF_FILE]: [BASE_SHA]..[HEAD_SHA]의 커밋 목록, 바뀐 파일 목록, diff.
    파일이 없을 때만 `git diff --stat [BASE_SHA]..[HEAD_SHA]`와 `git diff [BASE_SHA]..[HEAD_SHA]`로 직접 뽑는다.

  ## 검사 항목
  항목마다 PASS 또는 FAIL을 정하고 근거를 file:line이나 명령과 출력으로 남긴다.
  1. Files 범위: 바뀐 파일이 모두 brief의 Files 또는 그 파일의 테스트인가. 밖의 파일은 하나씩 적는다.
  2. Files 누락: brief의 Files마다 diff에 변경이 있는가. 없는 파일은 하나씩 적는다.
  3. Produces: brief의 Produces에 적힌 이름과 시그니처가 diff에 그대로 있는가.
  4. 완료 판정: brief의 완료 판정을 명령으로 직접 확인한다. 명령으로 확인할 수 없는 판정은 report에 확인 기록이 있는지 본다.
  5. TDD 증거: 테스트를 두는 곳의 코드마다 report에 RED(구현 전 실패 출력)와 GREEN(구현 후 통과 출력)이 있는가.
     Files가 모두 테스트를 두지 않는 곳이면 report에 그 이유 한 줄이 있는가.
  증거가 잘려 보이면 파일을 다시 읽는다. 정말 없으면 FAIL이다.

  ## 출력
  [CHECK_FILE]에 항목 1~5를 순서대로 쓴다. 항목마다 `PASS` 또는 `FAIL`과 근거다.

  마지막 메시지는 다음만 쓴다.
  - Result: PASS | FAIL
  - FAIL 항목: 항목 번호와 무엇이 어디서 어긋났는지 한 줄씩. 없으면 "없음"
  - check 파일 경로
```
