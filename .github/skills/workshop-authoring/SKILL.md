---
name: workshop-authoring
description: "Use when Workshop Creator creates or restructures the content of a workshop, also through introductions and supporting explanations. Apply progressive disclosure to hands-on workshop guides. "
user-invocable: true
---

# Workshop Authoring

## Goal

Produce a guide that an attendee can follow with optional explanations closed: the purpose is clear, the next action is visible, and deeper context is available without overwhelming the learning path.

## Documented decision: progressive disclosure

Give each level a short introduction stating its purpose, value, and relevant starting context. Put longer definitions, comparisons, architecture explanations, and methodology discussions in default-collapsed `<details>` blocks with descriptive `<summary>` labels.

This changes presentation, not the exercise contract. Keep required commands, starter prompts, success criteria, prerequisites, permission or licensing warnings, and human approval gates visible. Label observable checkpoints **Success Criteria**. Optional worked examples and reference commands may remain in labelled toggles.

For a new application scenario, show enough code structure to orient the learner before discovery or coding starts. Verify the described starter state; distinguish existing behavior from the feature to build. Do not turn that overview into a technical implementation recipe.

## Inputs and authority

Use the approved audience, learning outcomes, scope, guide paths, and authoritative references from Workshop Creator. Preserve its blueprint, safety boundaries, and phase gates. This skill does not authorize publishing, running paid workflows, changing credentials, or widening the feature scope.

## Flow

1. Read the affected levels and identify the main actions, necessary warnings, and supporting theory before moving content.
2. Keep the visible introduction concise. State the outcome and why it matters; reuse existing summaries that are already sufficient instead of adding a toggle mechanically.
3. Move supporting detail into balanced, default-closed `<details>` blocks. Reuse existing blocks where possible and avoid unnecessary nesting. A descriptive summary must explain what the learner can find inside.
4. Keep the hands-on path usable with the blocks closed. Preserve required steps, prompts, evidence checks, and approval gates outside them. Ask learners for context and decisions, not an outline or recipe that duplicates a specialist's native instructions.
   Introduce each command or starter prompt with its purpose and what it changes or checks. Success Criteria describe observable files, output, behavior, or recorded decisions; move definitions and capability explanations before the action. Do not use claims about what learners understand as proof of success.
5. Preserve page separators, level boundaries, assets, and required navigation targets. Do not place a MOAW page separator inside a detail block.
6. Run the repository's applicable local guide and prompt-extraction checks. Inspect the collapsed reading path and record missing live-rendering or CI evidence without claiming it passed.

## Success criteria

- Each affected level has a clear, short visible purpose and an obvious next action.
- Longer optional explanations have descriptive, default-closed disclosure blocks.
- The required learning path works without opening those blocks.
- Application context is accurate, with starter behavior separated from planned work.
- Markup, page boundaries, and prompt extraction remain valid.
- Scope, safety warnings, and human decision gates are preserved.

## Stop rules

If scope or audience is unclear, ask for the smallest clarification before restructuring. If an apparently optional passage contains required actions or a safety boundary, keep that part visible rather than hiding the whole passage. If a required local check fails, correct the in-scope issue before calling the guide ready.
