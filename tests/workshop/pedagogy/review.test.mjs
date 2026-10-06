import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { prepare, runReview, reviewContext, validateReport, reportHeadings, reviewerArgs, githubReadTools } from './review.mjs';

const requireBuiltin = createRequire(import.meta.url);
const workflow = readFileSync(new URL('../../../.github/workflows/workshop-pedagogy-review.yml', import.meta.url), 'utf8')
  .replaceAll('\r\n', '\n');
const agent = readFileSync(new URL('../../../.github/agents/workshop-pedagogy-reviewer.agent.md', import.meta.url), 'utf8')
  .replaceAll('\r\n', '\n');
const env = {
  REVIEW_REPOSITORY: 'example/workshop', REVIEW_SHA: 'a'.repeat(40),
  TESTER_RUN_ID: '123', TESTER_RUN_ATTEMPT: '2', TESTER_CONCLUSION: 'failure',
  TESTER_RUN_URL: 'https://github.com/example/workshop/actions/runs/123',
  REVIEW_RUN_ID: '456', REVIEW_RUN_URL: 'https://github.com/example/workshop/actions/runs/456',
};
const completeReport = reportHeadings.map(heading =>
  `## ${heading}\n\n${heading === 'Level-by-level coverage' ? '| A1-L1 | Linked upstream content, not inspected |\n| A2-L1 | Primer and handoff assessed |' : 'Evidence and assessment.'}`
).join('\n\n');

test('provenance retains failed and clean tester runs and uses attempt-specific deduplication', () => {
  for (const conclusion of ['success', 'failure', 'cancelled', 'timed_out']) {
    const context = reviewContext({ ...env, TESTER_CONCLUSION: conclusion });
    assert.equal(context.sha, env.REVIEW_SHA);
    assert.equal(context.testerConclusion, conclusion);
    assert.equal(context.key, 'tester-123-2');
    assert.equal(context.githubReadScope, env.REVIEW_REPOSITORY);
  }
  const manual = reviewContext({ ...env, TESTER_RUN_ID: '' });
  assert.equal(manual.key, 'manual-456');
  assert.equal(manual.testerRunUrl, null);
  for (const override of [
    { REVIEW_SHA: 'main' }, { REVIEW_REPOSITORY: '../other' },
    { TESTER_RUN_ID: 'not-a-run' }, { TESTER_RUN_ATTEMPT: '' },
    { REVIEW_RUN_URL: 'http://github.com/run' },
  ]) assert.throws(() => reviewContext({ ...env, ...override }));
});

test('report validation rejects empty, incomplete, and uncovered-level responses', () => {
  assert.equal(validateReport(completeReport, [{ id: 'A1-L1' }, { id: 'A2-L1' }]), completeReport);
  assert.throws(() => validateReport(''), /empty/);
  assert.throws(() => validateReport('A short summary'), /Missing report section/);
  assert.throws(() => validateReport(completeReport.replace('## Prioritized findings\n\nEvidence and assessment.',
    '## Prioritized findings\n')), /Empty report section/);
  assert.throws(() => validateReport(completeReport, [{ id: 'A2-L6' }]), /Missing level coverage row/);
  assert.throws(() => validateReport(completeReport.replace('## Scope and evidence', '## Overall assessment')
    .replace('## Overall assessment\n\nEvidence and assessment.\n\n## Overall assessment',
      '## Overall assessment\n\nEvidence and assessment.\n\n## Scope and evidence')), /out of order/);
});

test('automation isolates source data and captures only a validated stdout report', () => {
  const root = mkdtempSync(join(tmpdir(), 'pedagogy-test-'));
  try {
    const source = join(root, 'source'), automation = join(root, 'automation'), output = join(root, 'output');
    for (const directory of [
      join(source, 'docs', 'afternoon-1'), join(source, 'docs', 'afternoon-2'),
      join(source, '.github'), join(automation, '.github', 'agents'),
    ]) mkdirSync(directory, { recursive: true });
    writeFileSync(join(source, 'README.md'), 'Workshop overview');
    writeFileSync(join(source, 'docs', 'afternoon-1', 'workshop.md'), '## Open upstream Level 1: Completion');
    writeFileSync(join(source, 'docs', 'afternoon-2', 'workshop.md'),
      '# Level 1: HVE\n![Missing asset](assets/missing.png)');
    writeFileSync(join(source, '.github', 'copilot-instructions.md'), 'Untrusted instructions');
    writeFileSync(join(automation, '.github', 'agents', 'workshop-pedagogy-reviewer.agent.md'), agent);
    prepare(source, automation, output, env);
    const input = JSON.parse(readFileSync(join(output, 'workspace', 'review-input.json'), 'utf8'));
    assert.deepEqual(input.levels.map(level => level.id), ['A1-L1', 'A2-L1']);
    assert.equal(input.files.find(file => file.path.includes('afternoon-2')).images[0].exists, false);
    assert.deepEqual(readdirSync(join(output, 'workspace', '.github')), ['agents']);
    assert.equal(readFileSync(join(output, 'workspace', '.github', 'agents',
      'workshop-pedagogy-reviewer.agent.md'), 'utf8'), agent);
    const summary = process.env.GITHUB_STEP_SUMMARY;
    delete process.env.GITHUB_STEP_SUMMARY;
    try {
      const reviewEnv = { COPILOT_GITHUB_TOKEN: 'fixture-repository-read-token' };
      runReview(output, (command, args, options) => {
        assert.equal(command, 'copilot');
        assert.deepEqual(args.slice(0, reviewerArgs.length), reviewerArgs);
        assert.equal(options.cwd, join(output, 'workspace'));
        assert.equal(options.env, reviewEnv);
        assert.match(args.at(-1), /only for example\/workshop/);
        return { status: 0, stdout: completeReport, stderr: '' };
      }, reviewEnv);
      assert.match(readFileSync(join(output, 'report.md'), 'utf8'), /Tester run: .* \(failure\)/);
      assert.throws(() => runReview(output, () => ({ status: 1, stderr: 'Authentication failed' }), reviewEnv), /Authentication failed/);
      assert.throws(() => runReview(output, () => ({ status: 0, stdout: 'Incomplete' }), reviewEnv), /Missing report section/);
      assert.throws(() => runReview(output, () => { throw new Error('Must not invoke'); }, {}),
        /COPILOT_GITHUB_TOKEN is required/);
    } finally {
      if (summary !== undefined) process.env.GITHUB_STEP_SUMMARY = summary;
    }
  } finally {
    rmSync(root, { recursive: true });
  }
});

test('completion trigger is restricted to the opted-in same-repository main tester', () => {
  const tester = readFileSync(new URL('../../../.github/workflows/workshop-tester.lock.yml', import.meta.url), 'utf8');
  const name = tester.match(/^name: "(.+)"$/m)[1];
  assert.ok(workflow.includes(`workflows: ["${name}"]`));
  for (const guard of [
    "vars.WORKSHOP_TESTER_ENABLED == 'true'", "github.ref == 'refs/heads/main'",
    'github.event.workflow_run.head_repository.full_name == github.repository',
    "github.event.workflow_run.head_branch == 'main'",
    "github.event.workflow_run.path == '.github/workflows/workshop-tester.lock.yml'",
    "github.event.workflow_run.event == 'push'", "github.event.workflow_run.event == 'workflow_dispatch'",
  ]) assert.ok(workflow.includes(guard), guard);
  assert.match(workflow, /types: \[completed\]/);
  assert.doesNotMatch(workflow, /conclusion == 'success'|WORKSHOP_TESTER_TOKEN[ }]/);
  const reviewer = workflow.slice(workflow.indexOf('  review:'), workflow.indexOf('  publish:'));
  assert.doesNotMatch(reviewer, /issues: write|contents: write|GH_TOKEN:/);
  assert.match(reviewer, /issues: read\n\s+pull-requests: read/);
  assert.match(reviewer, /secrets\.WORKSHOP_PEDAGOGY_TOKEN \|\| github\.token/);
  assert.doesNotMatch(reviewer, /WORKSHOP_TESTER_COPILOT_TOKEN|WORKSHOP_TESTER_SANDBOX_TOKEN/);
  assert.match(reviewer, /head_sha \|\| github.sha/);
  assert.match(workflow, /persist-credentials: false/g);
  assert.match(agent, /tools:\n  - read\n  - search/);
  assert.deepEqual(reviewerArgs.slice(reviewerArgs.indexOf('--model'), reviewerArgs.indexOf('--model') + 4),
    ['--model', 'auto', '--auto-tier', 'intelligence']);
  assert.doesNotMatch(reviewerArgs.join(' '), /--disable-builtin-mcps|--enable-all-github-mcp-tools/);
  assert.ok(reviewerArgs.includes('--no-custom-instructions'));
  assert.ok(reviewerArgs.includes('githubiq'));
  const enabled = reviewerArgs.flatMap((arg, index) =>
    arg === '--add-github-mcp-tool' ? [reviewerArgs[index + 1]] : []);
  assert.deepEqual(enabled, githubReadTools);
  for (const tool of githubReadTools) {
    assert.ok(agent.includes(`  - github/${tool}\n`));
    assert.ok(agent.includes(`  - github-mcp-server/${tool}\n`));
  }
  assert.doesNotMatch(githubReadTools.join(' '), /issue_write|create|assign|merge|push/);
  assert.doesNotMatch(agent.split('---')[1], /github.*\/(?:issue_write|create|assign|merge)/);
});

test('publisher creates one report and reuses an unchanged owned legacy issue', async () => {
  const script = workflow.split('          script: |\n')[1].split('      - name: Report publishing failure')[0]
    .split('\n').map(line => line.replace(/^ {12}/, '')).join('\n');
  const publish = new Function('require', 'context', 'github', 'core', `return (async () => { ${script} })();`);
  const marker = '<!-- pedagogy-review:tester-123-2 -->';
  const metadata = reviewContext(env);
  for (const existing of [[], [{
    number: 9, title: '[Pedagogy review] aaaaaaa (tester-123-2)',
    body: `${marker}\n${completeReport}`, user: { login: 'github-actions[bot]' },
    html_url: 'https://github.com/issue/9',
  }]]) {
    const mutations = [], summaries = [];
    const github = {
      paginate: async () => existing,
      rest: { issues: {
        getLabel: async input => assert.equal(input.name, 'pedagogy-review'),
        listForRepo: () => {},
        create: async input => { mutations.push(input); return { data: { html_url: 'https://github.com/issue/10' } }; },
      } },
    };
    const summary = {
      addRaw(text) { summaries.push(text); return this; },
      addLink() { return this; }, async write() {},
    };
    await publish(() => ({
      readFileSync: path => path.endsWith('context.json') ? JSON.stringify(metadata) : completeReport,
    }), { repo: { owner: 'example', repo: 'workshop' } }, github, { summary });
    assert.equal(mutations.length, existing.length ? 0 : 1);
    if (mutations.length) {
      assert.deepEqual(mutations[0].labels, ['pedagogy-review']);
      assert.ok(mutations[0].body.startsWith(marker));
      assert.ok(mutations[0].body.includes('<!-- pedagogy-report:start -->'));
      assert.equal(mutations[0].assignees, undefined);
    }
    assert.deepEqual(summaries, [completeReport]);
  }
});

function publisher() {
  const script = workflow.split('          script: |\n')[1].split('      - name: Report publishing failure')[0]
    .split('\n').map(line => line.replace(/^ {12}/, '')).join('\n');
  return new Function('require', 'context', 'github', 'core', `return (async () => { ${script} })();`);
}

function publishFixture({ issues = [], comments = [], report = completeReport, metadata = reviewContext(env) } = {}) {
  const calls = [];
  const github = {
    rest: { issues: {
      getLabel: async () => {},
      listForRepo: () => {}, listComments: () => {},
      create: async input => { calls.push(['create', input]); return { data: { ...input, html_url: 'https://github.com/issue/10' } }; },
      update: async input => { calls.push(['update', input]); return { data: input }; },
      createComment: async input => { calls.push(['comment', input]); return { data: input }; },
    } },
  };
  github.paginate = async method => method === github.rest.issues.listComments ? comments : issues;
  const summary = { addRaw() { return this; }, addLink() { return this; }, async write() {} };
  const requireFixture = name => name === 'node:fs'
    ? { readFileSync: path => path.endsWith('context.json') ? JSON.stringify(metadata) : report }
    : requireBuiltin(name);
  return {
    calls,
    run: () => publisher()(requireFixture, { repo: { owner: 'example', repo: 'workshop' } }, github, { summary }),
  };
}

const ownedIssue = body => ({
  number: 9, title: '[Pedagogy review] aaaaaaa (tester-123-2)', body,
  user: { login: 'github-actions[bot]' }, html_url: 'https://github.com/issue/9',
});
const reportMarker = '<!-- pedagogy-review:tester-123-2 -->';
const reportStart = '<!-- pedagogy-report:start -->', reportEnd = '<!-- pedagogy-report:end -->';

test('publisher refreshes only its generated island and preserves human content and issue state', async () => {
  const body = `${reportMarker}\n${reportStart}\nOld report\n${reportEnd}\n\nMaintainer notes`;
  const fixture = publishFixture({ issues: [{ ...ownedIssue(body), state: 'closed' }] });
  await fixture.run();
  assert.equal(fixture.calls.length, 1);
  const [operation, payload] = fixture.calls[0];
  assert.equal(operation, 'update');
  assert.equal(payload.issue_number, 9);
  assert.match(payload.body, /Maintainer notes$/);
  assert.ok(payload.body.includes(completeReport));
  assert.deepEqual(Object.keys(payload).sort(), ['body', 'issue_number', 'owner', 'repo']);

  const repeated = publishFixture({ issues: [ownedIssue(payload.body)] });
  await repeated.run();
  assert.deepEqual(repeated.calls, []);
});

test('publisher never overwrites a human-authored or unrelated issue with a matching marker', async () => {
  for (const item of [
    { ...ownedIssue(reportMarker), user: { login: 'human-maintainer' } },
    { ...ownedIssue(reportMarker), title: 'An unrelated task' },
    { ...ownedIssue(reportMarker), pull_request: {} },
    { ...ownedIssue(reportMarker), body: `Human notes\n${reportMarker}` },
  ]) {
    const fixture = publishFixture({ issues: [item] });
    await fixture.run();
    assert.deepEqual(fixture.calls.map(([operation]) => operation), ['create']);
  }
});

test('publisher appends a changed legacy report once rather than replacing its body', async () => {
  const issue = ownedIssue(`${reportMarker}\nLegacy report\n\nHuman additions`);
  const fixture = publishFixture({ issues: [issue] });
  await fixture.run();
  assert.deepEqual(fixture.calls.map(([operation]) => operation), ['comment']);
  const comment = fixture.calls[0][1];
  assert.match(comment.body, /^<!-- pedagogy-update:tester-123-2:[a-f0-9]{64} -->/);
  const repeated = publishFixture({ issues: [issue], comments: [
    { body: comment.body, user: { login: 'github-actions[bot]' } },
  ] });
  await repeated.run();
  assert.deepEqual(repeated.calls, []);
});

test('publisher fails closed on malformed provenance or generated boundaries', async () => {
  for (const options of [
    { metadata: { ...reviewContext(env), key: '../other' } },
    { metadata: { ...reviewContext(env), repository: 'another/repo' } },
    { report: `${completeReport}\n${reportEnd}` },
    { issues: [ownedIssue(`${reportMarker}\n${reportStart}\n${reportStart}\n${reportEnd}`)] },
    { issues: [ownedIssue(`${reportMarker}\n${reportEnd}\n${reportStart}`)] },
  ]) {
    const fixture = publishFixture(options);
    await assert.rejects(fixture.run());
    assert.deepEqual(fixture.calls, []);
  }
});
