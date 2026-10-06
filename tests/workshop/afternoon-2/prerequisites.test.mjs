import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const workshop = readFileSync(new URL('../../../docs/afternoon-2/workshop.md', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const runner = readFileSync(new URL('./run-lab.sh', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const testerReadme = readFileSync(new URL('./README.md', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const overview = readFileSync(new URL('../../../README.md', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const level3 = workshop.slice(workshop.indexOf('# Level 3:'), workshop.indexOf('# Level 4:'));
const phaseInvocation = (phase) => level3.match(new RegExp(
  '```text\\n(/hve-core:' + phase + '\\n[\\s\\S]*?)\\n```',
))?.[1];
const phasePrompt = (phase) => phaseInvocation(phase)?.split('\n').slice(1).join('\n').trim();

test('Level 3 publishes through a reviewed PR and proceeds directly to Level 4', () => {
  assert.doesNotMatch(workshop, /^# Break$|^  - 'Break'$|Before leaving your machine|data-title="After the break"/m);
  const pages = workshop.replace(/^---\n[\s\S]*?\n---\n/, '').split(/\n\n---\n\n/);
  const level3Index = pages.findIndex((page) => /^# Level 3:/m.test(page));
  assert.ok(level3Index >= 0);
  assert.match(pages[level3Index + 1], /^# Level 4:/m);
  assert.doesNotMatch(level3, /^# Level 4:/m);
  assert.doesNotMatch(runner, /break-status|Working tree clean before the break/);

  const branch = level3.indexOf('Create and switch to feature/playlist-slice');
  const implement = level3.indexOf('### Step 1: Ask RPI to implement');
  const reviewSection = level3.indexOf('## Review phase');
  const review = level3.indexOf('### Step 1: Ask RPI to review', reviewSection);
  const push = level3.indexOf('Create a pull request for the committed Level 3');
  const humanGate = level3.indexOf('A human reviewer inspects and approves');
  const mergeSync = level3.indexOf('Verify that the Level 3 PR is merged');
  assert.ok(branch >= 0 && branch < implement, 'feature branch precedes implementation');
  assert.ok(review >= 0 && review < push, 'local RPI review precedes publication');
  assert.ok(push < humanGate && humanGate < mergeSync, 'publication, human review, and default-branch sync are ordered');
  assert.match(level3, /Nothing is published until you confirm the push and PR creation/);
  assert.match(level3, /default branch includes the merged Level 3 pull request/);
  assert.doesNotMatch(level3, /You do not push until Level 4/);

  const l3Replay = runner.slice(runner.indexOf('copilot_prompt l3-research'), runner.indexOf('step l4-copy-apm'));
  assert.ok(l3Replay.indexOf('step l3-feature-branch') < l3Replay.indexOf('copilot_prompt l3-implement'));
  assert.ok(l3Replay.indexOf('step l3-review-npm') < l3Replay.indexOf('step l3-pr-push'));
  assert.ok(l3Replay.indexOf('step l3-pr-create') < l3Replay.indexOf('skip_step l3-human-review-merge'));
  assert.ok(l3Replay.indexOf('skip_step l3-human-review-merge') <
    l3Replay.indexOf('step l3-sandbox-merge-translation'));
  assert.ok([...l3Replay.matchAll(/\[ "\$STEP_FAILED" -eq 0 \] \|\| exit 1/g)].length >= 8,
    'failed checks, review, publication, or translation stop the dependent replay');
  assert.doesNotMatch(l3Replay, /--admin|--force|git push(?: origin)? main/);
  assert.match(l3Replay, /sandbox-only continuation; automatic merge is not human review/);
  assert.match(testerReadme, /If the sandbox token cannot publish the branch\/PR or safely merge without a bypass, the replay stops before Level 4/);
  assert.match(testerReadme, /automated merge is not human review, human acceptance, or evidence of live ruleset enforcement/);
});

test('Level 4 preserves the pinned installation without maintainer verification notes', () => {
  const level4 = workshop.slice(workshop.indexOf('# Level 4:'), workshop.indexOf('# Level 5:'));
  assert.doesNotMatch(level4, /Documented capability plus live verification|Live verification for this workshop|release-tag pins failed/);
  assert.doesNotMatch(level4, /```(?:powershell|cmd)|Copy-Item|New-Item|\.\\/);
  assert.match(level4, /```bash\ncp solutions\/afternoon-2\/apm\.yml \.\/apm\.yml\n```/);
  assert.match(level4, /microsoft\/hve-core#1dbd6a7ea90b74accaf8c809262e38952bd4c359/);
  assert.match(level4, /apm install --target copilot/);
  assert.match(runner, /cp solutions\/afternoon-2\/apm\.yml \.\/apm\.yml/);
  const topic = level4.slice(level4.indexOf('## Topic'), level4.indexOf('<details>'));
  const visibleLines = topic.split('\n').filter((line) => line.trim() && !line.startsWith('## Topic'));
  assert.match(level4, /^# Level 4: APM-governed repository agents$/m);
  assert.match(workshop, /^  - 'Level 4: APM-governed repository agents'$/m);
  assert.match(overview, /^\| 4 \| APM and repository agents \|/m);
  assert.ok(visibleLines.length <= 5, `${visibleLines.length} visible topic lines`);
  assert.doesNotMatch(topic, /```/);
  for (const phrase of [
    'APM moves HVE-Core from your personal install into this repository',
    'manifest pins the dependency; the lockfile records its resolution',
    'Copilot reads deployed profiles and skills',
    'policy and audit verify them',
    'Level 5 requires that audit before cloud-agent PRs merge',
    'does not run RPI or change the playlist',
  ]) assert.ok(topic.includes(phrase), phrase);
  assert.match(level4, /lockfile records APM's\nresolved dependency state/);
  assert.match(level4, /does not guarantee identical behavior across client or\nmodel versions/);
  assert.match(level4, /deployment layout for this workshop, not an AI model/);
  assert.match(level4, /Managed settings may prevent local disabling/);
  assert.match(level4, /does not disable a separate VS Code extension or plugin/);
});

test('Level 4 demonstrates a temporary deny without widening the original allowlist', () => {
  const level4 = workshop.slice(workshop.indexOf('# Level 4:'), workshop.indexOf('# Level 5:'));
  const installation = level4.slice(level4.indexOf('## Install HVE-Core through APM'),
    level4.indexOf('## Apply repository policy'));
  const publication = level4.slice(level4.indexOf('## Publish the method and its audit'));
  const policy = workshop.slice(workshop.indexOf('## Apply repository policy'),
    workshop.indexOf('## Publish the method and its audit'));
  assert.match(installation, /cp solutions\/afternoon-2\/apm\.yml \.\/apm\.yml[\s\S]*?\*\*Decision check:\*\* Which exact HVE-Core commit SHA and deployment target are selected in `apm\.yml`\?/);
  assert.match(policy, /```bash\ncp solutions\/afternoon-2\/apm-policy\.yml \.\/apm-policy\.yml\n```/);
  assert.match(policy, /cp solutions\/afternoon-2\/apm-policy\.yml \.\/apm-policy\.yml[\s\S]*?\*\*Decision check:\*\* Which dependency source pattern is allowed, and which executable namespace is denied\?/);
  assert.match(publication, /cp solutions\/afternoon-2\/\.github\/workflows\/apm-audit\.yml \.github\/workflows\/apm-audit\.yml[\s\S]*?\*\*Decision check:\*\* Does this workflow reinstall packages or audit the committed context as-is\?/);
  const demonstration = policy.slice(policy.indexOf('### Step 3:'));
  assert.match(demonstration, /\*\*Learner edit:\*\* Keep the allowlist unchanged and add a temporary `dependencies\.deny` entry for `microsoft\/hve-core`/);
  assert.match(demonstration, /allow:\n    - "microsoft\/\*\*"\n  deny:\n    - "microsoft\/hve-core"/);
  assert.match(demonstration, /Run `apm audit --ci --policy apm-policy\.yml` again\.[\s\S]*?Remove only the temporary `deny` entry and rerun the audit/);
  assert.match(demonstration, /Remove only the temporary `deny` entry/);
  assert.match(demonstration, /Restore a passing audit before committing/);
  assert.match(runner, /policy-before-deny\.yml/);
  assert.doesNotMatch(runner, /sed -i '.*deny:.*allow:/);
  assert.match(policy, /cp solutions\/afternoon-2\/apm-policy\.yml/);
  assert.match(publication, /mkdir -p \.github\/workflows/);
  assert.match(publication, /cp solutions\/afternoon-2\/\.github\/workflows\/apm-audit\.yml/);
  assert.match(policy, /no `apm experimental enable` command is needed/);
  assert.doesNotMatch(policy, /validated command used the experimental policy path/);
});

test('Level 4 restores curated registration and install before the APM transition', () => {
  const level4 = workshop.slice(workshop.indexOf('# Level 4:'), workshop.indexOf('# Level 5:'));
  assert.match(level4, /copilot plugin marketplace add OWNER\/REPO/);
  assert.match(level4, /copilot plugin install hve-core@contoso-plugin-marketplace/);
  assert.ok(level4.indexOf('copilot plugin install') < level4.indexOf('apm install --target copilot'));
  assert.match(level4, /No Java runtime or Microsoft 365 account is required/);
  assert.doesNotMatch(level4, /cp -R solutions\/afternoon-2\/plugins/);
  const replay = runner.slice(runner.indexOf('# ---------------------------------------------------------------- Level 4'));
  assert.match(replay, /step l4-marketplace-install/);
  assert.match(replay, /skip_step l4-marketplace-vscode/);
  assert.match(replay, /skip_step l4-marketplace-app/);
});

test('Level 4 verifies repository agents before disabling the personal plugin', () => {
  const level4 = workshop.slice(workshop.indexOf('# Level 4:'), workshop.indexOf('# Level 5:'));
  const disable = level4.indexOf('copilot plugin disable hve-core');
  assert.ok(level4.indexOf('.github/agents/rpi-agent.agent.md') < disable);
  assert.match(level4, /copilot plugin disable hve-core@contoso-plugin-marketplace\ncopilot plugin list --json/);
  assert.match(level4, /Managed settings may prevent local disabling/);
  assert.match(level4, /does not disable a separate VS Code extension or plugin/);
  const transition = readFileSync(new URL('./marketplace.sh', import.meta.url), 'utf8');
  assert.ok(transition.indexOf('test -f .github/agents/rpi-agent.agent.md') <
    transition.indexOf('copilot plugin disable hve-core@contoso-plugin-marketplace'));
  const image = readFileSync(new URL('../../../docs/afternoon-2/assets/l4-duplicate-agent-entries.png', import.meta.url));
  assert.deepEqual([...image.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  const inventory = readFileSync(new URL('../../../docs/afternoon-2/assets/README.md', import.meta.url), 'utf8');
  assert.match(inventory, /`l4-duplicate-agent-entries\.png`/);
});

test('starter readiness belongs to the introduction, not a separate level', () => {
  const introduction = workshop.indexOf('# AI SDLC with GitHub and GitHub Copilot');
  const readiness = workshop.indexOf('## Starter readiness (prerequisite)');
  const firstLevel = workshop.indexOf('# Level 1:');
  assert.ok(introduction >= 0 && readiness > introduction && firstLevel > readiness);
  assert.doesNotMatch(workshop, /Level 0|Baseline Afternoon 2 starter/);
  assert.match(workshop.slice(readiness, firstLevel), /dotnet test\nnpm --prefix src\/front test/);
  assert.match(workshop.slice(readiness, firstLevel), /Report any staged, unstaged/);
  assert.match(workshop, /since the initial commit of this workshop repository/);
});

test('lab runner checks prerequisite readiness without creating a baseline commit', () => {
  const readiness = runner.slice(runner.indexOf('# ---------------------------------------------------------------- Starter readiness'),
    runner.indexOf('# ---------------------------------------------------------------- Level 1'));
  for (const id of ['pre-starter-layout', 'pre-dotnet-test', 'pre-npm-test', 'pre-clean-tree']) {
    assert.match(readiness, new RegExp(`step ${id} preflight `));
  }
  assert.match(readiness, /'npm --prefix src\/front test'/);
  assert.match(readiness, /tree_clean_check/);
  assert.doesNotMatch(readiness, /git add|git commit|Level 0/);
});

test('DT prompts allow local tracking notes but preserve the implementation boundary', () => {
  const start = workshop.slice(workshop.indexOf('/hve-core:dt-start-project.prompt\n'),
    workshop.indexOf('## Extended track: Product Manager'));
  assert.match(start, /sample all nine HVE Design Thinking methods within a 10–15 minute/);
  assert.match(start, /Now follow the chat for the next 10 minutes/);
  assert.match(start, /the conversation is the exercise/);
  assert.match(start, /Keep working notes under \.copilot-tracking\/ only/);
  assert.match(start, /application code, tests, and published documentation stay unchanged/);
  assert.match(start, /Auto intelligence selects the model; it does not grant write permissions/);
  assert.match(start, /Keep normal approval prompts/);
  assert.doesNotMatch(start, /--assisted-approval|AI-assisted permissions|\/settings experimental/);
  assert.doesNotMatch(start, /Do not edit files\./);
  assert.match(start, /Out of scope:\*\* users, authentication, persistence, reorder, remove, search, and playlist creation/);
});

test('DT sampler permits exploration and keeps its shortcuts distinct from implementation', () => {
  const dt = workshop.slice(workshop.indexOf('# Level 2:'), workshop.indexOf('## Extended track: Product Manager'));
  for (const method of [
    'Scope Conversations', 'Design Research', 'Input Synthesis', 'Brainstorming', 'User Concepts',
    'Low-Fidelity Prototypes', 'High-Fidelity Prototypes', 'User Testing', 'Iteration at Scale',
  ]) assert.ok(dt.includes(method), method);
  assert.match(dt, /Start with a user problem, not a prescribed feature/);
  assert.match(dt, /These shortcuts do not satisfy the full methods' evidence gates/);
  assert.match(dt, /not a result that your DT session must produce or validate/);
  assert.match(dt, /HTTP 409/);
  assert.match(dt, /leave the duplicate-feedback UX choice open/i);
  assert.match(dt, /Do not claim that sampling validated the concept or completed a method/);
  assert.match(runner, /copilot_prompt l2-dt-start/);
  assert.match(runner, /step l2-dt-notes/);
});

test('Level 2 names native DT handoffs without treating the sampler as completed evidence', () => {
  const handoff = workshop.slice(workshop.indexOf('## Debrief and hand off to the shared implementation slice'),
    workshop.indexOf('### Step 2: Review the recap and coding scope'));
  for (const prompt of [
    'dt-handoff-problem-space.prompt', 'dt-handoff-solution-space.prompt',
    'dt-handoff-implementation-space.prompt', 'dt-canonical-deck.prompt', 'dt-figma-export.prompt',
  ]) assert.ok(handoff.includes(prompt), prompt);
  assert.match(handoff, /```text\n\/hve-core:dt-handoff-implementation-space\.prompt\n\nUse project slug/);
  assert.match(handoff, /Use project slug music-catalog-listening-experience/);
  assert.match(handoff, /if no Implementation Space method is complete/);
  assert.match(handoff, /workshop-only recap/);
  assert.match(handoff, /it does not start implementation/);
  assert.match(handoff, /Figma MCP server and permission/);
  assert.match(handoff, /feature is chosen for the workshop, not a result that your DT session must produce or validate/);
  assert.match(handoff, /requirements are supplied by the facilitator/);
  assert.match(handoff, /A formal DT handoff is not needed for this workshop recap/);
  for (const label of [
    'User-visible capability', 'API endpoints', 'Front-end states',
    'Duplicate handling', 'Accessibility', 'Out of scope',
  ]) assert.ok(handoff.includes(`- **${label}:**`), label);
});

test('Level 2 inspects coach-generated notes without prescribing a save prompt', () => {
  const checkpoint = workshop.slice(workshop.indexOf('### Step 3: Explore the local coaching notes'),
    workshop.indexOf('## Extended track: Product Manager'));
  assert.match(checkpoint, /you do not need to send a separate save prompt/);
  assert.match(checkpoint, /Once it has finished writing/);
  assert.match(checkpoint, /Open a coach-created note in Explorer/);
  assert.match(checkpoint, /local, ignored working notes/);
  assert.match(checkpoint, /Source Control view to review the staged diff/);
  assert.match(checkpoint, /dt-coach-tracking-folder\.png/);
  assert.doesNotMatch(checkpoint, /Save or update the local working notes|Get-ChildItem|git status/);
  const curator = workshop.slice(workshop.indexOf('## Curate what you commit'), workshop.indexOf('# Level 3:'));
  assert.match(curator, /Open each staged file to review the diff that will be committed/);
  assert.doesNotMatch(curator, /git status/);
});

test('tester extracts the exploration and implementation handoff separately', () => {
  const output = mkdtempSync(join(tmpdir(), 'dt-prompts-'));
  try {
    const result = spawnSync(process.execPath, [
      fileURLToPath(new URL('./extract-prompts.mjs', import.meta.url)),
      fileURLToPath(new URL('../../../docs/afternoon-2/workshop.md', import.meta.url)),
      output,
    ], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    const start = readFileSync(join(output, 'dt-start.txt'), 'utf8');
    const brief = start.split('\n').slice(1).join('\n').trim();
    const summary = readFileSync(join(output, 'dt-summary.txt'), 'utf8');
    assert.match(start, /^\/hve-core:dt-start-project\.prompt\n\nProject name:/);
    assert.match(readFileSync(join(output, 'dt-method-next.txt'), 'utf8'), /^\/hve-core:dt-method-next\.prompt\n\nAssess project/);
    for (const phase of ['research', 'plan', 'implement', 'review']) {
      const prompt = readFileSync(join(output, `rpi-${phase}.txt`), 'utf8').trim();
      assert.equal(prompt, phaseInvocation(`rpi-${phase}`));
      assert.match(prompt, new RegExp(`^/hve-core:rpi-${phase}\\n\\n\\S`));
      assert.match(runner, new RegExp(`copilot_prompt l3-${phase} `));
    }
    assert.doesNotMatch(runner, /copilot_prompt l3-(research|plan|implement|review)-command|l2-dt-brief/);
    assert.equal(brief.trim().split('\n').length, 3);
    assert.match(brief, /10–15 minute learning exercise/);
    assert.doesNotMatch(start, /POST \/api\/playlist\/tracks/);
    assert.match(summary, /shared playlist delivery contract in docs\/afternoon-2\/workshop\.md/);
    assert.doesNotMatch(summary, /exactly six bullets|POST \/api\/playlist/);
    assert.match(readFileSync(join(output, 'dt-record.txt'), 'utf8'), /Use author mode/);
    const adr = readFileSync(join(output, 'adr-author.txt'), 'utf8').trim();
    assert.equal(adr.split('\n').length, 1);
    assert.match(adr, /^\/hve-core:adr-author Create the Music Catalog playlist storage ADR;/);
    assert.equal(adr, workshop.match(/```text\n(\/hve-core:adr-author[^\n]+)\n```/)?.[1]);
    const dtExample = readFileSync(join(output, 'dt-example-01.txt'), 'utf8');
    const brdExample = readFileSync(join(output, 'brd-example-06.txt'), 'utf8');
    assert.match(dtExample, /tech-savvy hi-fi enthusiasts/);
    assert.match(brdExample, /Every participant ships the slice with passing tests/);
    assert.match(readFileSync(join(output, 'dt-example-09.txt'), 'utf8'), /what was only planned/);
    assert.match(readFileSync(join(output, 'curated-solutions.txt'), 'utf8'), /Toggle example: a step-by-step BRD conversation/);
    assert.match(readFileSync(join(output, 'replay-policy.txt'), 'utf8'), /Do not invent learner answers/);
    assert.match(readFileSync(join(output, 'replay-policy.txt'), 'utf8'), /Do not sign off, approve waivers/);
  } finally {
    rmSync(output, { recursive: true });
  }
});

test('HVE capabilities are exposed without supplying the agents document outlines or native procedures', () => {
  assert.match(workshop, /Let HVE carry the procedure/);
  assert.match(workshop, /Do not supply a document outline, grading rubric, or coding recipe/);
  const dt = workshop.slice(workshop.indexOf('# Level 2:'), workshop.indexOf('## Extended track: Product Manager'));
  assert.match(dt, /```text\n\/hve-core:dt-method-next\.prompt\n\nAssess project/);
  assert.match(dt, /missing exit evidence is not permission to mark a method complete/);
  assert.match(dt, /Let DT Coach choose its questions and activities/);
  assert.match(workshop, /Let BRD Builder guide its own Discover, Define, and Govern process/);
  assert.match(workshop, /Let PRD Builder run its own discovery, authoring, traceability, and quality checks/);
});

test('the reviewed delivery brief is curated before the builders consume it', () => {
  const curationLinks = [...workshop.matchAll(/\[Curate what you commit\]\(([^)]+)\)/g)];
  assert.equal(curationLinks.length, 2);
  for (const [, target] of curationLinks) assert.equal(target, '?step=2#curate-what-you-commit');
  const record = workshop.indexOf('Write a curated Design Thinking decision record');
  const brd = workshop.indexOf('### Step 3: Write the BRD');
  const prd = workshop.indexOf('### Step 4: Turn the BRD into a PRD');
  assert.ok(record >= 0 && record < brd && brd < prd);
  assert.equal(workshop.match(/Write a curated Design Thinking decision record/g).length, 1);
  assert.match(workshop, /\/agent hve-core:documentation/);
  assert.match(runner, /copilot_prompt l2-dt-record.*--agent hve-core:documentation/);
  assert.ok(runner.indexOf('copilot_prompt l2-dt-record') < runner.indexOf('copilot_prompt l2-brd-start'));
  assert.match(runner, /skip_step l2-method-next/);
  const curator = workshop.slice(workshop.indexOf('## Curate what you commit'), workshop.indexOf('# Level 3:'));
  assert.doesNotMatch(curator, /Write a curated Design Thinking decision record/);
});

test('developer essentials stay visible while the detailed RPI lecture is collapsed', () => {
  const developer = level3.slice(level3.indexOf('## Work as a developer'), level3.indexOf('## Research phase'));
  const detailStart = developer.indexOf('<details>');
  const essentials = developer.slice(0, detailStart);
  assert.ok(detailStart > 0);
  assert.match(essentials, /coordinates four skills: Research, Plan, Implement, and Review/);
  assert.match(essentials, /Work through each phase with me/);
  assert.doesNotMatch(essentials, /\| Engineer guide stage|Context engineering:|### One agent runs/);
  assert.match(developer, /<details>\n<summary>How RPI Agent coordinates developer work<\/summary>/);
  assert.ok(developer.indexOf('### Context engineering:') > detailStart);
  assert.ok(developer.indexOf('### One agent runs') > detailStart);
  assert.ok(developer.trim().endsWith('</details>'));
});

test('RPI prompts consume the reviewed requirements and preceding artifacts instead of scripting the work', () => {
  const research = phasePrompt('rpi-research');
  const plan = phasePrompt('rpi-plan');
  const implement = phasePrompt('rpi-implement');
  const review = phasePrompt('rpi-review');
  for (const prompt of [research, plan, implement, review]) {
    assert.ok(prompt);
    assert.doesNotMatch(prompt, /Known repository facts:|The plan must include:|Requirements:|Check:|Do not edit files/);
  }
  assert.match(research, /docs\/project-planning\/playlist-design-decisions\.md/);
  assert.match(research, /Do not change application files/);
  assert.match(plan, /<research-path>/);
  assert.match(plan, /options and their trade-offs so I can decide/);
  assert.equal(implement, 'Implement the approved plan at <plan-path>.');
  assert.match(review, /<plan-path>.*<changes-path>/);
  assert.doesNotMatch(review, /make fixes|deferred finding|dotnet test|npm test/);
  assert.match(level3, /small, well-understood change may need only a direct coding request/i);
  assert.match(level3, /default plan critique/);
  assert.match(level3, /Review is read-only/);
  assert.match(level3, /A clean review is valid/);
  assert.doesNotMatch(level3, /Keep one:|newest research file|Commit review checkpoint|option B/);
});

test('the shared brief specifies the API and empty state before RPI implementation', () => {
  const handoff = workshop.slice(workshop.indexOf('## Debrief and hand off to the shared implementation slice'),
    workshop.indexOf('### Step 2: Review the recap and coding scope'));
  assert.match(handoff, /POST \/api\/playlist\/tracks.*JSON body containing `trackId`/);
  assert.match(handoff, /HTTP 404.*HTTP 409/);
  assert.match(handoff, /Your playlist is empty\. Add a track to get started\./);
  assert.doesNotMatch(workshop, /POST \/api\/playlist\/\{trackId\}/);
  assert.match(runner, /http_status POST http:\/\/localhost:5080\/api\/playlist\/tracks "\$unknown_payload"/);
  assert.match(runner, /JSON\.stringify\(\{trackId:tracks\[0\]\.id\}\)/);
  assert.doesNotMatch(runner, /api\/playlist\/\$first/);
});

test('playlist POST fixtures preserve the catalog id type and use an unknown numeric id', () => {
  const knownExpression = runner.match(/payload=\$\(node -e '([^']+)'/)[1];
  const unknownExpression = runner.match(/unknown_payload=\$\(node -e '([^']+)'/)[1];
  const output = mkdtempSync(join(tmpdir(), 'playlist-payload-'));
  const catalog = join(output, 'tracks.json');
  try {
    for (const id of [1, 't1']) {
      writeFileSync(catalog, JSON.stringify([{ id }]));
      const result = spawnSync(process.execPath, ['-e', knownExpression, catalog], { encoding: 'utf8' });
      assert.equal(result.status, 0, result.stderr);
      assert.deepEqual(JSON.parse(result.stdout), { trackId: id });
    }
    writeFileSync(catalog, JSON.stringify([{ id: 1 }, { id: 12 }]));
    const result = spawnSync(process.execPath, ['-e', unknownExpression, catalog], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout), { trackId: 13 });
  } finally {
    rmSync(output, { recursive: true });
  }
});

test('the RPI tester uses returned same-task artifacts and keeps Review read-only', () => {
  const rpi = runner.slice(runner.indexOf('# ---------------------------------------------------------------- Level 3'),
    runner.indexOf('# ---------------------------------------------------------------- Level 4'));
  assert.match(rpi, /resolve_rpi_artifact research/);
  assert.match(rpi, /resolve_rpi_artifact plan.*"\$RPI_TASK_SLUG"/);
  assert.match(rpi, /resolve_rpi_artifact changes.*"\$RPI_TASK_SLUG"/);
  assert.match(rpi, /resolve_rpi_artifact review.*"\$RPI_TASK_SLUG"/);
  assert.match(rpi, /grep -qi 'dotnet test' "\$RPI_PLAN_PATH"/);
  assert.doesNotMatch(rpi, /research mentions|review returns a pass\/fail summary|Review playlist slice/);
  assert.match(rpi, /review does not create source commits/);
  const backlogFinding = workshop.slice(workshop.indexOf('### Step 5: Turn a deferred review finding into an issue'),
    workshop.indexOf('### Step 6: Run daily backlog'));
  assert.match(backlogFinding, /If the review was clean, skip this step/);
  assert.doesNotMatch(backlogFinding, /newest review file|at least two open issues/);
  assert.match(runner, /skip_step l5-seed-issues/);
  assert.doesNotMatch(runner, /two synthetic review-finding issues|at least three open issues/);
});

test('ADR authoring prefills the captured choices in one line without bypassing native gates', () => {
  const adr = level3.slice(level3.indexOf('### Step 1: Record the in-memory decision as an ADR'),
    level3.indexOf('### Step 2: Review the change with the Code Review agent'));
  assert.match(adr, /repository-root Copilot session/);
  assert.match(adr, /type `\/adr-author`.*press \*\*Tab\*\*/);
  const request = adr.match(/```text\n(\/hve-core:adr-author[^\n]+)\n```/)?.[1];
  assert.ok(request, 'one-line native ADR request');
  for (const choice of [
    'entry mode: from-planner-handoff', 'slug: music-catalog-playlist',
    'output template: madr-v4', 'handoff payload: <plan-path>', 'decision-makers: TPM',
    'repo visibility: <repo-visibility>', 'diagram format: mermaid',
    'ASR triggers: performance, maintainability, availability (all three apply)',
    'decision: Option A (host-owned lock-protected in-memory store)',
    'autonomy tier: partial', 'target status: accepted', 'effort: S',
    'backlog target: GitHub work items',
  ]) assert.ok(request.includes(choice), choice);
  assert.match(adr, /does not replace the agent selection/);
  assert.doesNotMatch(adr, /\/hve-code:|\/adr-creator/);
  assert.match(adr, /exact reviewed plan path returned in Level 3/);
  assert.match(adr, /actual visibility.*`private`.*`public`/);
  assert.doesNotMatch(request, /2026-10-05|repo visibility: public/);
  assert.match(adr, /Confirm or revise them.*reviewed plan/);
  assert.match(adr, /not an approval shortcut/);
  assert.match(adr, /approval before external writes or handoff persistence/);
  assert.match(adr, /https:\/\/microsoft\.github\.io\/hve-core\/docs\/reference\/agents\/project-planning\/adr-creation\//);
  assert.match(adr, /adr-plans\/<project-slug>\/state\.json/);
  for (const option of ['capture', 'from-planner-handoff', 'adopt-template', 'madr-v4', 'y-statement']) {
    assert.ok(adr.includes(`| \`${option}\` |`), option);
  }
  assert.match(adr, /Project slug.*music-catalog-playlist/);
  assert.match(adr, /selecting the mode does not create that handoff/);
  assert.match(adr, /Frame and Decide summaries/);
  assert.match(adr, /Govern allocates the ADR number/);
  assert.match(adr, /docs\/planning\/adrs\//);
  assert.doesNotMatch(adr, /Consequences to cover:|ask at most two clarifying questions/);
  assert.doesNotMatch(workshop, /`docs\\decisions\\`/);
});

test('Run the app uses the current forwarded frontend address and supplied Ports screenshot', () => {
  const run = level3.slice(level3.indexOf('### Step 2: Run the app'),
    level3.indexOf('### Step 3: Commit implementation checkpoint'));
  assert.match(run, /Start each terminal from the repository root/);
  assert.match(run, /```bash\ncd src\/api\ndotnet run\n```/);
  assert.match(run, /```bash\ncd src\/front\nnpm run dev\n```/);
  assert.doesNotMatch(workshop, /^cd .*\\/m);
  assert.match(run, /\*\*Ports\*\* tab beside \*\*Terminal\*\*/);
  assert.match(run, /\*\*Forwarded Address\*\* for the frontend/);
  assert.match(run, /normally \*\*5173\*\*/);
  assert.match(run, /not the API \(\*\*5080\*\*\)/);
  assert.match(run, /assets\/l3-frontend-ports\.png/);
  const image = readFileSync(new URL('../../../docs/afternoon-2/assets/l3-frontend-ports.png', import.meta.url));
  assert.deepEqual([...image.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
});

test('HVE commands are selected with Tab and include their task in the same code block', () => {
  const handbook = readFileSync(new URL('../../../docs/maintainer-handbook.md', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
  for (const document of [workshop, handbook]) {
    assert.match(document, /press \*\*Tab\*\*/);
    const blocks = [...document.matchAll(/```text\r?\n([\s\S]*?)\r?\n```/g)];
    for (const [, body] of blocks) {
      if (!/^\/(?:hve-core:|rpi\b|rpi-|dt-|backlog-|git-commit\b|pull-request\b)/.test(body)) continue;
      const invocation = body.match(/^(\/hve-core:[\w.-]+)(?:[ \t]+|\n)([\s\S]+)$/);
      assert.ok(invocation, `selected HVE command with task: ${body}`);
      const [, command, task] = invocation;
      assert.ok(task.trim(), `task must accompany ${command}`);
      assert.doesNotMatch(task, /^\/hve-core:/m, 'one invocation per block');
    }
  }
  assert.match(workshop, /do not submit the command line first/);
});

test('extraction rejects a command-only HVE invocation', () => {
  const output = mkdtempSync(join(tmpdir(), 'hve-missing-task-'));
  try {
    const source = join(output, 'workshop.md');
    const fixtures = [
      workshop.replace(/(```text\n\/hve-core:rpi-plan)\n[\s\S]*?\n```/, '$1\n```'),
      workshop.replace(/(```text\n\/hve-core:adr-author)[^\n]*\n```/, '$1 \t\n```'),
    ];
    for (const fixture of fixtures) {
      writeFileSync(source, fixture);
      const result = spawnSync(process.execPath, [
        fileURLToPath(new URL('./extract-prompts.mjs', import.meta.url)), source, join(output, 'prompts'),
      ], { encoding: 'utf8' });
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /HVE invocation must include its command and task in one block/);
    }
  } finally {
    rmSync(output, { recursive: true });
  }
});

test('tester replays curated contributions sequentially without approving the BRD handoff', () => {
  assert.match(runner, /--agent hve-core:dt-coach/);
  assert.match(runner, /--agent hve-core:brd-builder/);
  assert.match(runner, /for number in \$\(seq 2 11\)/);
  assert.match(runner, /skip_step l2-brd-signoff/);
  assert.match(runner, /earlier BRD turn failed; do not invent missing answers/);
  const helpers = readFileSync(new URL('./lib.sh', import.meta.url), 'utf8');
  assert.match(helpers, /cat '\$RESULTS_DIR\/prompts\/replay-policy.txt'/);
});

test('tester fails extraction when a curated solution message disappears', () => {
  const output = mkdtempSync(join(tmpdir(), 'dt-missing-example-'));
  try {
    const source = join(output, 'workshop.md');
    writeFileSync(source, workshop.replace(/```text\nI would like to explore the experience[\s\S]*?```/, ''));
    const result = spawnSync(process.execPath, [
      fileURLToPath(new URL('./extract-prompts.mjs', import.meta.url)), source, join(output, 'prompts'),
    ], { encoding: 'utf8' });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /expected 9 text blocks/);
  } finally {
    rmSync(output, { recursive: true });
  }
});

test('interactive agent changes provide direct CLI commands alongside VS Code selection', () => {
  for (const name of [
    'dt-coach', 'documentation', 'meeting-analyst', 'brd-builder', 'prd-builder', 'functional-planner',
    'backlog-manager', 'rpi-agent', 'adr-creation', 'code-review',
  ]) assert.ok(workshop.includes(`/agent ${name}`), name);
  assert.match(workshop, /direct name is not recognized/);
  assert.match(workshop, /use the agent picker instead/);
  assert.doesNotMatch(workshop, /^Select \*\*(BRD Builder|DT Coach|Code Review|ADR Creator|Backlog Manager|Functional Planner)\*\*\./m);
});

test('BRD starter and example preserve the supplied workshop facts and review boundaries', () => {
  const brd = workshop.slice(workshop.indexOf('### Step 3: Write the BRD'),
    workshop.indexOf('### Step 4: Turn the BRD into a PRD'));
  assert.match(brd, /Create a business requirements document for the Music Catalog playlist slice/);
  assert.match(brd, /Use only these facts/);
  assert.match(brd, /Ask at most three clarifying questions, then write the BRD/);
  assert.match(brd, /Sponsor: the workshop facilitator/);
  assert.match(brd, /every participant ships the slice with passing tests/);
  assert.match(brd, /These are acceptance targets, not observed results/);
  assert.match(brd, /Source: the locked Design Thinking decisions for this slice, captured in docs\/project-planning\/playlist-design-decisions\.md/);
  assert.match(brd, /<summary>Toggle example: a step-by-step BRD conversation<\/summary>/);
  assert.match(brd, /Send each message separately/);
  assert.match(brd, /docs\/project-planning\/music-catalog-playlist-slice-brd\.md/);
  assert.match(brd, /Verify the file exists/);
  assert.match(brd, /A waiver is not a clean pass/);
  assert.match(brd, /only after inspecting the document/);
  assert.doesNotMatch(brd, /I am acting as the product owner|We have not validated business outcome metrics/);
  const prd = workshop.slice(workshop.indexOf('### Step 4: Turn the BRD into a PRD'),
    workshop.indexOf('### Step 5: Plan the GitHub issue hierarchy'));
  assert.match(prd, /explicitly switch to PRD Builder/);
  assert.match(prd, /\/agent hve-core:prd-builder/);
  assert.match(prd, /command as a separate message/);
  assert.match(prd, /Move from the BRD work to a PRD/);
  assert.match(prd, /Carry forward its constraints and open questions/);
  assert.match(prd, /Ask at most 3 clarifying questions, one at a time/);
  assert.match(prd, /Confirm or correct the scope before proceeding to validation and sign-off/);
  assert.match(prd, /Do not select \*\*Yes\*\* merely/);
  assert.match(prd, /ask for my final approval before recording sign-off/);
  const starter = prd.match(/```text\n(Move from the BRD work[\s\S]*?)\n```/)[1];
  assert.match(starter, /docs\/project-planning\/playlist-design-decisions\.md/);
  assert.doesNotMatch(starter, /Product requirements:|Non-functional requirements:|POST \/api|Write each requirement/);
  assert.match(prd, /native handoff path BRD Builder returned/);
});

test('PM backlog checks use the reviewed plan rather than a prescribed reference hierarchy', () => {
  const backlog = workshop.slice(workshop.indexOf('### Step 5: Plan the GitHub issue hierarchy'),
    workshop.indexOf('### Step 8: Get a sprint order'));
  assert.match(backlog, /There is no prescribed issue count or reference hierarchy/);
  assert.match(backlog, /requirement coverage, acceptance criteria, dependencies/);
  assert.match(backlog, /explicitly switch to Backlog Manager/);
  assert.match(backlog, /\/agent hve-core:backlog-manager/);
  assert.match(backlog, /Execute the plan in the reviewed PRD handoff at <reviewed-handoff-path> and create the corresponding issues in GitHub repository <owner>\/<repo>\./);
  assert.doesNotMatch(backlog, /List the operations first|Follow the reviewed plan's operation order/);
  assert.match(backlog, /reports their URLs/);
  assert.match(backlog, /exit the current Copilot CLI session/);
  assert.match(backlog, /start a \*\*fresh session\*\*/);
  assert.match(backlog, /copilot --enable-all-github-mcp-tools/);
  assert.match(backlog, /use the default agent rather than switching back/);
  assert.match(backlog, /```text\n\/hve-core:backlog-execute\n\nRun the reviewed plan/);
  assert.match(backlog, /press \*\*Tab\*\*/);
  assert.doesNotMatch(backlog, /gh issue create/);
  assert.doesNotMatch(backlog, /four sub-issues|five issues|Five open issues|hand-written sample/);
});

test('sprint planning combines the Tab-selected command and read-only task', () => {
  const sprint = workshop.slice(workshop.indexOf('### Step 8: Get a sprint order'),
    workshop.indexOf('### Step 9: Hand off to curation'));
  assert.match(sprint, /```text\n\/hve-core:backlog-plan\n\nUse sprint mode/);
  assert.match(sprint, /press \*\*Tab\*\*/);
  assert.match(sprint, /hve-core:backlog-plan/);
  assert.match(sprint, /Use sprint mode to plan the next iteration/);
  assert.match(sprint, /changing the prompt does not grant tool access/);
  assert.doesNotMatch(sprint, /\/backlog-plan sprint/);
});

test('dev container provisions remote GitHub MCP while the lab retains authorization steps', () => {
  const container = JSON.parse(readFileSync(new URL('../../../.devcontainer.json', import.meta.url), 'utf8'));
  assert.deepEqual(container.customizations.vscode.mcp.servers.github, {
    type: 'http', url: 'https://api.githubcopilot.com/mcp/',
  });
  const setup = workshop.slice(workshop.indexOf('### Step 1: Prepare your Copilot surface'),
    workshop.indexOf('### Step 2 (facilitator demo, optional): Meeting Analyst'));
  assert.match(setup, /GitHub HTTP MCP server/);
  assert.match(setup, /Do not add another server/);
  assert.match(setup, /Local VS Code setup without a dev container is deferred/);
  assert.match(setup, /Configure Tools/);
  assert.match(setup, /complete GitHub sign-in/);
  assert.match(setup, /without changing anything/);
  assert.match(setup, /Organization policies still apply/);
  assert.doesNotMatch(setup, /MCP: Add Server|COPILOT_GITHUB_TOKEN|GITHUB_TOKEN|PAT configuration|--enable-all-github-mcp-tools/);
});
