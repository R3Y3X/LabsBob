#!/usr/bin/env python3
"""Lint lab content fragments for the two most common authoring mistakes:

1. A non-prompt <pre><code> block that mixes prose (comment lines) with
   more than one runnable command, or holds multiple runnable commands
   without a `code-block--prompt` wrapper — these should be split into one
   copy button per command, per the site's code-block taxonomy (prompt /
   terminal / file / tree).
2. A lab step fragment (identified by data.js) that never tells the reader
   which folder to have open — no `lab-workspace-setup` block and no
   "Sigue en" / "Continúa" continuation language.

This is a heuristic linter, not a strict validator: it flags candidates for
a human to look at, and false positives are expected for legitimately
multi-line single commands (e.g. a `curl` call with line continuations) or
prompts that were manually reviewed. Run it after editing lab content:

    python3 scripts/lint_labs.py
"""
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
CONTENT_DIR = REPO_ROOT / "docs" / "content"
DATA_JS = REPO_ROOT / "docs" / "js" / "data.js"

COMMAND_RE = re.compile(
    r"^\s*(cd|ls|npm|npx|git|python3?|pip3?|mvn|java|docker|kubectl|helm|"
    r"curl|wget|open|mkdir|cp|mv|rm|source|export|chmod|ssh|scp|unzip|brew|"
    r"winget|sdk|yarn|pnpm|orchestrate|mkdocs|ansible|make|\./)\b"
)
CONTINUATION_RE = re.compile(r"\\\s*$")


def find_code_block_issues(html: str, path: Path) -> list[str]:
    issues = []
    for m in re.finditer(r"<pre><code[^>]*>(.*?)</code></pre>", html, re.S):
        start = m.start()
        # Determine whether this block (or its wrapping div) is a prompt.
        window = html[max(0, start - 300) : start]
        is_prompt = "code-block--prompt" in window.rsplit("<div class=\"code-block", 1)[-1] \
            if "<div class=\"code-block" in window else False
        if is_prompt:
            continue

        body = m.group(1)
        lines = [l for l in body.split("\n") if l.strip()]
        if not lines:
            continue

        # Merge lines ending in a backslash continuation with the next line.
        merged = []
        buf = ""
        for line in lines:
            buf += line
            if CONTINUATION_RE.search(line):
                buf = buf[:-1] + " "
                continue
            merged.append(buf)
            buf = ""
        if buf:
            merged.append(buf)

        cmd_lines = [l for l in merged if COMMAND_RE.match(l)]
        comment_lines = [l for l in merged if l.strip().startswith("#")]

        if len(cmd_lines) >= 2:
            line_no = html[:start].count("\n") + 1
            issues.append(
                f"{path}:{line_no} — {len(cmd_lines)} runnable commands in one "
                f"copy block (split into one code-block--terminal per command)"
            )
        elif cmd_lines and comment_lines:
            line_no = html[:start].count("\n") + 1
            issues.append(
                f"{path}:{line_no} — comment text mixed into a command block "
                f"(move explanation to a <p>, keep the block command-only)"
            )
    return issues


def find_missing_workspace_setup(html: str, path: Path, step_slug: str) -> list[str]:
    has_setup = "lab-workspace-setup" in html
    has_continuation = bool(
        re.search(
            r"\b(sigue en|contin[uú]a|misma conversaci[oó]n|misma terminal|"
            r"ya tiene(?:s)? (?:el |la |ssh|\.env)|desde la introducci[oó]n|"
            r"ya deber[ií]as tener|abre una terminal en|"
            r"(?:desde|en) la terminal de|terminal de <code>|"
            r"abre la carpeta|abra la carpeta|open folder|punto de partida)\b",
            html,
            re.I,
        )
    )
    if not has_setup and not has_continuation:
        return [f"{path} — no lab-workspace-setup block and no continuation language found"]
    return []


def get_step_files() -> list[tuple[str, str]]:
    """Return (file_path, step_slug) pairs referenced from data.js."""
    data = DATA_JS.read_text(encoding="utf-8")
    results = []
    for m in re.finditer(
        r"\{\s*slug:\s*'([^']+)'.*?file:\s*'(\./content/[^']+)'", data
    ):
        step_slug, file_path = m.group(1), m.group(2)
        results.append((file_path, step_slug))
    return results


def main() -> int:
    all_issues: list[str] = []

    for file_path, step_slug in get_step_files():
        full = REPO_ROOT / "docs" / file_path[2:]
        if not full.exists():
            all_issues.append(f"{file_path} — referenced from data.js but missing on disk")
            continue
        html = full.read_text(encoding="utf-8")
        rel = full.relative_to(REPO_ROOT)

        all_issues.extend(find_code_block_issues(html, rel))

        # Skip overview pages and single-page hubs — the workspace check is
        # about actual hands-on steps.
        if step_slug not in ("overview",):
            all_issues.extend(find_missing_workspace_setup(html, rel, step_slug))

    if not all_issues:
        print("No issues found.")
        return 0

    print(f"{len(all_issues)} issue(s) found:\n")
    for issue in all_issues:
        print(f"  {issue}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
