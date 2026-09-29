# specs

생성: <yyyy-mm-dd HH:MM>. spec-digest가 매번 전체를 다시 쓰므로 손으로 고친 내용은 다음 생성 때 사라진다.

| 날짜 | 제목 | 상태 | spec | digest |
|---|---|---|---|---|
| <yyyy-mm-dd> | <spec.md 첫 `# ` 줄> | <상태> | [spec](<stem>/spec.md) | [digest](<stem>/digest.md) 또는 없음 |

상태는 아래 표에서 위부터 처음 성립하는 것 하나다. digest.md의 존재는 상태가 아니라 digest 열에만 나타난다.

| 조건 | 상태 |
|---|---|
| `findings.md`의 `## Verdict` 절에 `Verdict: ready to merge` 줄이 있다 | ready to merge |
| `progress.md`에 `완료: head` 줄이 있다 | 구현 완료 |
| `progress.md`가 있고 `완료: head` 줄이 없다 | 구현 중 |
| `spec.md`만 있다 | 설계 |

## 생성 절차

1. `docs/minipowers/*/` 폴더를 전부 나열한다. `todo/`와 `spec.md`가 없는 폴더는 뺀다.
2. 폴더마다 한 행을 만든다.
   - 날짜: 폴더 이름의 앞 10자(`yyyy-mm-dd`)
   - 제목: spec.md의 첫 `# ` 줄에서 `# `를 뺀 것
   - 상태: 위 표로 정한 값 넷 중 하나
   - spec: `[spec](<stem>/spec.md)`
   - digest: digest.md가 있으면 `[digest](<stem>/digest.md)`, 없으면 "없음"
3. 행을 폴더 이름 내림차순으로 정렬한다. 같은 날짜 안에서는 일련번호가 큰 것이 위다.
4. 생성 시각을 적는다. `date '+%F %H:%M'` 또는 PowerShell `(Get-Date).ToString('yyyy-MM-dd HH:mm')`.
5. 이 파일에서 `## 생성 절차` 절은 빼고 쓴다.
