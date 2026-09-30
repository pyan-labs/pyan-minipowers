---
name: spec-design
description: todo 파일이나 요구 문장 하나를 승인된 docs/minipowers/<stem>/spec.md와 그 spec을 첫 커밋으로 둔 feature 브랜치 worktree로 만든다.
argument-hint: "<todo 파일 | 요구 문장>"
disable-model-invocation: true
---

# spec-design — 요구 하나를 승인된 spec과 feature 브랜치로 만든다

시작할 때 `${CLAUDE_PLUGIN_ROOT}/skills/_shared/conventions.md`를 읽는다. 폴더 구조, stem 규칙, 날짜를 얻는 명령, 문체 규칙, 스킬 파일 경로는 그 문서가 정한다.

## 이 스킬이 남기는 것

변경의 크기와 관계없이 항상 같다.

- `docs/minipowers/<stem>/spec.md` 파일 하나. 형식은 `${CLAUDE_SKILL_DIR}/spec-template.md`다.
- 기준 커밋에서 만든 feature 브랜치 하나.
- 그 브랜치를 checkout한 worktree 하나. 메인 체크아웃 루트의 `.worktrees/<stem>`이다.
- 그 브랜치의 첫 커밋 하나. spec.md만 들어 있다.

변경이 작으면 spec의 각 절이 한 줄이다. 한 줄짜리 수정에도 spec 파일을 만든다.

spec은 뒤 단계(spec-implement, spec-review, spec-digest)가 받는 유일한 입력이다. 뒤 단계는 이 대화를 볼 수 없으므로, 구현에 필요한 코드베이스 맥락은 전부 spec에 적는다.

## 1. 인자 해석

인자는 todo 파일 경로 또는 요구를 적은 문장이다.

- 인자가 존재하는 파일 경로이면 그 파일을 읽는다. 원문을 spec 머리말의 "원 요구"에 경로와 함께 `>` 인용으로 옮긴다.
- 인자가 파일 경로가 아니면 문장으로 받는다. 그 문장을 "원 요구"에 인용한다.
- 인자가 없으면 "todo 파일 경로나 요구 문장을 넣어 다시 호출한다"고 한 줄로 안내하고 끝낸다.

## 2. 작업 폴더 만들기

1. 날짜를 conventions.md "stem 규칙"의 명령으로 얻는다.
2. `docs/minipowers/`가 없으면 만든다.
3. 일련번호와 stem은 conventions.md "stem 규칙"대로 정한다. 주제어는 요구에서 뽑는다.
4. `docs/minipowers/<stem>/`을 만든다.

이 폴더는 메인 체크아웃 루트(conventions.md "폴더 구조"의 명령으로 얻는다) 아래 `<메인 체크아웃 루트>/docs/minipowers/<stem>/`에 만든다. 승인 전까지 spec.md 초안은 여기에 커밋하지 않은 채로 둔다. 승인 뒤 8절에서 worktree로 옮긴다.

## 3. 프로젝트에서 읽는 것

spec 초안을 쓰기 전에 다음을 읽는다.

- **지시 파일.** 프로젝트 루트와 작업 디렉터리의 `CLAUDE.md`, `AGENTS.md`. 코딩 규칙, 테스트 위치, 테스트 명령, 브랜치 이름 규칙이 여기 있다.
- **전체 테스트 명령.** 지시 파일에 있으면 그것을 쓴다. 없으면 프로젝트 종류로 정해지는 표준 명령(`dotnet test`, `pnpm test`, `pytest`, `go test ./...` 등)을 쓴다.
- **관련 코드.** 요구가 건드리는 파일, 그 파일을 부르는 곳, 비슷한 일을 하는 기존 코드, 관련 테스트.
- **이전 spec.** `docs/minipowers/` 안에 같은 영역을 다룬 spec 폴더가 있으면 그 spec.md와 digest.md. todo의 `중단된 작업:` 줄이 spec을 가리키면(conventions.md "중단 todo") 그 폴더의 spec.md, progress.md, findings.md도 읽는다. 폴더는 `.worktrees/<stem>`에 있을 수 있다. 끝난 슬라이스의 커밋은 그 브랜치에만 있다. 새 spec은 항상 승인 시점의 HEAD를 기준 커밋으로 삼는다. 그 커밋을 이어받으려면 사용자가 승인 전에 그 브랜치를 프로젝트의 git 규칙대로 기반 브랜치에 병합해 두어야 하고, 7절의 검토 요청에 적은 현재 브랜치와 HEAD 해시로 확인한다. 이 스킬은 병합하지 않는다.

## 4. spec 초안 쓰기

`${CLAUDE_SKILL_DIR}/spec-template.md`를 `docs/minipowers/<stem>/spec.md`로 옮겨 아홉 절을 채운다. 절 제목은 템플릿의 문자열을 그대로 쓴다. 뒤 단계가 이 문자열로 spec을 찾는다.

- 코드베이스에서 답이 나오는 것은 코드를 읽어 채운다.
- 머리말의 "기준 커밋"과 "브랜치"는 승인 전까지 템플릿의 자리 표시 문구로 둔다.
- "검증된 전제" 표에는 5절의 확인 전까지 단언만 적고, "확인 방법" 칸에 "미확인"이라고 쓴다.

### 구현 슬라이스 쓰는 법

- 슬라이스마다 Files, Consumes / Produces, 완료 판정 세 항목과 선택 항목 모델만 쓴다.
- 슬라이스 제목은 `### 슬라이스 N: 이름`이다. N은 1부터 차례로 붙인다.
- 슬라이스 하나가 커밋 하나다. 슬라이스 수는 작업이 요구하는 만큼 둔다.
- Produces에는 뒤 슬라이스가 그대로 참조하는 이름, 형식, 문자열을 적는다. 뒤 슬라이스는 그것을 Consumes에 적는다. 두 슬라이스가 서로 의존하는지는 이 두 항목과 Files로 판정되므로, 공유하는 것은 빠짐없이 적는다.
- 완료 판정은 자동으로 확인할 수 있는 조건만 쓴다. 테스트 이름, 빌드 명령, grep 결과가 여기 해당한다.
- 슬라이스의 확인은 구현 subagent가 테스트나 명령으로 수행할 수 있는 형태로 쓴다. 그렇게 쓸 수 없는 확인(브라우저를 열어 눈으로 보는 확인 등)은 "수용 기준"의 "수동 확인 항목"에 적는다.
- 모델(`- 모델: <sonnet | opus | fable>`)은 그 슬라이스를 구현할 subagent의 모델이다. 슬라이스의 난이도로 정한다.
  - 틀리기 쉬운 로직은 `opus` 또는 `fable`이다. 동시성, 트랜잭션, 보안, 여러 스킬이 공유하는 파싱 문자열이 여기 해당한다.
  - 기계적인 변경은 `sonnet`이다.
  - 정할 근거가 없으면 모델 줄을 쓰지 않는다.

## 5. 전제 확인

spec의 문장은 두 종류다.

- "앞으로 이렇게 한다"는 결정이다. 확인 대상이 아니다.
- "코드가 지금 이렇다"는 단언이다. 실제 코드로 확인한다.

spec 전체에서 단언을 전부 뽑아 하나씩 grep이나 파일 읽기로 확인한다. 확인에 쓴 커밋은 `git rev-parse HEAD`로 얻는다.

- 맞으면 "검증된 전제" 표의 그 행에 확인 방법(grep 명령과 결과 또는 `파일:줄`)과 확인 커밋을 적는다.
- 틀리면 spec의 해당 문장과 그 문장에 기대는 결정을 고치고, 무엇이 틀렸는지 사용자에게 알린다.
- 확인하지 못한 단언은 "확인 방법" 칸을 "미확인"으로 둔다.

절 제목은 확인 결과와 관계없이 `## 검증된 전제`로 둔다. 뒤 단계가 이 제목으로 절을 찾는다. "미확인" 행이 남아 있으면 7절의 검토 요청에서 그 행을 나열한다.

## 6. 사용자에게 묻기

코드가 답해 주지 않는 결정만 사용자에게 묻는다. 요구의 범위, 여러 방법 중 어느 쪽을 택할지, 무엇을 감수할지가 여기 해당한다.

- 질문은 하나씩 한다. 한 메시지에 질문 하나를 쓴다.
- 질문마다 추천 답과 그 이유 한 줄을 붙인다.
- 답을 받으면 spec의 해당 절에 반영하고 다음 질문으로 넘어간다. 택하지 않은 쪽은 "기각한 대안"에 이유와 함께 적는다.
- 답이 새 단언을 만들면 5절로 돌아가 확인한다.

## 7. 검토 요청

spec.md를 파일로 저장하고 경로를 알려 사용자에게 검토를 요청한다. 요청 메시지에는 다음을 적는다.

- spec 경로
- 결정의 요지
- 슬라이스 개수
- "검증된 전제" 표에서 "확인 방법"이 "미확인"인 행. 없으면 "없음"
- 현재 브랜치 이름과 HEAD 해시. 승인하면 이 HEAD가 기준 커밋이 된다. 프로젝트 지시 파일이 feature 브랜치의 기반 브랜치를 정했으면(예: `dev`) 그 이름과 동기화 명령도 적어, 사용자가 승인 전에 기반 브랜치를 최신으로 맞출 수 있게 한다

사용자가 승인하기 전에는 브랜치를 만들지 않고 코드를 쓰지 않는다. 사용자가 고칠 곳을 말하면 spec을 고치고 다시 검토를 요청한다.

## 8. 승인 뒤

사용자가 승인하면 다음을 순서대로 한다. 메인 체크아웃은 이 절차 내내 지금 브랜치에 남는다. 메인 체크아웃에서 브랜치를 전환하는 명령은 쓰지 않는다. git 명령과 파일 이동은 메인 체크아웃 루트(conventions.md "폴더 구조"의 명령으로 얻는다)에서 실행한다. 아래 경로는 모두 그 루트 기준이다.

1. 현재 브랜치를 `git rev-parse --abbrev-ref HEAD`로 확인한다. 프로젝트 지시 파일이 feature 브랜치의 기반 브랜치를 정했는데 현재 브랜치가 그것과 다르면, 브랜치를 만들지 않고 두 이름을 보고하고 끝낸다. 사용자가 기반 브랜치로 옮긴 뒤 다시 승인한다.
2. 현재 HEAD를 기준 커밋으로 정한다. `git rev-parse HEAD`의 전체 해시와 현재 브랜치 이름을 spec 머리말의 "기준 커밋"에 적는다.
3. 브랜치 이름을 정한다. 프로젝트 지시 파일에 브랜치 이름 규칙이 있으면 그 규칙을 따르고, 없으면 stem을 그대로 쓴다. 이름을 머리말의 "브랜치"에 적는다.
4. 기준 커밋에서 feature 브랜치를 만들기만 한다. checkout하지 않는다.
   ```bash
   git branch <브랜치> <기준 커밋>
   ```
5. 그 브랜치로 worktree를 만든다. `.worktrees/`를 처음 만들 때는 conventions.md "gitignore 처리"를 따른다.
   ```bash
   git worktree add .worktrees/<stem> <브랜치>
   ```
6. 메인 체크아웃의 초안 `docs/minipowers/<stem>/spec.md`를 worktree의 같은 경로로 옮긴다. 메인 체크아웃에 남은 빈 `docs/minipowers/<stem>/` 폴더는 지운다. 2절에서 이 스킬이 `docs/minipowers/`를 새로 만들었고 그 폴더가 비었으면 함께 지운다.
   ```bash
   mkdir -p .worktrees/<stem>/docs/minipowers/<stem>
   mv docs/minipowers/<stem>/spec.md .worktrees/<stem>/docs/minipowers/<stem>/spec.md
   rmdir docs/minipowers/<stem>
   ```
7. worktree에서 spec.md 하나만 스테이징해 첫 커밋으로 넣는다. 커밋 메시지 형식은 지시 파일이 정한 것을 따른다.
   ```bash
   git -C .worktrees/<stem> add docs/minipowers/<stem>/spec.md
   git -C .worktrees/<stem> commit
   ```
8. 브랜치 이름, 커밋 해시, worktree의 절대경로(`<메인 체크아웃 루트>/.worktrees/<stem>`)를 보고한다. 인자가 todo 파일이었으면 다음 단계 줄 바로 위에 아래 한 줄을 쓴다. todo 파일은 커밋하지도 지우지도 않는다.
   ```
   todo 원문은 spec.md "원 요구"에 인용했다. <todo 경로>는 지워도 된다.
   ```
   마지막 줄에 다음 단계를 적고 끝낸다.
   ```
   다음 단계: `/spec-implement docs/minipowers/<stem>/`
   ```

첫 커밋 뒤에는 spec.md를 고치지 않는다. 그 뒤 spec에 결함이 드러나거나 요구가 달라지면 그 내용을 새 todo로 적어 이 스킬을 다시 호출해 새 spec을 쓴다. 그 spec의 "원 요구"에는 기존 spec 경로를 적고, 기준 커밋은 새로 호출한 시점의 HEAD다. 사이클이 spec 결함으로 멈췄으면 spec-implement가 그 todo를 `docs/minipowers/todo/<stem>-followup.md`로 이미 써 두었다(conventions.md "중단 todo").

이 스킬은 병합, push, Pull Request 생성을 하지 않는다.
