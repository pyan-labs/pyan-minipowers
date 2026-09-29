# minipowers

English | [한국어](README-ko.md)

A Claude/Codex plugin that carries one code change through four stages: **design → implement → review → record**. It ships skills only, with no MCP server. What connects the stages is not the conversation context but **a single spec file**, so each stage can be picked up in a new session.

> The skill instructions (`SKILL.md`) and the shared conventions (`skills/_shared/conventions.md`) are written in Korean.

## Where it fits in the workflow

```
todo ──▶ /spec-design ──▶ spec.md ──▶ /spec-implement ──▶ commits + progress.md
                                            ▲                     │
                                            │ fix mode            ▼
                                       findings.md ◀──── /spec-review
                                            │
                                            ▼
                                       /spec-digest ──▶ digest.md + index.md
```

If the spec has to change after approval, `/spec-design --amend <work folder>` writes `amendment-<N>.md`, and work resumes from `/spec-implement`.

| Skill | Invocation | Input | Output |
|---|---|---|---|
| spec-design | `/spec-design <todo file or sentence>` | the todo, the codebase, Q&A with the user | `spec.md`, a feature branch, `.worktrees/<stem>`, the first commit |
| spec-design (amend) | `/spec-design --amend <work folder>` | the effective spec, progress.md, findings.md, Q&A with the user | `amendment-<N>.md`, one commit containing only that file |
| spec-implement | `/spec-implement <work folder>` | the effective spec, project instruction files, source code | one commit per slice, `progress.md` |
| spec-review | `/spec-review <work folder>` | the effective spec, the `base-commit..HEAD` diff | `findings.md` |
| spec-digest | `/spec-digest <work folder>` | the effective spec, progress.md, findings.md, source code | `digest.md`, `docs/minipowers/index.md` |

- spec-design takes decisions from the user through conversation. The other three ask nothing about the design; they stop only on the [four stop conditions](skills/_shared/conventions.md#정지-조건).
- The four skills run only when called with `/`. Because of `disable-model-invocation: true` in the frontmatter, natural language such as "review this" does not start them. Type `/spec` and each skill's `argument-hint` shows the argument format.
- spec-review runs in a fresh, independent session where the user chooses the model and effort. It may use a different LLM than the implementation did. Context 0 means no earlier conversation history, summary, or memory is passed on; the review relies on the saved spec, amendments, progress, and findings, the project instruction files, the codebase and git diff, and test results it runs itself. Both the first review and re-reviews work this way, and the review is never delegated automatically to a subagent. Extra review criteria go in the approved spec or amendment.
- None of the four skills merges, pushes, or opens a PR. What comes after a `ready to merge` verdict is up to the user, following the project's git rules.

## Where outputs go

```
docs/minipowers/
├── index.md
├── todo/<name>.md
└── <yyyy-mm-dd-##-subject>/
    ├── spec.md
    ├── amendment-<N>.md
    ├── progress.md
    ├── findings.md
    └── digest.md
```

One piece of work is one folder. The argument to all four skills is this folder path. An approved spec.md is never edited. An amendment is written by `/spec-design --amend <work folder>` into the same folder as `amendment-<N>.md` (N starts at 1), and the other skills read the "effective spec": spec.md with the amendments layered on in numeric order. Throwaway intermediates go in `.minipowers/` and the isolated workspace goes in `.worktrees/`; both are added to `.gitignore`. Details are in [skills/_shared/conventions.md](skills/_shared/conventions.md).

## What gets recorded

- TDD evidence: for every slice, progress.md gets either a `RED` line (the test that failed before implementation) or a `RED 없음` line ("no RED"). spec-review flags any slice that has neither.
- Baseline tests: before the first slice, the whole test suite runs once and the result goes in the progress.md header. A test that already failed at the base commit is not raised by spec-review as a finding against this change.
- Rebuttal: spec-implement may rebut a review finding it judges wrong, with reasons, instead of fixing it. The re-review checks the code and rules WITHDRAWN or NOT ADDRESSED.
- Slice model: if a slice in the spec carries `- 모델: <sonnet | opus | fable>` (모델 = "model"), parallel implementation launches that slice's subagent with that model.

## Working folder flow

The main checkout stays on the base branch (for example `dev`). Work happens in a second working folder, `.worktrees/<stem>`, which has the feature branch checked out (`git worktree`).

1. After approval, `/spec-design` creates the feature branch and `.worktrees/<stem>`, and commits spec.md there as the first commit. It does not change the main checkout's branch.
2. `/spec-implement`, `/spec-review`, and `/spec-digest` find `.worktrees/<stem>` even when called from the main checkout, and read and commit inside it. To look at the implementation in an IDE, open the `.worktrees/<stem>` folder.
   - If `.worktrees/<stem>` is missing, `/spec-implement` finds the local branch that holds spec.md and recreates the worktree. `/spec-review` and `/spec-digest` do not create a worktree; they tell you the branch name they found and ask you to call `/spec-implement` first.
3. A new worktree has none of the gitignored files (dependencies, local settings such as `.env`). Before implementation starts, `/spec-implement` prepares the worktree: it copies from the main checkout the files listed in a line of the project instruction file (CLAUDE.md and the like) such as `minipowers worktree 복사: .env, src/appsettings.Development.json` (복사 = "copy"), and runs the dependency install command. If a test fails because of a file that is not on the list, it stops instead of writing the failure off as pre-existing.
4. Merging is done by the user, following the project's git rules.

After merging, clean up from the root of the main checkout. The skills only tell you what to do; they delete nothing.

```bash
git worktree remove .worktrees/<stem>
git branch -d <branch>
rm -rf .minipowers/<stem>/
```

## Do not enable it together with superpowers

Do not enable the superpowers plugin and minipowers in the same project.

- superpowers' SessionStart hook injects `using-superpowers` at every session start, clear, and compact.
- As a result, superpowers skills such as brainstorming and test-driven-development cut in halfway through a minipowers procedure.
- minipowers' `disable-model-invocation` only prevents minipowers skills from being invoked automatically. It cannot stop superpowers skills from cutting in.

In a project that uses minipowers, turn the superpowers plugin off.

## Install and requirements

- Install `minipowers` from the Claude/Codex marketplace `pyan-minipowers`. In Claude Code use `/plugin install minipowers@pyan-minipowers`; in a Codex terminal use `codex plugin add minipowers@pyan-minipowers`. The workflow examples here use Claude's `/` notation; Codex's invocation prefix is `$`.
- The three scripts of spec-implement (`workspace`, `slice-brief`, `review-package`) are bash. On Windows, Git Bash is required.
- spec-review resolves relative paths to the shared conventions and templates from the directory of the SKILL.md it loaded. The other skills point to the shared conventions as `${CLAUDE_PLUGIN_ROOT}/skills/_shared/conventions.md` and to their own folder's templates and scripts as `${CLAUDE_SKILL_DIR}/<file>`. Claude Code substitutes these two variables in the skill body.
- spec-implement's parallel execution is used only when a tool that launches subagents (Claude Code's Agent) is available. Otherwise a single agent implements in order.

## Sources

The three scripts in `skills/spec-implement/scripts/` were taken from the scripts of the [superpowers](https://github.com/obra/superpowers) plugin (MIT, Jesse Vincent), with only the paths and title patterns changed. Each file's header states the origin, and the full original license is in [LICENSE-superpowers](skills/spec-implement/scripts/LICENSE-superpowers).

minipowers was inspired by superpowers, but it is an independent project unaffiliated with the superpowers project or its author.
