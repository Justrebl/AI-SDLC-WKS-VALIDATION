import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('./report.mjs', import.meta.url));

function render({ lab = [], infra = [{ id: 'infra-ready', level: 'infra', status: 'pass' }],
  completed = true, jobs = {}, malformed = false, summarySteps = lab.length } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'workshop-report-'));
  try {
    if (infra.length) {
      mkdirSync(join(root, 'infra'), { recursive: true });
      writeFileSync(join(root, 'infra', 'results.jsonl'), infra.map(JSON.stringify).join('\n'));
    }
    if (lab.length || malformed || completed) {
      const dir = join(root, 'lab', 'workshop-tester');
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, 'results.jsonl'),
        lab.map(JSON.stringify).join('\n') + (malformed ? '\n{bad json}\n' : ''));
      if (completed) {
        writeFileSync(join(dir, 'done'), '');
        writeFileSync(join(dir, 'summary.json'), JSON.stringify({ steps: summarySteps }));
      }
    }
    const result = spawnSync(process.execPath, [script, root], {
      encoding: 'utf8',
      env: {
        ...process.env,
        LAB_RESULT: 'success', AGENT_RESULT: 'success',
        SAFE_OUTPUTS_RESULT: 'success', CLEANUP_RESULT: 'success',
        RUN_URL: 'https://github.com/example/workshop/actions/runs/123',
        ...jobs,
      },
    });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout;
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const step = (id, level, status, checks = []) => ({
  id, level, title: id, status, checks, exit_code: status === 'fail' ? 1 : 0,
});

test('reports successful completed runs including documented skips', () => {
  const report = render({ lab: [step('pre-dotnet-test', 'preflight', 'pass'), step('ui', 'Level 1', 'skip')] });
  assert.match(report, /\*\*Passed\*\* — 3 recorded steps: 2 passed, 0 failed, 0 warned, 1 skipped/);
  assert.match(report, /\| preflight \| 1 \| 1 \| 0 \| 0 \| 0 \|/);
  assert.match(report, /\[Run and downloadable results\]/);
});

test('preserves failed checks and warns without declaring success', () => {
  const report = render({ lab: [step('l5-compile', 'Level 5', 'fail', [{ name: 'lock generated', pass: false }])] });
  assert.match(report, /\*\*Failed\*\*/);
  assert.match(report, /\| Level 5 \| l5-compile \| fail \| lock generated \|/);
});

test('flags incomplete agent and missing lab data', () => {
  const report = render({ completed: false, infra: [step('infra-image', 'infra', 'fail')],
    jobs: { AGENT_RESULT: 'skipped', LAB_RESULT: 'failure', SAFE_OUTPUTS_RESULT: 'skipped' } });
  assert.match(report, /\*\*Incomplete\*\*/);
  assert.match(report, /No lab steps were collected/);
  assert.match(report, /Validator agent did not finish successfully \(skipped\)/);
});

test('keeps valid partial results but calls out malformed rows', () => {
  const report = render({ lab: [step('pre-tools', 'preflight', 'pass')], malformed: true });
  assert.match(report, /\*\*Incomplete\*\*/);
  assert.match(report, /Lab result 2 is not valid JSON/);
  assert.match(report, /\| preflight \| 1 \| 1 \|/);
});

test('does not pass a run with an empty infrastructure record', () => {
  const report = render({ infra: [], lab: [step('pre-dotnet-test', 'preflight', 'pass')] });
  assert.match(report, /\*\*Incomplete\*\*/);
  assert.match(report, /No infrastructure steps were collected/);
});

test('marks syntactically valid but truncated results incomplete', () => {
  const report = render({
    infra: [step('infra-ready', 'infra', 'pass'), step('preflight', 'preflight', 'pass')],
    lab: [step('pre-dotnet-test', 'preflight', 'pass')], summarySteps: 2,
  });
  assert.match(report, /\*\*Incomplete\*\*/);
  assert.match(report, /expects 2 steps, but 1 were collected/);
});

test('rejects an invalid expected step count', () => {
  const report = render({ lab: [step('pre-dotnet-test', 'preflight', 'pass')], summarySteps: 'unknown' });
  assert.match(report, /\*\*Incomplete\*\*/);
  assert.match(report, /invalid expected step count/);
});
