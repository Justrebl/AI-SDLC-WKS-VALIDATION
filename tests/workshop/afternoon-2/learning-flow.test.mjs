import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const guide = read('../../../docs/afternoon-2/workshop.md');
const tutor = read('../../../docs/tutor.md');
const workflow = read('../../../solutions/afternoon-2/.github/workflows/daily-backlog.md');
const runner = read('./run-lab.sh');
const level = (number) => guide.slice(guide.indexOf(`# Level ${number}:`),
  guide.indexOf(number === 6 ? '# Recap:' : `# Level ${number + 1}:`));
const visible = (text) => text.replace(/<details>[\s\S]*?<\/details>/g, '');
const header = workflow.split('\n---\n')[0];
const output = (name) => header.match(new RegExp(`^  ${name}:\\n((?:    .*\\n)+)`, 'm'))?.[1];
const powerShell = ['pwsh', 'powershell'].find((shell) => (
  spawnSync(shell, ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', 'exit 0'],
    { stdio: 'ignore' }).status === 0
));

test('both workshop guides use observable checkpoints instead of learner-understanding claims', () => {
  for (const path of ['../../../docs/afternoon-1/workshop.md', '../../../docs/afternoon-2/workshop.md']) {
    const text = read(path);
    const checkpoints = [...text.matchAll(/(?:^|\n)(?:\*\*)?Success Criteria:(?:\*\*)?([^\n]*)(?:\n(- [^\n]*(?:\n- [^\n]*)*))?/g)];
    assert.ok(checkpoints.length > 0, path);
    for (const checkpoint of checkpoints) {
      const evidence = `${checkpoint[1]} ${checkpoint[2] || ''}`.trim();
      assert.ok(evidence, `Empty checkpoint in ${path}`);
      assert.doesNotMatch(evidence,
        /(?:participants?|students?).*\b(?:understand|know|learn)|you (?:understand|know|see how|can (?:name|explain))/i,
        evidence);
      assert.doesNotMatch(evidence, /Participants understand that|This section governs|This is separate from/i);
    }
  }
});

test('visible commands have purpose-led introductions across both workshop guides', () => {
  for (const path of ['../../../docs/afternoon-1/workshop.md', '../../../docs/afternoon-2/workshop.md']) {
    const text = visible(read(path));
    for (const block of text.matchAll(/```(?:powershell|bash)\n([\s\S]*?)\n```/g)) {
      const preceding = text.slice(0, block.index).trim().split('\n\n').at(-1);
      assert.ok(preceding.length > 25, `${path}: purpose before ${block[1].split('\n')[0]}`);
      assert.doesNotMatch(preceding, /^(?:Then )?Run(?: from [^:]+)?:$/i);
    }
  }
});

test('Level 3 planning waits for an actual learner choice before critique and approval', () => {
  const planning = level(3).split('## Plan phase')[1].split('## Implement phase')[0];
  const decision = planning.split('### Step 2: Review the plan and decide')[1];
  assert.match(planning, /critique may run only after you answer/);
  assert.match(decision, /Make a choice from the options the planner just presented/);
  assert.match(decision, /illustrative options, not a prescribed list/);
  assert.match(decision, /For D1, I choose B:[\s\S]*because[\s\S]*Do not implement yet/);
  assert.match(decision, /recommendation alone is not your approval/);
  assert.match(decision, /UI work and tests follow that choice/);
  assert.match(decision, /Approval accepts the plan; it does not start implementation/);
  assert.doesNotMatch(decision, /<chosen approach>|<reason>/);
  assert.ok(decision.indexOf('Reply in the same conversation') <
    decision.indexOf('Then review the completed plan'));
});

test('APM executable governance is explained before the command and checked through files and output', () => {
  const l4 = level(4);
  const section = l4.slice(l4.indexOf('### Step 1: Set the allowed sources'),
    l4.indexOf('### Step 3: Edit a rule to block a dependency'));
  const copy = section.indexOf('cp solutions/afternoon-2/apm-policy.yml');
  assert.ok(section.indexOf('components that can run code') < copy);
  assert.ok(section.indexOf('even if local consent is given') < copy);
  assert.match(section, /`dependencies\.allow` contains `microsoft\/\*\*`/);
  assert.match(section, /`executables\.deny` contains `untrusted-org\/\*`/);
  assert.match(section, /Outcome: found.*Enforcement: block.*Warnings: none/);
  assert.match(section, /The audit exits successfully/);
});

test('Levels 4-6 explain commands without subjective success claims or timing', () => {
  for (const number of [4, 5, 6]) {
    const text = level(number);
    assert.match(text, /## Topic\n\n[^<]+\n\n\*\*Why this level:\*\*/);
    assert.doesNotMatch(text, /(?:students?|participants?|you) (?:should|will|can) understand|you understand/i);
    assert.doesNotMatch(text, /takes about \d+ minutes|approximately \d+ minutes|^\| \d+-\d+ minutes/m);
    const blocks = [...visible(text).matchAll(/```(?:powershell|bash)\n([\s\S]*?)\n```/g)];
    assert.ok(blocks.length > 0);
    for (const block of blocks) {
      const preceding = visible(text).slice(0, block.index).trim().split('\n\n').at(-1);
      assert.ok(preceding.length > 25, `Level ${number}: purpose before ${block[1].split('\n')[0]}`);
      assert.doesNotMatch(preceding, /^Run:$/);
    }
  }
});

test('Level 5a establishes verification before the reviewed 5b delegation handoff', () => {
  const l5 = level(5);
  const stage5aStart = l5.indexOf('## Stage 5a: Verification as contract');
  const stage5bStart = l5.indexOf('## Stage 5b: Backlog and delegation');
  const stage5a = l5.slice(stage5aStart, stage5bStart);
  const stage5b = l5.slice(stage5bStart);
  const topic = stage5a.slice(stage5a.indexOf('## Topic'), stage5a.indexOf('**Why this level:**'));
  const primerLines = topic.split('\n').filter((line) => line.trim() && !line.startsWith('## Topic'));

  assert.ok(stage5aStart >= 0 && stage5bStart > stage5aStart);
  assert.ok(primerLines.length <= 5, `${primerLines.length} visible Stage 5a topic lines`);
  assert.doesNotMatch(topic, /```/);
  for (const phrase of ['application tests, cloud setup, and APM audit as separate parts',
    'before delegation', 'rulesets make selected checks merge requirements',
    'strict `apm-audit` gate before Stage 5b']) assert.ok(topic.includes(phrase), phrase);

  const positions = [
    stage5a.indexOf('Copy-Item solutions\\afternoon-2\\.github\\workflows\\ci.yml'),
    stage5a.indexOf('**Decision check:** Which events trigger the `test` job'),
    stage5a.indexOf('Commit the reviewed CI workflow at .github/workflows/ci.yml'),
    stage5a.indexOf('Wait for **CI** on `main` to pass'),
    stage5a.indexOf('main-tests-required.json'),
    stage5a.indexOf('Commit the reviewed Copilot setup at .github/workflows/copilot-setup-steps.yml'),
    stage5a.indexOf('Check that **Copilot Setup Steps** passed'),
    stage5a.indexOf('wait for **APM Audit** on its latest commit to pass'),
    stage5a.indexOf('main-apm-audit-required.json'),
    stage5a.indexOf('### Handoff artifact: Stage 5a verification record'),
    stage5bStart,
  ];
  assert.ok(positions.every((position, index) =>
    position >= 0 && (index === 0 || position > positions[index - 1])), positions.join(' < '));

  const apmRule = JSON.parse(read('../../../solutions/afternoon-2/rulesets/main-apm-audit-required.json'));
  assert.equal(apmRule.enforcement, 'active');
  assert.deepEqual(apmRule.bypass_actors, []);
  assert.deepEqual(apmRule.rules[0].parameters.required_status_checks.map(({ context }) => context), ['apm-audit']);

  const stage5bPositions = [
    stage5b.indexOf('Create and switch to feature/level-5b-backlog'),
    stage5b.indexOf('Copy-Item solutions\\afternoon-2\\.github\\workflows\\daily-backlog.md'),
    stage5b.indexOf('**Decision check:** Which committed planning paths does the job read'),
    stage5b.indexOf('Open your committed `docs/project-planning/dt-later-slice.md`'),
    stage5b.indexOf('**Decision check:** Does this brief revise the original agreement'),
    stage5b.indexOf('Create a PR titled "Add the Stage 5b backlog setup"'),
    stage5b.indexOf('Wait for both required checks, `test` and `apm-audit`'),
    stage5b.indexOf('A human reviews and merges the PR'),
    stage5b.indexOf('Verify the Stage 5b setup PR is merged'),
  ];
  assert.ok(stage5bPositions.every((position, index) =>
    position >= 0 && (index === 0 || position > stage5bPositions[index - 1])),
  stage5bPositions.join(' < '));
  assert.doesNotMatch(stage5b, /git push\s+main/);
  assert.ok(stage5b.indexOf('### Handoff artifact: Human-selected backlog task') <
    stage5b.indexOf('## Delegate after the verification handoff'));

  const stage5bTopic = stage5b.slice(stage5b.indexOf('## Topic'), stage5b.indexOf('**Why this level:**'));
  const stage5bPrimerLines = stage5bTopic.split('\n')
    .filter((line) => line.trim() && !line.startsWith('## Topic'));
  assert.ok(stage5bPrimerLines.length <= 5, `${stage5bPrimerLines.length} visible Stage 5b topic lines`);
  assert.doesNotMatch(stage5bTopic, /```/);
  for (const phrase of ['committed planning, issue criteria, and revision-bound PR/check evidence',
    'prevents stale recommendations', 'human-selected, criteria-backed issue',
    'safe outputs cap issue writes', 'people assign Copilot and own Project status']) {
    assert.ok(stage5bTopic.includes(phrase), phrase);
  }
  assert.match(stage5b, /reading it does not grant write authority/);
  assert.match(stage5b, /one summary issue, five comments, three closures, and ten label additions or removals/);
  assert.match(stage5b, /The generated gh-aw `\.lock\.yml` is not APM's `apm\.lock\.yaml`/);
  assert.match(stage5b, /people set the intermediate review state/);
  assert.match(stage5b, /### Handoff artifact: Human-selected backlog task[\s\S]*?Planning[\s\S]*?Selection[\s\S]*?Issue contract[\s\S]*?Authority/);
  assert.match(workflow, /schedule: daily on weekdays/);
  assert.match(workflow, /imports:\n  - \.github\/agents\/backlog-manager\.agent\.md/);
  assert.match(workflow, /required-labels: \[backlog-managed\]/);
  assert.match(workflow, /If a file or tool is missing, report\s+missing evidence/);

  const stage5aCi = runner.indexOf('step l5-ci');
  const stage5aAudit = runner.indexOf('step l5-apm-ci');
  const strictRuleSkip = runner.indexOf('skip_step l5-apm-ruleset');
  const stage5bSkip = runner.indexOf('skip_step l5b-setup-pr');
  const stage5bInstall = runner.indexOf('skip_step l5-ghaw-install');
  assert.ok(stage5aCi >= 0 && stage5aAudit > stage5aCi && strictRuleSkip > stage5aAudit);
  assert.ok(stage5bSkip > strictRuleSkip && stage5bInstall > stage5bSkip);
  assert.match(runner, /strict solution JSON is checked, but live merge enforcement is not simulated/);
  assert.match(runner, /cannot verify the active no-bypass APM rule/);
  assert.match(runner, /skip_step l5b-human-review/);
  assert.match(runner, /skip_step l5b-sandbox-merge-translation/);
  assert.doesNotMatch(runner, /gh pr merge.*--admin|gh pr merge.*--force/);
  assert.match(read('./README.md'), /Stage 5b setup PR and dependent delegation steps/);

  const afternoon2Schedule = tutor.slice(tutor.indexOf('## Afternoon 2'),
    tutor.indexOf('### Level 4 proctor flow'));
  assert.match(afternoon2Schedule, /^\| 2:50 \| Level 5a Verification as contract \| 20 \|/m);
  assert.match(afternoon2Schedule, /^\| 3:10 \| Level 5b Backlog and delegation \| 30 \|/m);
  assert.match(read('../../../README.md'),
    /\*\*Verification as contract\*\*.*Afternoon 2, Levels 5a and 6/);
  assert.match(read('../../../README.md'),
    /\*\*Agentic threat model\*\*.*Afternoon 2, Levels 5b and 6/);
});

test('the required path works with optional context closed', () => {
  const l4 = visible(level(4));
  const l5 = visible(level(5));
  const l6 = visible(level(6));
  for (const text of ['apm install --target copilot', 'copilot plugin disable hve-core',
    'apm audit --ci --policy apm-policy.yml', 'Restore a passing audit before committing',
    'Commit the governed repository setup: apm.yml, apm.lock.yaml, apm-policy.yml',
    'the reviewed deployed files under .github/ and .agents/', 'default branch']) {
    assert.ok(l4.includes(text), text);
  }
  for (const text of ['backlog-managed', 'committed', 'gh aw compile', 'gh aw run daily-backlog',
    'Use the RPI workflow.', 'No participant configuration or audit run is required',
    'status-to-issue closure automation off']) {
    assert.ok(l5.includes(text), text);
  }
  for (const text of ["--add-reviewer '@copilot'", 'posted Copilot review', 'Approve and run workflows',
    'both', '`test`', '`apm-audit`', 'substantive changes', 'Partial delivery stays open']) {
    assert.ok(l6.includes(text), text);
  }
});

test('Level 6 binds review evidence to the current PR head and keeps acceptance human', () => {
  const l6 = level(6);
  const topic = l6.slice(l6.indexOf('## Topic'), l6.indexOf('**Why this level:**'));
  const primerLines = topic.split('\n').filter((line) => line.trim() && !line.startsWith('## Topic'));
  assert.ok(primerLines.length <= 5, `${primerLines.length} visible Level 6 topic lines`);
  assert.doesNotMatch(topic, /```/);
  for (const phrase of ['exact PR revision', 'posted Copilot review and current `test`/`apm-audit` checks',
    'Handoff:', 'human approves or requests changes', 'an open PR stays open']) {
    assert.ok(topic.includes(phrase), phrase);
  }

  assert.match(l6, /Record the current PR head SHA/);
  assert.match(l6, /confirm the posted review also covers it/);
  assert.match(l6, /Any later push makes earlier review\/check evidence stale/);
  assert.match(l6, /Compare the five issue criteria with code, tests, and any observed UI behavior/);
  assert.match(l6, /Merge only when the issue criteria are satisfied, required checks pass for the latest revision/);
  assert.doesNotMatch(l6, /## Secret scanning and push protection/);

  const recap = guide.slice(guide.indexOf('# Recap:'));
  assert.match(recap, /### Facilitator demo: Secret scanning and push protection/);
  assert.match(recap, /This is facilitator-only; attendees do not configure push protection/);
  assert.match(recap, /Facilitator demonstrated a fake key blocked before push; attendees did not configure it/);
  assert.match(tutor, /Level 6.*keep this block on revision-bound acceptance evidence/);
  assert.match(tutor, /Recap.*facilitator-only push-protection demo/);
  assert.match(runner, /skip_step l6-push-protection "Recap" "Facilitator demo:/);
  assert.match(runner, /skip_step l6-pr "Level 6" "Copilot cloud agent opens a PR/);
});

test('PowerShell passes the documented Copilot reviewer as one literal argument', {
  skip: powerShell ? false : 'PowerShell runtime unavailable',
}, () => {
  const command = level(6).match(/^gh pr edit PR-NUMBER --add-reviewer '@copilot'$/m)?.[0];
  assert.ok(command, 'documented PowerShell reviewer command');
  const script = [
    'function gh { $script:captured = @($args) }',
    command,
    'ConvertTo-Json -InputObject $script:captured -Compress',
  ].join('\n');
  const result = spawnSync(powerShell, ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', script],
    { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.error?.message);
  assert.deepEqual(JSON.parse(result.stdout.trim()),
    ['pr', 'edit', 'PR-NUMBER', '--add-reviewer', '@copilot']);
});

test('all task mutations are independently bounded by opt-in filters', () => {
  for (const name of ['add-comment', 'close-issue', 'add-labels', 'remove-labels']) {
    const config = output(name);
    assert.ok(config, name);
    assert.match(config, /target: "\*"/);
    assert.match(config, /required-labels: \[backlog-managed\]/);
    const maximum = Number(config.match(/max: (\d+)/)?.[1]);
    assert.ok(maximum >= 1 && maximum <= 10, `${name} cap`);
  }
  assert.match(output('close-issue'), /state-reason: completed/);
  assert.match(output('create-issue'), /max: 1/);
  assert.match(header, /contents: read\n  issues: read\n  pull-requests: read\n  actions: read/);
  assert.match(header, /toolsets: \[repos, issues, pull_requests, actions\]/);
  assert.doesNotMatch(header, /assign-to-agent:|update-issue:|update-project:|create-pull-request:|github-token:|secrets\./);
});

test('reconciliation preserves requirements and needs explicit revision-bound delivery evidence', () => {
  for (const phrase of ['docs/project-planning/**', 'explicitly linked PRs or fixing commits',
    'Do not match a fix by title', 'actual head', 'Never substitute a green run from another revision',
    'every acceptance criterion', 'implementation and adequate', 'verified on `main`',
    'Keep partial, conflicting, blocked, or unverified delivery open',
    'rewrite issue requirements', 're-read the issue state', 'Evidence key:',
    'do not post another comment', 'unrelated new main SHA', 'Report unprocessed work']) {
    assert.ok(workflow.includes(phrase), phrase);
  }
  assert.match(workflow, /If there are no open issues, use `noop`/);
  assert.match(workflow, /close_issue.*[\s\S]*actual issue number/);
});

test('proctor demos are not replayed as participant runs', () => {
  const l5 = level(5);
  assert.doesNotMatch(l5, /gh aw run a11y-review|Copy-Item .*a11y-review/);
  assert.match(tutor, /playwright.*mode: cli/);
  assert.match(tutor, /@latest.*demonstration configuration/);
  for (const path of ['l4-private-marketplace.png', 'l5-playwright-mcp.png']) {
    assert.ok(existsSync(new URL(`../../../docs/afternoon-2/assets/${path}`, import.meta.url)));
    assert.ok(tutor.includes(path));
  }
  assert.match(runner, /skip_step l4-marketplace-app/);
  assert.match(runner, /skip_step l5-accessibility-demo/);
  assert.doesNotMatch(runner, /wait_aw_run l5-run-a11y|step l4-plugin-install|skip_step l6-test-writer/);
  const capstone = guide.slice(guide.indexOf('## Architect capstone'));
  assert.match(capstone, /\| Your template copy's curated marketplace, registered in CLI and VS Code \|/);
});

test('the follow-up issue has committed planning evidence before delegation', () => {
  const l5 = level(5);
  const planningCopy = l5.indexOf('Open your committed `docs/project-planning/dt-later-slice.md`');
  const setupPr = l5.indexOf('Create a PR titled "Add the Stage 5b backlog setup"');
  const issue = l5.indexOf('### Step 3: Create a scoped feature issue');
  assert.ok(planningCopy >= 0 && planningCopy < setupPr && setupPr < issue);
  assert.match(l5, /Wait for both required checks, `test` and `apm-audit`/);
  assert.match(l5, /A human reviews and merges the PR through the normal workflow/);
  assert.match(runner, /skip_step l5-planning-follow-up/);
  assert.match(runner, /skip_step l5-managed-issue/);
  assert.match(runner, /skip_step l5-run-daily-backlog/);
  const brief = read('../../../solutions/afternoon-2/docs/project-planning/remove-playlist-track.md');
  assert.match(brief, /excluded from that slice/);
  assert.match(brief, /No persistence, multiple playlists, users, reorder, search/);
  assert.match(l5, /No assignment, application-code write, or Project write is enabled/);
});

test('the dashboard uses configured closure automation, not unchecked agent field writes', () => {
  assert.match(level(5), /Item closed.*Done/);
  assert.match(level(5), /people set the intermediate review state/);
  assert.match(level(6), /configured the closed-item workflow/);
  assert.match(runner, /skip_step l5-project-progress/);
  assert.match(runner, /skip_step l6-accept-and-reconcile/);
});
