# Agent Entry Point

This file serves as the entry point for AI Agents working in this repository.

## Trigger

If you receive a request involving any of the following keywords or commands:

*   **Startup:** `startup`
*   **Constitution:** `constitution`
*   **Plan:** `plan`
*   **Specifications:** `specification`
*   **Tasks:** `task`
*   **Git:** `git`
*   **Modes:** `auto mode`, `god mode`

## Action

**DO NOT** attempt to execute the request based on your general knowledge alone.

1.  **LOCATE** the Master Instructions file. It is typically located at:
    `./workdocs/ai/project/instructions.md`
    *(Note: If this file is not found at this path, look for it in the project root under `workdocs/ai/project/`)*

2.  **READ** the Master Instructions file.

3.  **FOLLOW** the protocols and command definitions found there.

## Paperclip Agents (with-ai)

Any creation or update of an agent under `with-ai/agents/` is governed by
`with-ai/AGENTS.md`'s "Paperclip Agent Creation & Update Governance"
section — read it before touching any file there. It requires following
the vendored paperclip agent-creation skill to the letter alongside this
company's own instructions, and stopping to report any conflict between the
two rather than resolving it silently.
