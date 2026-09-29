# CLAUDE.md

**pyan-minipowers**는 Claude/Codex 플러그인 마켓플레이스 저장소다. 주된 작업은 `packages/<plugin>/skills/`의 skill을 새로 만들거나 고치는 것이다. 명령은 루트 `package.json` scripts를 본다.

## skill 작성 방향

- **같은 입력이면 같은 종류의 산출물.** 산출물의 종류·개수가 모델 판단이나 숫자 상한으로 갈리지 않게 한다. 분기는 파일 존재·도구 존재·파일 내용처럼 관찰 가능한 조건만 쓴다.
- **방향을 주고 세부는 모델에 맡긴다.** 목적·정지 조건·산출물 형태를 분명히 하고, 모델이 알아서 할 절차를 길게 늘어놓지 않는다.
- 여러 skill이 공유하는 규약은 플러그인의 `_shared/` 같은 한 곳에 두고 참조한다.

## 배포 규칙

- **Claude와 Codex 양쪽에서 동작해야 한다.** skill은 공용이고 매니페스트만 따로다(`.claude-plugin/`, `.codex-plugin/`, `.agents/plugins/`). 새 skill이나 플러그인을 추가하면 양쪽 등록을 함께 맞춘다.
- **`dist/`는 배포물이다.** 손으로 고치지 말고 `pnpm run dist`로 다시 만들어 소스 변경과 함께 커밋한다.
- 변경을 배포할 때는 `pnpm run version:bump <plugin> <level>`로 해당 플러그인 버전을 올린다.
