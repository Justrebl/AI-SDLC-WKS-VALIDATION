import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const read = (path) => readFileSync(resolve(root, path), 'utf8').replace(/\r\n/g, '\n');
const workshop = read('docs/afternoon-2/workshop.md');
const creator = read('.github/agents/workshop-creator.agent.md');
const skill = read('.github/skills/workshop-authoring/SKILL.md');
const frontmatter = (text) => text.match(/^---\n([\s\S]*?)\n---\n/)?.[1];
const withoutDetails = (text) => text.replace(/<details>[\s\S]*?<\/details>/g, '');

test('checkpoint labels consistently use Success Criteria across both workshops and authoring guidance', () => {
  const obsolete = new RegExp(['expected', 'results?'].join(' '), 'i');
  for (const path of [
    'docs/afternoon-1/workshop.md',
    'docs/afternoon-2/workshop.md',
    '.github/agents/workshop-creator.agent.md',
    '.github/agents/workshop-pedagogy-reviewer.agent.md',
    '.github/skills/workshop-authoring/SKILL.md',
    '.github/workflows/workshop-tester.md',
    'docs/maintainer-handbook.md',
  ]) assert.doesNotMatch(read(path), obsolete, path);
  for (const path of ['docs/afternoon-1/workshop.md', 'docs/afternoon-2/workshop.md']) {
    assert.match(read(path), /^Success Criteria:$/m, path);
  }
});

test('each level has a concise visible introduction and optional background', () => {
  const actionHeadings = [
    '## Install the CLI plugin',
    '## Start a DT project',
    '## Research phase',
    '## Install HVE-Core through APM',
    '## Install and initialize gh-aw',
    '## Review the pull request',
  ];
  actionHeadings.forEach((heading, index) => {
    const start = workshop.indexOf(`# Level ${index + 1}:`);
    const action = workshop.indexOf(heading, start);
    assert.ok(start >= 0 && action > start, `Level ${index + 1} action`);
    const introduction = workshop.slice(start, action);
    assert.match(introduction, /<details>\n<summary>[^<]+<\/summary>/);
    const visible = withoutDetails(introduction);
    assert.match(visible, /## Topic/);
    const optionalLecture = index === 4
      ? visible.replace(/### Handoff artifact: Stage 5a verification record[\s\S]*?(?=\n## Stage 5b: Backlog and delegation)/, '')
      : visible;
    assert.doesNotMatch(optionalLecture, /^\|/m, `Level ${index + 1} lecture tables stay optional`);
    assert.doesNotMatch(introduction, /<details\s+open/);
  });
});

test('disclosure markup is balanced and contains no page or level boundary', () => {
  let depth = 0;
  let fence;
  for (const line of workshop.split('\n')) {
    const marker = line.match(/^\s*(`{3,}|~{3,})/);
    if (marker) {
      if (!fence) fence = marker[1][0];
      else if (marker[1][0] === fence) fence = undefined;
      continue;
    }
    if (fence) continue;
    if (line.includes('<details>')) depth++;
    if (line.includes('</details>')) depth--;
    assert.ok(depth >= 0, 'no unmatched closing detail tag');
    if (/^---\s*$|^# /.test(line)) assert.equal(depth, 0, 'page boundaries remain outside details');
  }
  assert.equal(depth, 0);
  assert.equal(fence, undefined);
});

test('required exercise commands and approval gates remain visible and facilitator demo keeps safety warnings', () => {
  const visible = withoutDetails(workshop);
  for (const text of [
    '## Install the CLI plugin', '## Start a DT project', '## Research phase',
    '## Plan phase', '## Implement phase', '## Review phase',
    'apm install', 'apm audit --ci', 'gh aw compile',
    '## Stage 5a: Verification as contract', '## Stage 5b: Backlog and delegation',
    '### Step 2: Assign the issue', '### Step 6: Decide',
    '### Facilitator demo: Secret scanning and push protection',
    'This is facilitator-only; attendees do not configure push protection in their repositories.', 'Never',
    'explicitly approve the plan in the conversation', 'A skipped or blocked run is not a pass',
  ]) assert.ok(visible.includes(text), text);
  assert.match(workshop, /use the generated fake key below/i);
  assert.match(visible, /never commit the tracking folder/i);
});

test('Level 2 presents the actual starter scenario and source layout before coaching', () => {
  const level2 = workshop.slice(workshop.indexOf('# Level 2:'), workshop.indexOf('## Start a DT project'));
  const visible = withoutDetails(level2);
  assert.match(visible, /## Scenario: Music Catalog/);
  assert.match(visible, /currently displays a greeting from the API/);
  assert.match(visible, /Later, you will add catalog browsing and one in-memory playlist/);
  for (const path of [
    'src/api/Program.cs', 'src/api/Data/tracks.json', 'src/front/src/App.tsx',
    'src/front/src/main.tsx', 'src/front/vite.config.ts',
  ]) assert.ok(existsSync(resolve(root, path)), path);
  assert.match(read('src/api/Program.cs'), /MapGet\("\/api\/hello"/);
  assert.match(read('src/front/src/App.tsx'), /fetch\('\/api\/hello'\)/);
  assert.match(read('src/front/vite.config.ts'), /proxy/);
  assert.match(visible, /Program\.cs.*API entry point/);
  assert.match(visible, /src\\App\.tsx.*React screen/);
});

test('Workshop Creator loads the canonical local skill without changing its handoffs', () => {
  const reference = creator.match(/#file:(\.\.\/skills\/workshop-authoring\/SKILL\.md)/);
  assert.ok(reference);
  assert.ok(existsSync(resolve(dirname(resolve(root, '.github/agents/workshop-creator.agent.md')), reference[1])));
  assert.match(creator, /activate `workshop-authoring`/);
  assert.match(creator, /If the skill cannot be loaded, stop content authoring/);
  const baseline = spawnSync('git', ['show', 'HEAD:.github/agents/workshop-creator.agent.md'], {
    cwd: root, encoding: 'utf8',
  });
  assert.equal(baseline.status, 0, baseline.stderr);
  assert.equal(frontmatter(creator), frontmatter(baseline.stdout.replace(/\r\n/g, '\n')));
});

test('the authoring skill records progressive disclosure without weakening the required path', () => {
  const metadata = frontmatter(skill);
  assert.match(metadata, /^name: workshop-authoring$/m);
  assert.match(metadata, /^description: "[^"]*Use when[^"]+"$/m);
  assert.doesNotMatch(metadata, /^(tools|model|agent|handoffs|applyTo):/m);
  assert.match(skill, /## Documented decision: progressive disclosure/);
  assert.match(skill, /default-collapsed `<details>`/);
  assert.match(skill, /Keep required commands, starter prompts, success criteria, prerequisites/);
  assert.match(skill, /permission or licensing warnings, and human approval gates visible/);
  assert.match(skill, /## Stop rules/);
  assert.match(read('docs/maintainer-handbook.md'), /\| D21 \| Progressive disclosure/);
  assert.match(read('CONTRIBUTING.md'), /Workshop Authoring/);
});
