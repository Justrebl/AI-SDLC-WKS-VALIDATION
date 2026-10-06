import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const workflow = read('../../../solutions/afternoon-2/.github/workflows/apm-audit.yml');
const ruleset = JSON.parse(read('../../../solutions/afternoon-2/rulesets/main-apm-audit-required.json'));
const workshop = read('../../../docs/afternoon-2/workshop.md');
const runner = read('./run-lab.sh');
const level4 = workshop.slice(workshop.indexOf('# Level 4:'), workshop.indexOf('# Level 5:'));
const level5 = workshop.slice(workshop.indexOf('# Level 5:'), workshop.indexOf('# Level 6:'));
const auditCommand = workflow.match(/^\s+run: (apm audit[^\n]+)$/m)?.[1];
const bash = process.platform === 'win32' ? 'C:\\Program Files\\Git\\bin\\bash.exe' : 'bash';

test('the solution runs an unfiltered, read-only PR audit without rewriting committed context', () => {
  assert.match(workflow, /^on:\n  pull_request:\n  push:\n    branches: \[main\]\n  merge_group:\n  workflow_dispatch:/m);
  assert.match(workflow, /^permissions:\n  contents: read$/m);
  assert.match(workflow, /uses: actions\/checkout@v5\n\s+with:\n\s+persist-credentials: false/);
  assert.match(workflow, /uses: microsoft\/apm-action@v1\n\s+with:\n\s+apm-version: "0\.33\.0"\n\s+setup-only: true/);
  assert.equal(auditCommand, 'apm audit --ci --no-cache --policy apm-policy.yml');
  assert.doesNotMatch(workflow, /pull_request_target|paths:|continue-on-error:|^\s+if:|apm install|--no-drift|--no-policy|secrets\./m);
  assert.equal(existsSync(new URL('../../../.github/workflows/apm-audit.yml', import.meta.url)), false);
});

test('the active default-branch rule requires the exact audit job with no administrator bypass', () => {
  const jobName = workflow.match(/^    name: (.+)$/m)?.[1];
  assert.equal(jobName, 'apm-audit');
  assert.equal(ruleset.target, 'branch');
  assert.equal(ruleset.enforcement, 'active');
  assert.deepEqual(ruleset.conditions.ref_name, { include: ['~DEFAULT_BRANCH'], exclude: [] });
  assert.deepEqual(ruleset.bypass_actors, []);
  const required = ruleset.rules.find((rule) => rule.type === 'required_status_checks');
  assert.deepEqual(required.parameters.required_status_checks, [{ context: jobName }]);
  const setupCommit = level5.indexOf('Commit the reviewed Copilot setup at .github/workflows/copilot-setup-steps.yml');
  const auditRule = level5.indexOf('rulesets\\main-apm-audit-required.json');
  const stage5b = level5.indexOf('## Stage 5b: Backlog and delegation');
  const branch = level5.indexOf('Create and switch to feature/level-5b-backlog');
  const setupPr = level5.indexOf('Create a PR titled "Add the Stage 5b backlog setup"');
  const assignment = level5.indexOf('### Step 2: Assign the issue');
  assert.ok(setupCommit >= 0 && setupCommit < auditRule && auditRule < stage5b &&
    stage5b < branch && branch < setupPr && setupPr < assignment);
  assert.match(level5, /wait for \*\*APM Audit\*\* on its latest commit to pass/);
  assert.match(level5, /no bypass list/);
  assert.match(level5, /A failed or missing `apm-audit` blocks merging/);
  assert.match(level5, /later Stage 5b workflow and planning changes must use a reviewed pull request/);
  assert.match(level5, /Wait for both required checks, `test` and `apm-audit`/);
  assert.match(level5, /A human reviews and merges the PR through the normal workflow/);
  assert.match(level5, /administration permission and a supported GitHub plan/);
  const security = level5.slice(level5.indexOf('### Step 5 (facilitator demo)'));
  assert.match(security, /to security-review-delegation/);
  assert.match(security, /\/hve-core:pull-request[\s\S]*?ask for\npublication approval/);
  assert.match(security, /Open the returned pull request, wait for the required checks, and have a human review and merge/);
});

test('Level 4 copies the workflow and stages shared skills before publishing its context', () => {
  const copyStep = level4.slice(level4.indexOf('### Step 1: Add the PR audit workflow'),
    level4.indexOf('### Step 2: Commit and push'));
  assert.match(copyStep, /```bash\nmkdir -p \.github\/workflows\ncp solutions\/afternoon-2\/\.github\/workflows\/apm-audit\.yml \.github\/workflows\/apm-audit\.yml\n```/);
  assert.match(copyStep, /without reinstalling your packages/);
  assert.match(copyStep, /A workflow alone does not block merging/);
  assert.match(level4, /Commit the governed repository setup: apm\.yml, apm\.lock\.yaml, apm-policy\.yml/);
  assert.match(level4, /reviewed deployed files under \.github\/ and \.agents\//);
  assert.doesNotMatch(level4, /Step 5: Discuss CI|does not require authoring a new CI workflow/);
});

test('the runner copies and stages the audit contract without claiming live admin enforcement', () => {
  assert.match(runner, /step l4-copy-apm-ci/);
  assert.match(runner, /cp solutions\/afternoon-2\/\.github\/workflows\/apm-audit\.yml \.github\/workflows\/apm-audit\.yml/);
  assert.match(runner, /git add apm\.yml apm\.lock\.yaml apm-policy\.yml \.github \.agents/);
  assert.match(runner, /skip_step l5-apm-ruleset/);
  assert.match(runner, /live merge enforcement is not simulated/);
  assert.ok(runner.indexOf('step l5-setup-steps') < runner.indexOf('step l5-apm-ci'));
  assert.ok(runner.indexOf('skip_step l5-apm-ruleset') < runner.indexOf('skip_step l5-prereqs'));
});

for (const status of [0, 1]) {
  test(`the published audit command preserves exit status ${status}`, () => {
    assert.ok(auditCommand);
    const result = spawnSync(bash, ['-c', `
apm() {
  [ "$*" = "audit --ci --no-cache --policy apm-policy.yml" ] || return 99
  return "$AUDIT_FIXTURE_STATUS"
}
${auditCommand}
`], { encoding: 'utf8', env: { ...process.env, AUDIT_FIXTURE_STATUS: String(status) } });
    assert.equal(result.status, status, result.stderr || String(result.error || ''));
  });
}

for (const status of [0, 1]) {
  test(`the runner follows the exact current-main audit and preserves hosted status ${status}`, () => {
    const block = runner.match(/step l5-apm-ci\b[\s\S]*?\nfinish_step/)?.[0];
    assert.ok(block);
    const captured = spawnSync(bash, ['-c', `
step() { printf '%s' "$6"; }
finish_step() { :; }
SANDBOX_REPO=fixture/workshop
${block}
`], { encoding: 'utf8' });
    assert.equal(captured.status, 0, captured.stderr);
    const result = spawnSync(bash, ['-c', `
git() {
  [ "$*" = "rev-parse HEAD" ] || return 99
  printf '%s\\n' fixture-main-sha
}
gh() {
  case "$1 $2" in
    "run list")
      while [ "$#" -gt 0 ]; do
        if [ "$1" = "--jq" ]; then
          shift
          [ "$1" = '[.[] | select(.headSha == "fixture-main-sha")][0].databaseId // empty' ] || return 99
          printf '%s\\n' 123
          return 0
        fi
        shift
      done
      return 99
      ;;
    "run watch")
      [ "$3" = "123" ] || return 99
      [ "\${!#}" = "--exit-status" ] || return 99
      return "$AUDIT_FIXTURE_STATUS"
      ;;
    *) return 99 ;;
  esac
}
sleep() { return 99; }
${captured.stdout}
`], { encoding: 'utf8', env: { ...process.env, AUDIT_FIXTURE_STATUS: String(status) } });
    assert.equal(result.status, status, result.stderr || String(result.error || ''));
  });
}
