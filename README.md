# pyan-minipowers

English | [한국어](README-ko.md)

**Settle the blueprint first, then make the AI-written code follow it.**

A marketplace for **[minipowers](packages/minipowers/README.md)**, a plugin for Claude Code and Codex. The blueprint is a spec file that a human has approved.

---

## The core

A single code change moves through four stages: **design → implement → review → record**. One skill owns each stage and leaves its result in a file.

| Stage | Invocation | Output | What the output is |
| --- | --- | --- | --- |
| 1. Design | `/spec-design <todo file or sentence>` | `spec.md` | The blueprint, settled through Q&A with the user and approved |
| 2. Implement | `/spec-implement <work folder>` | One commit per slice, `progress.md` | Commits that implement the spec slice by slice, and a progress record |
| 3. Review | `/spec-review <work folder>` | `findings.md` | Findings from checking the diff against the spec, in a fresh session that knows nothing of the implementation conversation |
| 4. Record | `/spec-digest <work folder>` | `digest.md`, `docs/minipowers/index.md` | A results-focused record verified against the source code, and an index of the work |

One change lives in one folder, `docs/minipowers/<yyyy-mm-dd-##-subject>/`. The `<work folder>` argument is that path.

Three principles are all there is.

- **Files connect the stages.** The spec file, not the conversation, links one stage to the next. If compact or a session swap wipes the conversation, the decisions survive, and each stage can be picked up in a new session or with a different model.
- **Skills run on explicit invocation.** In Claude Code you call `/spec-design`; in Codex you call `$spec-design`. In Claude Code, natural language such as "review this" never starts a skill. In neither tool does minipowers inject an instruction at session start telling the agent to use skills.
- **Decisions end at the design stage.** `spec-design` is the only skill that asks the user about the design. The other three follow the approved spec, and none of them merges, pushes, or opens a PR. A human closes it out.

The "mini" in the name does not mean few features; it means the agent is interfered with as little as possible. Per-stage inputs and outputs and the folder layout are in the [plugin README](packages/minipowers/README.md).

---

## 🚀 Install (once)

Type Claude Code commands in the **chat**, and Codex commands in the **terminal**.

| What you want to do | Claude Code | Codex CLI |
| --- | --- | --- |
| 1. Register the marketplace | `/plugin marketplace add pyan-labs/pyan-minipowers` | `codex plugin marketplace add pyan-labs/pyan-minipowers` |
| 2. Install the plugin | `/plugin install minipowers` | `codex plugin add minipowers@pyan-minipowers` |
| 3. Verify the install | `/plugin` | `codex plugin list` (list skills in a session with `/skills`) |
| Update | `/plugin marketplace update pyan-minipowers`, then `/plugin update minipowers@pyan-minipowers` | `codex plugin marketplace upgrade pyan-minipowers`, then `codex plugin add minipowers@pyan-minipowers` |
| Uninstall the plugin | `/plugin uninstall minipowers` | `codex plugin remove minipowers@pyan-minipowers` |
| Remove the marketplace | `/plugin marketplace remove pyan-minipowers` | `codex plugin marketplace remove pyan-minipowers` |

- When Claude Code asks for the install location (scope), choose **user**. If you install at project scope, the commands are visible only in that project.
- Installing registers the skills automatically. You don't need to write config files by hand or prepare anything per project.
- **Do not install superpowers alongside minipowers.** superpowers injects an instruction to use its own skills at every session, which conflicts with the minipowers flow.
- Changes are listed in the [CHANGELOG](CHANGELOG.md). After updating, use a new session, or reload the plugins in Claude Code with `/reload-plugins`.

---

## How is it different from superpowers?

[superpowers](https://github.com/obra/superpowers) is a fine plugin that teaches AI coding agents development habits such as brainstorming, TDD, planning, and review as skills. minipowers started from that idea and solves two problems we ran into differently.

| | superpowers | minipowers |
| --- | --- | --- |
| When a skill runs | Injects a "use skills" instruction at every session start, clear, and compact, so skills cut in even when you don't want them | Only when the user calls it with `/` |
| What links the stages | The conversation context | The spec files (`spec.md`, `progress.md`, `findings.md`) |

> minipowers is an independent project inspired by superpowers. It is not affiliated with the superpowers project or its author, Jesse Vincent. Some scripts were taken from superpowers (MIT); see [sources and license](packages/minipowers/README.md#sources).
