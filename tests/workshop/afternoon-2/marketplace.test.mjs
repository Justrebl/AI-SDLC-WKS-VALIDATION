import { readFileSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const catalog = JSON.parse(read('../../../.github/plugin/marketplace.json'));
const bash = process.platform === 'win32' ? 'C:\\Program Files\\Git\\bin\\bash.exe' : 'bash';
const upstream = [{ name: 'hve-core', marketplace: 'hve-core', version: '3.2.2', enabled: true }];
const curated = [{ name: 'hve-core', marketplace: 'contoso-plugin-marketplace', version: '3.2.2', enabled: true }];

test('template and solution catalog have exactly the reviewed four remote sources', () => {
  assert.equal(catalog.name, 'contoso-plugin-marketplace');
  assert.equal(catalog.metadata.version, '1.0.0');
  assert.deepEqual(catalog, JSON.parse(read('../../../solutions/afternoon-2/.github/plugin/marketplace.json')));
  assert.deepEqual(catalog.plugins.map(({ name, version, source }) => [name, version, source]), [
    ['hve-core', '3.2.2', { source: 'github', repo: 'microsoft/hve-core',
      sha: 'f7bae49bf68988381a8e13472686c501aea13ebc' }],
    ['java-development', '1.0.0', { source: 'github', repo: 'github/awesome-copilot',
      path: 'plugins/java-development', sha: '143a3d976b3c1603cc8932984d5e1f28501cb5fc' }],
    ['java-modernization-studio', '1.0.2', { source: 'github', repo: 'github/awesome-copilot',
      path: 'plugins/java-modernization-studio', sha: '143a3d976b3c1603cc8932984d5e1f28501cb5fc' }],
    ['workiq', '2.0.2', { source: 'github', repo: 'microsoft/work-iq',
      path: 'plugins/workiq', sha: '7fde3f8e6477fc75c79a7d8386e8501105b2d9bd' }],
  ]);
  const settings = JSON.parse(read('../../../solutions/afternoon-2/.github/copilot/settings.json'));
  assert.deepEqual(settings.enabledPlugins, { 'hve-core@contoso-plugin-marketplace': true });
  assert.equal(settings.extraKnownMarketplaces[catalog.name].autoUpdate, undefined);
});

test('visible Level 4 path keeps source gates, Linux prerequisites and revised timing consistent', () => {
  const guide = read('../../../docs/afternoon-2/workshop.md');
  const l4 = guide.slice(guide.indexOf('# Level 4:'), guide.indexOf('# Level 5:'))
    .replace(/<details>[\s\S]*?<\/details>/g, '');
  for (const text of ['copilot plugin marketplace add OWNER/REPO',
    'copilot plugin marketplace browse contoso-plugin-marketplace',
    'copilot plugin uninstall hve-core@hve-core',
    'Verify there are now no HVE rows',
    'copilot plugin install hve-core@contoso-plugin-marketplace',
    'chat.plugins.marketplaces', '@agentPlugins', 'source.sha',
    'Install only HVE-Core', 'No Java runtime or Microsoft 365 account is required',
    'copilot plugin disable hve-core@contoso-plugin-marketplace']) {
    assert.ok(l4.includes(text), text);
  }
  assert.doesNotMatch(l4, /```powershell|```cmd|Copy-Item|New-Item|\.\\/);
  assert.match(guide, /WSL 2[\s\S]*?Install the tools inside/);
  assert.match(guide, /^duration_minutes: 255$/m);
  assert.match(read('../../../docs/tutor.md'), /^\| 4:15 \| End \|/m);
  assert.match(read('../../../README.md'), /estimated 255/);
});

test('all lab commits use scoped HVE requests while clean-tree and approval checks remain visible', () => {
  const guide = read('../../../docs/afternoon-2/workshop.md');
  const shellBlocks = [...guide.matchAll(/```(?:bash|powershell|cmd)\n([\s\S]*?)\n```/g)];
  for (const [, body] of shellBlocks) assert.doesNotMatch(body, /\bgit\s/);
  const requests = [...guide.matchAll(/```text\n(\/hve-core:git-commit\.prompt\n[\s\S]*?)\n```/g)];
  assert.equal(requests.length, 10);
  for (const [, body] of requests) {
    const text = body.replace(/\s+/g, ' ');
    assert.match(text, /select (?:the (?:intended )?whole path|whole paths)/);
    assert.match(text, /confirm (?:their|the|its) exact staged set/);
    assert.match(body, /tracking/);
  }
  const checkpoint = guide.slice(guide.indexOf('### Step 3: Commit implementation checkpoint'),
    guide.indexOf('## Review phase'));
  assert.match(checkpoint, /inventories pending paths before asking you/);
  assert.doesNotMatch(checkpoint, /```text\n(?!\/hve-core:git-commit\.prompt)/);
  assert.match(checkpoint, /already committed[\s\S]*?without creating[\s\S]*?empty commit/);
  assert.match(checkpoint, /real staging or commit error must be resolved/);
  assert.match(checkpoint, /partly staged or unrelated initially staged/);
  assert.match(guide, /Importing preserves existing commits[\s\S]*?valid `HEAD`/);
  const runner = read('./run-lab.sh');
  for (const id of ['l2-hve-commit', 'l3-hve-commit', 'l4-hve-commit',
    'l5-ci-hve-commit', 'l5-setup-hve-commit']) assert.ok(runner.includes(`skip_step ${id}`), id);
  assert.doesNotMatch(runner, /copilot_prompt .*commit-(?:l2|l3|l4|ci|setup)/);
});

test('extractor keeps all ten commit tasks and rejects a missing scoped request', () => {
  const work = mkdtempSync(join(tmpdir(), 'workshop-commit-prompts-'));
  try {
    const extractor = new URL('./extract-prompts.mjs', import.meta.url);
    const guide = new URL('../../../docs/afternoon-2/workshop.md', import.meta.url);
    const execute = path => spawnSync(process.execPath,
      [fileURLToPath(extractor), path, work], { encoding: 'utf8' });
    const result = execute(fileURLToPath(guide));
    assert.equal(result.status, 0, result.stderr);
    assert.match(readFileSync(join(work, 'dt-later-choice.txt'), 'utf8'), /Ask me to choose and confirm/);
    assert.match(readFileSync(join(work, 'dt-later-record.txt'), 'utf8'), /Do not invoke BRD\/PRD Builder/);
    const assignment = readFileSync(join(work, 'agent-instructions.txt'), 'utf8');
    assert.match(assignment, /using docs\/project-planning\/dt-later-slice\.md/);
    assert.doesNotMatch(assignment, /remove-playlist-track/);
    assert.equal(readdirSync(work).filter(name => name.startsWith('commit-')).length, 10);
    assert.equal(readdirSync(work).filter(name => name.startsWith('git-')).length, 22);
    const pr = readFileSync(join(work, 'git-l3-pr.txt'), 'utf8');
    assert.match(pr, /^\/hve-core:pull-request\n/);
    assert.match(pr, /After I confirm, push only the/);
    assert.match(pr, /Do not push to the default branch, merge or bypass branch rules/);
    assert.match(readFileSync(join(work, 'git-l3-sync.txt'), 'utf8'), /fast-forward only/);
    assert.match(readFileSync(join(work, 'git-demo-cleanup.txt'), 'utf8'), /confirmation before deleting anything/);
    for (const name of readdirSync(work).filter(name => name.startsWith('commit-'))) {
      assert.match(readFileSync(join(work, name), 'utf8'), /^\/hve-core:git-commit\.prompt\n/);
    }
    const changed = join(work, 'missing-commit.md');
    writeFileSync(changed, read('../../../docs/afternoon-2/workshop.md')
      .replace('Commit the approved playlist implementation', 'Different task'));
    const missing = execute(changed);
    assert.notEqual(missing.status, 0);
    assert.match(missing.stderr, /missing prompts: commit-l3/);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});

test('DT later-slice decision feeds cloud delegation without expanding Level 3 or requiring product builders', () => {
  const guide = read('../../../docs/afternoon-2/workshop.md');
  const choice = guide.indexOf('### Step 4: Choose a later slice with DT Coach');
  const record = guide.indexOf('Write a curated later-slice decision');
  const product = guide.indexOf('## Extended track: Product Manager');
  assert.ok(choice > 0 && choice < record && record < product);
  assert.match(guide.slice(choice, product), /Keep the shared Level 3 scope unchanged/);
  assert.match(guide.slice(choice, product), /No BRD or PRD is required/);
  assert.match(guide, /Choose the issue backed by your reviewed \*\*DT later-slice decision\*\*/);
  assert.match(guide, /Populate the title, problem, outcome, acceptance criteria, area and exclusions from your reviewed DT later-slice brief/);
  assert.match(read('./run-lab.sh'), /skip_step l2-dt-later-choice/);
  assert.match(read('./run-lab.sh'), /skip_step l2-dt-later-record/);
  const delegation = guide.slice(guide.indexOf('## Delegate after the verification handoff'),
    guide.indexOf('## Follow one task on the shared dashboard'));
  assert.match(delegation, /only if you selected the Remove a track fallback/);
  assert.match(delegation, /Verify the selected brief exists[\s\S]*?default branch before assignment/);
  const handoff = guide.slice(guide.indexOf('### Step 7: Read the summary issue'),
    guide.indexOf('## Delegate after the verification handoff'));
  assert.match(handoff, /all acceptance criteria and exclusions from the selected later-slice brief/);
  assert.doesNotMatch(handoff, /all five acceptance criteria/);
});

test('scope-drift guidance separates read-only findings from later bounded implementation', () => {
  const guide = read('../../../docs/afternoon-2/workshop.md');
  const tip = guide.slice(guide.indexOf('<div class="tip" data-title="Reference fallback">'),
    guide.indexOf('## Tech Lead extension'));
  assert.match(tip, /database persistence[\s\S]*?in-memory storage/);
  assert.match(tip, /Pause acceptance and publication/);
  assert.match(tip, /During \*\*Review\*\*[\s\S]*?without changing application files/);
  assert.match(tip, /subsequent \*\*Implement\*\* pass[\s\S]*?approved plan[\s\S]*?rerun its validation/);
  assert.match(tip, /Do not discard the implementation or rewrite the plan/);
});

function transition({ initial = upstream, final = curated, failure = '', remaining = [], listFailure = false } = {}) {
  return spawnSync(bash, ['-c', `
. tests/workshop/afternoon-2/marketplace.sh || exit
current=$INITIAL
copilot() {
  printf 'CALL %s\\n' "$*" >&2
  case "$*" in
    "plugin list --json")
      [ "$LIST_FAILURE" = 0 ] || return 17
      printf '%s\\n' "$current" ;;
    "plugin marketplace add owner/repo") [ "$FAILURE" != add ] ;;
    "plugin marketplace browse contoso-plugin-marketplace") [ "$FAILURE" != browse ] ;;
    "plugin uninstall hve-core@hve-core")
      [ "$FAILURE" != uninstall ] || return 18
      current=$REMAINING ;;
    "plugin install hve-core@contoso-plugin-marketplace")
      [ "$FAILURE" != install ] || return 19
      current=$FINAL ;;
    *) printf 'Unexpected mock command\\n' >&2; return 99 ;;
  esac
}
curated_hve_install owner/repo || exit 1
printf 'APM-CONTINUATION\\n'
`], {
    encoding: 'utf8',
    env: { ...process.env, INITIAL: typeof initial === 'string' ? initial : JSON.stringify(initial),
      FINAL: JSON.stringify(final), FAILURE: failure, REMAINING: JSON.stringify(remaining),
      LIST_FAILURE: listFailure ? '1' : '0' },
  });
}

for (const [name, initial, remove, install] of [
  ['Level 1 source', upstream, true, true],
  ['no existing source', [], false, true],
  ['sole curated source', curated, false, false],
]) {
  test(`source transition accepts ${name} without assuming collision semantics`, () => {
    const result = transition({ initial });
    assert.equal(result.status, 0, result.stderr || result.error?.message);
    assert.match(result.stdout, /APM-CONTINUATION/);
    assert.equal(result.stderr.includes('CALL plugin uninstall'), remove);
    assert.equal(result.stderr.includes('CALL plugin install'), install);
    if (remove) assert.ok(result.stderr.indexOf('CALL plugin uninstall hve-core@hve-core') <
      result.stderr.indexOf('CALL plugin install hve-core@contoso-plugin-marketplace'));
  });
}

for (const [name, options, noMutation] of [
  ['duplicate sources', { initial: [...upstream, ...curated] }, true],
  ['unknown source', { initial: [{ ...upstream[0], marketplace: 'unknown' }] }, true],
  ['managed source', { initial: [{ ...upstream[0], managed: true }] }, true],
  ['malformed JSON', { initial: 'not-json' }, true],
  ['old object inventory', { initial: { plugins: upstream } }, true],
  ['inventory command failure', { listFailure: true }, true],
  ['registration failure', { failure: 'add' }, true],
  ['browsing failure', { failure: 'browse' }, true],
  ['uninstall failure', { failure: 'uninstall' }, false],
  ['remaining source', { remaining: upstream }, false],
  ['install failure', { failure: 'install' }, false],
  ['wrong version', { final: [{ ...curated[0], version: '0.0.0' }] }, false],
  ['disabled curated install', { final: [{ ...curated[0], enabled: false }] }, false],
  ['disabled existing curated', { initial: [{ ...curated[0], enabled: false }] }, true],
]) {
  test(`source transition stops dependent APM after ${name}`, () => {
    const result = transition(options);
    assert.notEqual(result.status, 0, result.stderr);
    assert.doesNotMatch(result.stdout, /APM-CONTINUATION/);
    if (noMutation) assert.doesNotMatch(result.stderr, /CALL plugin (?:uninstall|install|disable)/);
    if (options.remaining || options.failure === 'uninstall') {
      assert.doesNotMatch(result.stderr, /CALL plugin install/);
    }
  });
}

test('qualified disable requires repository agents and verifies activation afterward', () => {
  for (const mode of ['pass', 'missing', 'command-fails', 'still-enabled']) {
    const result = spawnSync(bash, ['-c', `
. tests/workshop/afternoon-2/marketplace.sh || exit
helper=$(declare -f hve_state curated_hve_disable)
work=$(mktemp -d) || exit
trap 'rm -rf "$work"' EXIT
cd "$work" || exit
eval "$helper"
if [ "$MODE" != missing ]; then
  mkdir -p .github/agents
  touch .github/agents/rpi-agent.agent.md .github/agents/backlog-manager.agent.md
fi
current=$CURATED
copilot() {
  printf 'CALL %s\\n' "$*" >&2
  case "$*" in
    "plugin list --json") printf '%s\\n' "$current" ;;
    "plugin disable hve-core@contoso-plugin-marketplace")
      [ "$MODE" != command-fails ] || return 19
      [ "$MODE" = still-enabled ] || current=$DISABLED ;;
    *) return 99 ;;
  esac
}
curated_hve_disable || exit 1
printf 'PUBLISH-CONTINUATION\\n'
`], { encoding: 'utf8', env: { ...process.env, MODE: mode, CURATED: JSON.stringify(curated),
      DISABLED: JSON.stringify([{ ...curated[0], enabled: false }]) } });
    assert.equal(result.status === 0, mode === 'pass', result.stderr);
    if (mode !== 'pass') assert.doesNotMatch(result.stdout, /PUBLISH-CONTINUATION/);
    if (mode === 'missing') assert.doesNotMatch(result.stderr, /CALL plugin disable/);
  }
});

test('every Level 4 replay step gates dependent work including the intentional deny', () => {
  const runner = read('./run-lab.sh');
  const l4 = runner.slice(runner.indexOf('# ---------------------------------------------------------------- Level 4'),
    runner.indexOf('# ---------------------------------------------------------------- Level 5a'));
  const finishes = [...l4.matchAll(/^finish_step(?: 1)?\n/gm)];
  assert.equal(finishes.length, 12);
  for (const finish of finishes) {
    assert.ok(l4.slice(finish.index + finish[0].length).startsWith('[ "$STEP_FAILED" -eq 0 ] || exit 1'));
  }
  assert.match(l4, /step l4-deny-audit[\s\S]*?finish_step 1\n\[ "\$STEP_FAILED" -eq 0 \] \|\| exit 1/);
  assert.doesNotMatch(l4, /push_fallback/);
});

test('replay control flow stops after marketplace/APM/policy failures without publication', () => {
  const runner = read('./run-lab.sh');
  const l4 = runner.slice(runner.indexOf('# ---------------------------------------------------------------- Level 4'),
    runner.indexOf('# ---------------------------------------------------------------- Level 5a'));
  for (const [failure, code] of [
    ['', 0], ['l4-marketplace-install', 1], ['l4-copy-apm', 1],
    ['l4-apm-install', 1], ['l4-plugin-disable', 1], ['l4-copy-policy', 1],
    ['l4-policy-status', 1], ['l4-policy-audit', 1], ['l4-deny-edit', 1],
    ['l4-deny-audit', 0], ['l4-deny-audit', 2], ['l4-restore-policy', 1],
    ['l4-copy-apm-ci', 1], ['l4-commit', 1],
  ]) {
    const result = spawnSync(bash, ['-c', `
SANDBOX_REPO=owner/repo SCRIPT_DIR=unused RESULTS_DIR=unused STEP_FAILED=0
step() {
  STEP_ID=$1
  printf 'STEP %s\\n' "$1"
  STEP_CODE=0
  [ "$1" != l4-deny-audit ] || STEP_CODE=1
  [ "$1" != "$FAILURE" ] || STEP_CODE=$CODE
}
finish_step() { STEP_FAILED=0; [ "$STEP_CODE" -eq "\${1:-0}" ] || STEP_FAILED=1; }
check() { :; }
note() { :; }
log_has() { return 0; }
skip_step() { :; }
grep() { return 1; }
git() { return 0; }
gh() { return 0; }
${l4}
printf 'LEVEL-5-CONTINUATION\\n'
`], { encoding: 'utf8', env: { ...process.env, FAILURE: failure, CODE: String(code) } });
    assert.equal(result.status === 0, failure === '', result.stderr);
    if (failure) {
      assert.doesNotMatch(result.stdout, /LEVEL-5-CONTINUATION/);
      if (failure !== 'l4-commit') assert.doesNotMatch(result.stdout, /STEP l4-commit/);
    }
  }
});
