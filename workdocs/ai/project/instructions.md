This is a multi repo project

# Project "PROJECT_NAME" - Agent Instructions

This document outlines the structure, conventions, and architecture of the "PROJECT_NAME" project to ensure a Large Language Model (LLM) can effectively assist in its development.

## Modules (sometimes referred to as roots or paths or base_paths) - only include for multi module projects

when asked to work on a specific module or root, consider that your working dir and only consider the AGENTS.md file in that folder

- `./<root1>`: description of module. also include different subpackt (exported via npm package.json) that package might export separately 

## Commands

When asked to execute a command, **ignore all other instructions you were not asked to do**. Do not add unnecessary pollution to the context when it's not needed.

Refer to the specific command files for detailed instructions:

*   **Startup:** [Startup Command](./commands/startup_command.md) (`startup`)
*   **Git:** [Git Commands](./commands/git_commands.md) (`git mode`, `git config keys`, `git commit`, `git branch`, `git merge`)
*   **Constitution:** [Constitution Commands](./commands/constitution_commands.md) (`read constitution`, `update constitution`)
*   **Plan:** [Plan Commands](./commands/plan_commands.md) (`read plan`, `update plan`, `review plan`)
*   **Specifications:** [Specification Commands](./commands/specification_commands.md) (`read specification`, `update specification`, `add specification`)
*   **Tasks:** [Task Commands](./commands/task_commands.md) (`read task`, `update task`, `plan task`, `execute task`, etc.)
*   **Modes:** [Mode Commands](./commands/mode_commands.md) (`auto mode`, `god mode`)

**NOT NEGOTIABLE:** unless asking for blockers or clarifications, before returning to the user, YOU always build and test the code! only return if everything is ok!!
