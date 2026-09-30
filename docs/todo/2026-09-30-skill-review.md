# minipowers skill 전체 리뷰와 fix plan (2026-09-30)

AGENTS.md와 README-ko.md의 세 원칙을 기준으로 `packages/minipowers/skills/` 전체를 리뷰한 결과다.

- 각 skill은 대화 context를 이어받지 않고, 앞 단계들의 산출물만 받아 독립적으로 진행할 수 있어야 한다.
- best practice를 따른다.
- skill을 명확하고 작게 만든다.

항목마다 **현상 → 원칙 위반 → fix plan** 순서로 적는다. 항목 번호는 우선순위다. 설계 결정이 필요한 항목은 제목에 `[결정 필요]`를 붙이고, 추천안과 대안을 함께 적는다.

## 전체 크기 (기준선)

| 파일 | 줄 |
|---|---|
| `_shared/conventions.md` | 173 |
| `spec-design/SKILL.md` + `spec-template.md` | 145 + 81 |
| `spec-implement/SKILL.md` + `orchestrator.md` + `implementer-prompt.md` + `reviewer-prompt.md` | 202 + 196 + 107 + 155 |
| `spec-review/SKILL.md` + `findings-template.md` | 226 + 107 |
| `spec-digest/SKILL.md` + `digest-template.md` + `index-template.md` | 216 + 86 + 29 |
| 합계 | 1,723 (표의 줄 수를 더한 값. 최초 기록 2,685는 합산 오류) |

항목 2 뒤(5.11.2): conventions.md 180, spec-implement/SKILL.md 189, spec-review/SKILL.md 220, spec-digest/SKILL.md 216, 나머지 동일. 합계 1,711.
항목 3 뒤(5.11.5): conventions.md 188, spec-implement/SKILL.md 147 + progress-template.md 47(신규), spec-review/SKILL.md 212, spec-digest/SKILL.md 180, 나머지 동일. 합계 1,690.

fix 뒤에 같은 표를 다시 재서 줄어든 것을 확인한다.

---

## 1. [High] Codex에서 `${CLAUDE_PLUGIN_ROOT}`, `${CLAUDE_SKILL_DIR}`가 치환되지 않을 수 있다

**처리 완료 (2026-09-30, 5.11.1).** 아래는 최초 지적과 계획이다. 실제 수정은 두 변수를 병기하지 않고 제거했다. 네 SKILL.md의 시작 경로를 SKILL.md 기준 `../_shared/conventions.md`로 통일하고, 템플릿은 `./<파일>`, 스크립트 명령은 실제 절대경로로 바꾸는 `<SKILL_DIR>` 자리표시자를 사용한다. 공용 규약, orchestrator의 세 호출 예시, README 두 언어를 함께 수정했다. 두 호스트 매니페스트의 patch 버전을 올리고 `pnpm run dist`로 배포본을 재생성했다.

**검증.** `pnpm run test:release` 7개 통과. 배포본을 공백이 있는 임시 설치 경로로 복사하고, 별도의 공백 포함 Git 작업 폴더에서 Claude 환경변수 없이 보조 파일 상대경로 8개를 읽고 `workspace`, `slice-brief`, `review-package`를 실행했다. brief의 슬라이스 추출과 리뷰 diff의 변경 파일 포함도 확인했다. Claude/Codex의 스킬 전체 호출을 재현한 검증은 아니다. skill-creator의 `quick_validate.py`는 기존 frontmatter의 `argument-hint`, `disable-model-invocation`을 허용하지 않아 네 스킬 모두 실패했으며, 해당 필드는 이번 변경 범위 밖이므로 유지했다.

**현상.** spec-design, spec-implement, spec-digest는 conventions.md와 템플릿·스크립트를 두 변수로 가리킨다. spec-review만 "이 SKILL.md가 있는 디렉터리 기준 `../_shared/conventions.md`"로 읽는다(`spec-review/SKILL.md:26`). README 요구사항 절은 두 변수를 "Claude Code가 치환한다"고만 적었다. Codex가 치환한다는 근거가 저장소에 없다.

**위반.** 배포 규칙 "Claude와 Codex 양쪽에서 동작해야 한다".

**fix plan.**

1. Codex CLI에서 확인한다. 임시 프로젝트에서 `$spec-digest`를 부르고 `${CLAUDE_PLUGIN_ROOT}`가 문자 그대로 남는지 본다. 결과를 이 todo에 적는다.
2. 치환되지 않으면 경로 규칙을 conventions.md "스킬 파일 경로" 절 한 곳에서 정하고, 네 SKILL.md는 같은 문장을 쓴다.
   ```
   공용 규약은 이 SKILL.md가 있는 폴더 기준 ../_shared/conventions.md, 템플릿·프롬프트·스크립트는 같은 폴더의 <파일>이다.
   Claude Code는 ${CLAUDE_SKILL_DIR}/<파일>로 같은 위치를 얻는다.
   ```
   변수와 상대경로를 함께 적어 어느 쪽이든 같은 파일에 닿게 한다.
3. spec-implement의 스크립트 호출(`bash ${CLAUDE_SKILL_DIR}/scripts/<name>`)도 같은 규칙으로 바꾼다. orchestrator.md "경로 표기"의 `${CLAUDE_SKILL_DIR}` 정의 줄을 conventions.md 참조로 바꾼다.
4. README 두 언어의 "요구사항" 절에서 "spec-review만 상대경로" 문장을 지우고 통일된 규칙 한 줄로 바꾼다.

**바뀌는 파일.** `_shared/conventions.md`, 네 `SKILL.md`, `orchestrator.md`, `README.md`, `README-ko.md`.

---

## 2. [High] spec.md 찾기와 작업 위치 결정이 세 곳에 얽혀 있다

**처리 완료 (2026-09-30, 5.11.2).** conventions.md "인자 해석" 절을 "작업 위치 결정" 절로 바꾸고, 인자 해석 → spec.md 찾기 → 작업 위치 → 작업 위치가 없을 때의 스킬별 표를 한 절에 두었다. spec-implement "시작" 3과 "작업 공간과 기준 커밋 확인" 1~4를 지우고 남은 5·6을 "기준 커밋 확인"으로 이름을 바꿨다. 이어서 하기, 준비와 기준 테스트의 예외, 수정 모드 1, orchestrator의 두 참조도 새 절 이름으로 맞췄다. spec-review 시작 2·3·5·6을 두 줄로, spec-digest 시작 2를 한 줄로 줄였다. 계획의 표와 다른 점 하나: spec-digest는 브랜치가 없어도 현재 체크아웃이나 `.worktrees/<stem>`에서 spec.md를 찾았으면 거기서 진행하고 커밋만 하지 않는다. 병합 뒤 브랜치를 지운 상태에서 digest를 부르는 기존 동작을 지키기 위해서다. 브랜치에서만 찾은 경우는 spec-review와 같이 안내하고 끝낸다.

**검증.** `pnpm run test:release` 7개 통과. `인자 해석`, `작업 공간과 기준 커밋 확인`, `"시작" 3` 참조가 spec-design의 자체 절 제목 외에 남지 않은 것을 grep으로 확인했다. 크기는 위 표 아래에 적었다.

**현상.** 같은 동작이 `conventions.md:14-27`(인자 해석), `spec-implement/SKILL.md:16-25`(시작 3), `spec-implement/SKILL.md:43-50`(작업 공간과 기준 커밋 확인)에 나뉘어 있고, 서로를 "시작 3의 브랜치 찾기 경로", "작업 공간 3의 명령", "준비와 기준 테스트의 예외"로 가리킨다. spec-review 시작 3·6, spec-digest 시작 2도 같은 내용을 다시 풀어 쓴다.

**위반.** "skill을 명확하고 작게". 모델이 한 동작을 하려고 세 절을 오간다.

**fix plan.**

1. conventions.md의 "인자 해석" 절을 **"작업 위치 결정"** 절로 바꾸고, 다음 순서 하나로 합친다.
   1. 인자를 `<작업 폴더>`로 해석한다(spec.md 경로를 받으면 그 폴더).
   2. spec.md를 찾는다: 현재 체크아웃 → `<메인 루트>/.worktrees/<stem>` → `<작업 폴더>/spec.md`를 가진 로컬 브랜치.
   3. 작업 위치를 정한다: spec 브랜치가 checkout된 폴더. 현재 체크아웃이 그 브랜치면 현재 위치, `.worktrees/<stem>`이 그 브랜치면 거기.
   4. 작업 위치가 없을 때 스킬별 행동을 표 하나로 둔다.

      | 스킬 | 브랜치 하나 | 브랜치 여럿 | 브랜치 없음 |
      |---|---|---|---|
      | spec-implement | worktree를 만들고 진행. 이번 실행에서 만들었으면 준비를 한 번 한다 | 목록 보고, 끝 | spec-design 안내, 끝 |
      | spec-review, spec-digest | spec-implement를 먼저 부르라고 안내, 끝 | 목록 보고, 끝 | spec-design 안내, 끝 |
2. spec-implement/SKILL.md "시작" 3과 "작업 공간과 기준 커밋 확인" 1~4를 지우고 "conventions.md '작업 위치 결정'대로 작업 위치를 정한다" 한 줄로 바꾼다. 5·6(기준 커밋 조상 확인, 전제 재확인)만 남긴다.
3. "준비와 기준 테스트"의 예외 문단은 "이번 실행에서 worktree를 새로 만들었으면 준비를 한 번 한다" 한 문장으로 줄인다. 위 표에 같은 말이 있으므로 근거 설명은 뺀다.
4. spec-review 시작 3·6, spec-digest 시작 2를 "conventions.md '작업 위치 결정'대로" 한 줄로 바꾼다.
5. 브랜치 확인 세부(`git show <브랜치>:.../spec.md`로 `- 브랜치:` 값 대조, `git worktree add` 실패 보고)는 conventions.md 표 아래 두 줄로 옮긴다.

**바뀌는 파일.** `_shared/conventions.md`, `spec-implement/SKILL.md`, `spec-review/SKILL.md`, `spec-digest/SKILL.md`.

**예상 효과.** spec-implement/SKILL.md 약 30줄, spec-review·spec-digest 각 약 10줄 감소.

---

## 3. [High] progress.md 줄 형식 계약을 읽는 쪽마다 복제했다

**처리 완료 (2026-09-30, 5.11.5).** 계획의 `_shared/progress-format.md` 대신 `spec-implement/progress-template.md`에 두었다. conventions.md "폴더 구조"의 "각 파일의 절 제목과 줄 형식은 그 파일을 쓰는 스킬의 템플릿이 정한다"에 맞추기 위해서다. spec.md, findings.md, digest.md와 같은 자리다. 표에 "읽는 스킬" 열을 더했고, 항목 4에서 지울 다섯 줄은 그대로 옮겼다. spec-implement/SKILL.md "progress.md 형식"은 참조 한 줄과 커밋 규칙만 남겼다. spec-review "읽는 순서" 3과 spec-digest 시작의 문자열 블록은 세 템플릿 참조로 바꿨다. spec-digest 블록의 findings 문자열(`Rounds: 2/2`, `- 기존 실패:`, `— WITHDRAWN`)과 spec 절 제목이 findings-template.md, spec-template.md에 있는 것을 확인했다. dist는 스킬 폴더를 통째로 복사하므로 스크립트 수정은 없다.

**검증.** `pnpm run test:release` 7개 통과. 옛 표의 줄 문자열이 세 SKILL.md에 남지 않은 것을 grep으로 확인했다. 크기는 위 표 아래에 적었다.

**현상.** 줄 형식 표는 `spec-implement/SKILL.md:177-197`에 있고, `spec-digest/SKILL.md:39-77`과 `spec-review/SKILL.md:93-101`이 그 목록을 다시 적는다. findings.md 절 제목도 spec-digest가 다시 나열한다.

**위반.** AGENTS.md "형식을 바꾸면 그것을 읽는 skill을 함께 바꾼다". 복제가 그 비용을 세 배로 만든다. 이미 spec-digest 목록에는 `묶음`, `fix round` 줄이 없어 표가 어긋나 있다(읽지 않으니 동작에는 영향 없음).

**fix plan.**

1. `_shared/progress-format.md`를 새로 만든다. spec-implement/SKILL.md "progress.md 형식" 절(머리말 예시와 줄 표)을 그대로 옮긴다. 표에 "읽는 스킬" 열을 더한다.
2. spec-implement/SKILL.md는 "progress.md의 줄 형식은 `_shared/progress-format.md`가 정한다" 한 줄과, 각 절차에서 "어느 줄을 쓴다"만 남긴다.
3. spec-review "읽는 순서" 3의 줄 목록을 "progress-format.md에서 읽는 스킬에 spec-review가 적힌 줄"로 바꾼다.
4. spec-digest "1. 시작"의 절 제목·줄 형식 목록(38줄)을 지운다. spec.md 절 제목은 spec-template.md, progress 줄은 progress-format.md, findings 절은 findings-template.md를 가리킨다. "코드 펜스 안의 제목은 치지 않는다"와 "현재 판정은 `## Verdict` 절 하나" 두 문장만 남긴다.
5. spec-digest "3. 파일별 처리"와 "4. digest.md 작성"에서 줄 형식을 인용하는 곳은 그대로 둔다(어느 줄을 어디로 옮기는지는 읽는 쪽의 규칙이므로).

**바뀌는 파일.** `_shared/progress-format.md`(신규), `spec-implement/SKILL.md`, `spec-review/SKILL.md`, `spec-digest/SKILL.md`. `scripts/assemble-dist.mjs`가 `_shared/`를 파일 단위로 복사하면 그대로, 파일명을 열거하면 추가한다.

**예상 효과.** spec-digest 약 40줄 감소. 계약 변경 시 고칠 곳이 한 곳.

---

## 4. [High] [결정 필요] 슬라이스 리뷰가 spec-review와 겹치고 계약을 무겁게 한다

**현상.** orchestrator 방식은 슬라이스마다 리뷰 subagent를 띄우고 수정 라운드를 최대 2회 돈다(`orchestrator.md` 5·6절, `reviewer-prompt.md` 155줄). 여기서 나온 상태가 progress.md 줄 4종(`fix round`, `withdrawn`, `minor(deferred)`, `parked`), spec-review의 "progress.md 이월 항목" 표, spec-digest의 `### parked` 절로 전파된다. 그런데 `spec-review/SKILL.md:132`는 "슬라이스 리뷰에서 이미 본 부분도 다시 본다"고 하고, inline 방식은 슬라이스 리뷰를 하지 않는다(`spec-implement/SKILL.md:92`).

**위반.**
- "같은 입력이면 같은 종류의 산출물": Agent 도구 유무로 progress.md에 나타나는 줄 종류가 달라진다. 도구 존재는 허용된 분기이지만, 산출물 종류까지 달라지는 것은 취지에 어긋난다.
- "명확하고 작게": 리뷰 체계가 둘이고 한쪽이 다른 쪽을 다시 본다.
- README "리뷰는 독립 세션에서".

**추천안: 슬라이스 리뷰를 없애고 완료 판정 확인만 남긴다.**

1. `reviewer-prompt.md`를 지운다.
2. orchestrator.md "슬라이스 하나를 처리하는 순서"를 `1. BASE 기록 → 2. 구현 subagent → 3. 보고 처리 → 4. 완료`로 줄인다. 4·5·6절을 지운다. 3절의 `DONE` 처리에 "완료 판정을 컨트롤러가 명령으로 직접 확인한다"를 더한다(inline 방식의 3과 같음).
3. `scripts/review-package`를 지운다. README "출처"와 "요구사항"의 "스크립트 세 개"를 "두 개"로 고친다.
4. progress-format.md(항목 3)에서 `fix round`, `withdrawn`, `minor(deferred)`, `parked` 줄과 `complete (…, K parked)` 변형을 지운다.
5. implementer-prompt.md "리뷰 findings를 받으면" 절을 지운다. 이 절은 수정 라운드 전용이다.
6. spec-review: "progress.md 이월 항목" 표(findings-template.md)와 그것을 채우는 지시(`SKILL.md:130`), "슬라이스 리뷰에서 이미 본 부분도 다시 본다" 문장을 지운다.
7. spec-digest: `### parked` 절과 4절의 parked 항목을 지운다. digest-template.md도 같이.
8. 구현 subagent가 report에 남기는 "걱정되는 점"은 `DONE_WITH_CONCERNS` 처리 그대로 `발견:` 줄로 옮긴다. `minor(deferred)`가 하던 역할을 이미 있는 줄이 맡는다.

**대안: 유지하되 산출물을 격리한다.** 슬라이스 리뷰 결과를 progress.md가 아니라 `.minipowers/<stem>/work/`에만 남기고, spec-review와 spec-digest는 읽지 않는다. progress.md 줄 4종과 이월 항목 표·parked 절은 추천안과 같이 지운다. reviewer-prompt.md와 orchestrator 5·6절은 남는다. 크기는 덜 줄지만 뒤 단계 계약은 같게 정리된다.

**결정 기준.** 슬라이스 리뷰가 spec-review 전에 실제로 잡아낸 finding이 있었는지. 없었거나 spec-review가 같은 것을 다시 잡았다면 추천안.

**바뀌는 파일(추천안).** `orchestrator.md`, `reviewer-prompt.md`(삭제), `implementer-prompt.md`, `scripts/review-package`(삭제), `spec-implement/SKILL.md`, `spec-review/SKILL.md`, `findings-template.md`, `spec-digest/SKILL.md`, `digest-template.md`, `README*.md`, `scripts/release.test.mjs`(스크립트 수를 검사하면).

**예상 효과.** 약 250줄 감소.

---

## 5. [Important] [결정 필요] spec 결함 후속 사이클이 산출물 밖의 사용자 행위에 기댄다

**현상.** 중단 todo에는 `- 브랜치: <브랜치> (중단 시점 HEAD <sha>)`가 적힌다(conventions.md "중단 todo"). 그러나 `spec-design/SKILL.md:49`는 "끝난 슬라이스의 커밋을 이어받으려면 사용자가 승인 전에 그 브랜치를 기반 브랜치에 병합해 두어야 한다"고 한다. 새 spec의 기준 커밋은 항상 승인 시점의 현재 브랜치 HEAD다.

**위반.** "뒤 단계가 필요로 하는 정보는 앞 단계의 산출물에 적혀 있어야 한다." 병합은 어느 산출물에도 기록되지 않는 행위라서, 새 사이클이 앞 사이클의 커밋을 받는지가 대화 밖 조건에 달려 있다.

**추천안: 후속 todo의 브랜치를 기준 커밋으로 잇는다.**

1. spec-template.md 머리말에 `- 이어받는 브랜치: <없음 | 브랜치 이름 (HEAD <sha>)>` 줄을 더한다.
2. spec-design 1절: 인자가 todo 파일이고 `- 중단된 작업:` 줄이 있으면 그 todo의 `- 브랜치:` 값을 "이어받는 브랜치"에 옮긴다.
3. spec-design 8절(승인 뒤): 이어받는 브랜치가 있으면 기준 커밋을 그 브랜치의 HEAD로 하고, feature 브랜치를 그 커밋에서 만든다. 1의 "현재 브랜치가 기반 브랜치와 다르면 끝낸다" 검사는 이어받는 브랜치가 없을 때만 한다. `spec-design/SKILL.md:49`의 "사용자가 병합해 두어야" 문장을 지운다.
4. 새 브랜치가 옛 feature 브랜치 위에 쌓이므로, 옛 worktree `.worktrees/<옛 stem>`은 병합 뒤 정리 대상으로 남는다. spec-digest "병합 뒤 정리" 안내에 "이어받는 브랜치가 있으면 그 worktree와 브랜치도" 한 줄을 더한다.
5. spec-review는 `<기준 커밋>..HEAD`만 보므로 바뀌지 않는다. 옛 사이클의 커밋은 옛 spec의 리뷰 범위다.

**대안: 현재 규칙을 유지하고 계약으로 명시한다.** 중단 todo의 "## 해결할 요구" 위에 `- 선행 조건: 브랜치 <브랜치>를 기반 브랜치에 병합한 뒤 승인한다` 줄을 spec-implement가 쓰고, spec-design 7절 검토 요청이 그 줄을 그대로 보여 준다. 사용자 행위에 기대는 것은 같지만, 요구가 산출물에 적힌다.

**결정 기준.** 끝난 슬라이스를 이어받는 일이 실제로 잦은지. 잦지 않으면 대안이 작다.

**바뀌는 파일(추천안).** `spec-template.md`, `spec-design/SKILL.md`, `_shared/conventions.md`, `spec-digest/SKILL.md`.

---

## 6. [Medium] spec-design은 승인 전 초안을 이어받을 경로가 없다

**현상.** 초안은 메인 체크아웃 `docs/minipowers/<stem>/spec.md`에 커밋하지 않은 채 둔다(`spec-design/SKILL.md:40`). 세션이 끊긴 뒤 다시 부르면 인자가 todo나 문장이므로 2절이 새 stem을 만든다. 초안 폴더는 그대로 남는다.

**위반.** spec-design도 "산출물만 받아 독립적으로 진행"의 대상이다. 초안이 산출물인데 이어받을 길이 없다.

**fix plan.**

1. spec-design 1절 "인자 해석"에 조건 하나를 더한다: 인자가 `docs/minipowers/<stem>/` 폴더(또는 그 안의 spec.md)이고 머리말의 `- 기준 커밋:`이 "승인 시 기록"이면 승인 전 초안이다. 2~4절을 건너뛰고 5절(전제 확인)부터 이어간다.
2. 머리말의 기준 커밋이 실제 sha이면 이미 승인된 spec이다. "이 spec은 승인됐다. 바꿀 것이 있으면 새 todo로 `/spec-design`을 부른다"고 안내하고 끝낸다.
3. argument-hint를 `"<todo 파일 | 요구 문장 | 승인 전 spec 폴더>"`로 바꾼다.
4. 8절 마무리 보고와 관계없이, 7절 검토 요청 메시지 끝에 "세션이 끊기면 `/spec-design docs/minipowers/<stem>/`로 이어간다" 한 줄을 더한다.

**바뀌는 파일.** `spec-design/SKILL.md`, conventions.md "인자 해석"의 spec-design 예외 문장.

---

## 7. [Medium] "이전 형식" 호환 분기가 세 skill에 있다

**현상.** `- 기준 테스트:` 줄 유무로 spec-review(3단계), spec-digest(1절 "이전 형식", 3·4절), orchestrator(준비 3)가 분기한다.

**위반.** "명확하고 작게". 관찰 가능한 조건이라 원칙 위반은 아니지만, 이전 형식 파일이 실제로 없다면 죽은 분기다.

**fix plan.**

1. minipowers를 쓰는 저장소들에서 `grep -L "기준 테스트:" docs/minipowers/*/progress.md`로 이전 형식 파일이 남아 있는지 확인한다. 결과를 이 todo에 적는다.
2. 없으면 세 곳의 분기와 findings-template.md의 `기록 없음(이전 형식 progress.md)` 문구, spec-review 심각도 절의 "(이전 형식 progress.md는 제외)"를 지운다.
3. 있으면 그 파일에 `- 기준 테스트: 기록 없음, 실패: 없음` 줄을 손으로 더하고(일회성 마이그레이션) 2를 한다. 이렇게 하면 분기 대신 데이터가 형식을 맞춘다.

**바뀌는 파일.** `spec-review/SKILL.md`, `findings-template.md`, `spec-digest/SKILL.md`, `orchestrator.md`.

---

## 8. [Medium] 프롬프트에 자기 설명 문장이 있다

**현상.** `spec-review/SKILL.md:14-22` "독립 세션과 입력 계약" 절은 context 0의 정의, 사용자가 새 세션을 여는 방법, "이 스킬의 지시만으로 context 0을 보장할 수는 없다" 같은 README 내용이다. 모델이 할 일이 아니다.

**위반.** best practice(지시는 모델이 할 행동으로 쓴다).

**fix plan.**

1. 절 전체를 두 줄로 바꾼다.
   ```
   근거는 디스크의 파일(spec, progress, findings, 프로젝트 지시 파일, 코드), git 이력·diff, 이번에 돌린 테스트 출력뿐이다.
   이 세션에 남아 있는 대화 내용은 요구사항이나 완료 증거로 쓰지 않는다.
   ```
2. context 0 정의와 새 세션 안내는 README에 이미 있으므로 옮기지 않는다.
3. 같은 종류의 문장을 다른 skill에서도 찾아 지운다. 예: `spec-implement/SKILL.md:44` "이때 worktree를 만들지 않는 이유는 git이 …", `orchestrator.md:167` "git branch -d는 … 실패한다"는 근거가 행동을 바꾸므로 남긴다. 판단 기준은 "이 문장을 지우면 모델의 행동이 달라지는가".

**바뀌는 파일.** `spec-review/SKILL.md`. 3에서 찾은 것.

---

## 9. [Minor] 수정 모드 뒤 `완료: head` 줄이 갱신되지 않는다

**현상.** 수정 모드(`spec-implement/SKILL.md:128-135`)는 `finding <ID>: <sha>` 줄만 적고 끝낸다. findings.md가 needs fixes인 채로 spec-digest를 부르면 끝 커밋이 옛 `완료: head` sha라 수정 커밋이 커밋 범위에서 빠진다.

**fix plan.**

1. 수정 모드 5에 "전체 테스트를 돌린 뒤 `완료: head <sha>` 줄을 새로 적고 progress.md만 커밋한다"를 더한다. `<sha>`는 마지막 finding 커밋이다.
2. spec-digest 2절 "끝 커밋"의 "progress.md의 마지막 `완료: head`" 규칙은 이미 "마지막"이므로 바뀌지 않는다.
3. progress-format.md(항목 3)의 `완료: head` 줄 설명에 "수정 모드가 끝날 때도 다시 적는다"를 더한다.

**바뀌는 파일.** `spec-implement/SKILL.md`, `_shared/progress-format.md`.

---

## 10. [Minor] conventions.md의 자기 규칙 위반

**현상.** `conventions.md:3`은 "여기 적힌 것을 각 SKILL.md는 반복하지 않는다"고 하지만, "병합·push·PR 생성을 하지 않는다"가 네 SKILL.md 끝에 다시 나온다(`spec-design:145`, `spec-implement:150`, `spec-review:56-57`, `spec-digest:195`). 정지 조건 넷도 `spec-implement/SKILL.md:111`에 다시 풀어 적혀 있다.

**fix plan.**

1. 네 SKILL.md의 "병합, push, Pull Request 생성을 하지 않는다" 문장을 지운다. conventions.md "정지 조건" 절의 마지막 문단이 정본이다.
2. `spec-implement/SKILL.md:111`의 정지 조건 나열을 "conventions.md '정지 조건'의 넷뿐이다"로 줄이고, 넷째의 후속 행동(`spec 결함:` 줄, todo, 보고)과 `승인:` 줄 규칙만 남긴다.
3. 항목 2·3을 끝낸 뒤, conventions.md의 각 절 제목으로 네 SKILL.md를 grep해 같은 내용이 다시 적힌 곳을 한 번 더 찾는다.

**바뀌는 파일.** 네 `SKILL.md`.

---

## 11. [Minor] 모델 선택이 파일 수 상한으로 갈린다

**현상.** `orchestrator.md:184` "슬라이스의 Files가 둘 이하면 sonnet, 셋 이상이면 opus".

**위반.** 산출물 종류를 바꾸진 않지만 AGENTS.md "숫자 상한으로 갈리지 않게"의 취지와 어긋난다. 파일 수는 난이도의 근거가 약하다.

**fix plan.**

1. 규칙을 "spec의 `- 모델:` 줄이 있으면 그 값, 없으면 지정하지 않는다(세션의 모델을 물려받는다)"로 바꾼다. 리뷰 subagent와 수정 라운드 줄은 항목 4의 결정에 따라 지우거나 "구현 subagent와 같다"로 둔다.
2. implementer-prompt.md 자리표시자 `[모델]` 설명을 "spec의 `- 모델:` 값. 없으면 `model:` 줄을 빼고 띄운다"로 바꾼다.
3. spec-design 4절의 모델 지침("틀리기 쉬운 로직은 opus 또는 fable, 기계적 변경은 sonnet, 근거 없으면 쓰지 않는다")은 그대로 둔다. 판단은 설계 단계가 한다.

**바뀌는 파일.** `orchestrator.md`, `implementer-prompt.md`.

---

## 진행 순서

1. **항목 1** (Codex 경로 확인). 확인 결과에 따라 범위가 정해지고, 다른 항목의 SKILL.md 편집과 겹치므로 먼저 한다.
2. **항목 4, 5 결정.** 사용자가 추천안·대안 중 하나를 고른다. 두 결정이 항목 2·3의 편집 범위를 정한다.
3. **항목 2 → 3 → 10** 순서로 conventions.md와 `_shared/`를 정리한다. 세 항목 모두 conventions.md를 고치므로 한 사이클로 묶는다.
4. **항목 4** (결정한 안대로).
5. **항목 5, 6, 9** spec-design·spec-implement 계약 변경. 5와 6은 spec-design/SKILL.md를 함께 고친다.
6. **항목 7, 8, 11** 나머지 축소.
7. 각 사이클 끝에 `pnpm run dist`, `pnpm test`(release.test.mjs), 그리고 이 문서 위의 크기 표를 다시 잰다. 마지막에 `pnpm run version:bump minipowers minor`.

각 사이클은 minipowers 자체의 흐름(`/spec-design` → `/spec-implement` → `/spec-review` → `/spec-digest`)으로 돌 수 있다. 이 todo 파일의 각 항목 절이 `/spec-design`의 인자다.
