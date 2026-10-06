// Extracts the copy-paste prompts and form values from docs/afternoon-2/workshop.md.
// The tester replays exactly what participants paste, so a doc change is tested as written.
// Usage: node extract-prompts.mjs <workshop.md> <out-dir>
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const [, , docPath, outDir] = process.argv;
const lines = readFileSync(docPath, 'utf8').split(/\r?\n/);
mkdirSync(outDir, { recursive: true });

// Collect every ```text block with the nearest non-empty line above it.
const blocks = [];
let section = '';
let toggle = '';
for (let i = 0; i < lines.length; i++) {
  if (lines[i].startsWith('#')) section = lines[i].trim();
  const summary = lines[i].match(/<summary>(.*?)<\/summary>/);
  if (summary) toggle = summary[1];
  if (lines[i].trim() === '</details>') toggle = '';
  if (lines[i].trim() !== '```text') continue;
  let lead = i - 1;
  while (lead >= 0 && lines[lead].trim() === '') lead--;
  const body = [];
  let j = i + 1;
  for (; j < lines.length && lines[j].trim() !== '```'; j++) body.push(lines[j]);
  blocks.push({ section, toggle, lead: lead >= 0 ? lines[lead].trim() : '', body: body.join('\n').trim() });
  i = j;
}

const byFirstLine = (prefix) => blocks.find((b) => b.body.startsWith(prefix));
const byLead = (lead) => blocks.find((b) => b.lead === lead);
const byCommitTask = (task) => blocks.find((b) =>
  b.body.startsWith('/hve-core:git-commit.prompt\n') && b.body.includes(task));

for (const block of blocks.filter((b) => b.body.startsWith('/hve-core:'))) {
  const invocation = block.body.match(/^(\/hve-core:[\w.-]+)(?:[ \t]+|\n)([\s\S]+)$/);
  if (!invocation || !invocation[2].trim()) {
    console.error(`HVE invocation must include its command and task in one block: ${block.body.split('\n')[0]}`);
    process.exit(1);
  }
}

const wanted = {
  'dt-start': byFirstLine('/hve-core:dt-start-project.prompt'),
  'dt-method-next': byFirstLine('/hve-core:dt-method-next.prompt'),
  'dt-summary': byFirstLine('Summarize the final decisions'),
  'dt-record': byFirstLine('Write a curated Design Thinking decision record'),
  'dt-later-choice': byFirstLine('Help me choose one idea from our DT conversation'),
  'dt-later-record': byFirstLine('Write a curated later-slice decision'),
  'brd-start': byFirstLine('Create a business requirements document for the Music Catalog playlist slice.'),
  'adr-author': byFirstLine('/hve-core:adr-author'),
  'rpi-research': byFirstLine('/hve-core:rpi-research'),
  'rpi-plan': byFirstLine('/hve-core:rpi-plan'),
  'rpi-implement': byFirstLine('/hve-core:rpi-implement'),
  'rpi-review': byFirstLine('/hve-core:rpi-review'),
  'issue-title': byLead('Title:'),
  'issue-problem': byLead('Problem statement:'),
  'issue-outcome': byLead('Expected outcome:'),
  'issue-acceptance': byLead('Acceptance criteria:'),
  'issue-area': byLead('Area:'),
  'issue-out-of-scope': byLead('Out of scope:'),
  'agent-instructions': byFirstLine('Use the RPI workflow.'),
  'commit-l2': byCommitTask('Commit the reviewed Level 2 planning deliverables'),
  'commit-l3': byCommitTask('Commit the approved playlist implementation'),
  'commit-tech-lead': byCommitTask('Commit the reviewed Tech Lead changes'),
  'commit-l4': byCommitTask('Commit the governed repository setup'),
  'commit-ci': byCommitTask('Commit the reviewed CI workflow'),
  'commit-setup': byCommitTask('Commit the reviewed Copilot setup'),
  'commit-backlog': byCommitTask('Commit the reviewed Stage 5b setup'),
  'commit-security': byCommitTask('Commit the reviewed label-gated security workflow'),
  'commit-l6': byCommitTask('Commit the reviewed local Level 6 changes'),
  'commit-demo': byCommitTask('Commit only demo.env'),
  'git-clone': byFirstLine('Clone https://github.com/OWNER/my-music-catalog'),
  'git-readiness': byFirstLine('Verify Git is installed'),
  'git-l1-inspect': byFirstLine('Check whether the working tree is still clean after Level 1'),
  'git-l3-branch': byFirstLine('Verify that the current branch is the repository'),
  'git-l3-pr': blocks.find(b => b.body.startsWith('/hve-core:pull-request\n') &&
    b.body.includes('Create a pull request for the committed Level 3')),
  'git-l3-sync': byFirstLine('Verify that the Level 3 PR is merged'),
  'git-l4-inspect': byFirstLine('Inspect the pending repository setup paths'),
  'git-l4-publish': byFirstLine('Publish the committed Level 4 repository setup'),
  'git-ci-publish': byFirstLine('Show me the remote, branch and committed CI workflow change'),
  'git-setup-publish': byFirstLine('Show me the remote, branch and committed Copilot setup change'),
  'git-l5-branch': byFirstLine('Verify the working tree is clean and the current default-branch baseline'),
  'git-compile-inspect': byFirstLine('Inspect the pending paths and diffs from gh aw init'),
  'git-backlog-inspect': byFirstLine('Inspect pending paths and diffs under .github/workflows'),
  'git-backlog-pr': blocks.find(b => b.body.startsWith('/hve-core:pull-request\n') &&
    b.body.includes('Create a PR titled "Add the Stage 5b backlog setup"')),
  'git-backlog-sync': byFirstLine('Verify the Stage 5b setup PR is merged'),
  'git-security-branch': byFirstLine('Verify the default-branch baseline and clean working tree'),
  'git-security-pr': blocks.find(b => b.body.startsWith('/hve-core:pull-request\n') &&
    b.body.includes('Create a PR for the committed security-review-delegation branch')),
  'git-l6-sync': byFirstLine('Verify the delegated PR is merged'),
  'git-l6-inspect': byFirstLine('Inspect the local working tree after Level 6'),
  'git-demo-branch': byFirstLine('Verify the working tree is clean, then create and switch to demo/push-protection'),
  'git-demo-push': byFirstLine('Show me the proctor remote, demo/push-protection branch'),
  'git-demo-cleanup': byFirstLine('Verify the demo push was rejected'),
};

const missing = [];
for (const [name, block] of Object.entries(wanted)) {
  if (!block || !block.body) { missing.push(name); continue; }
  writeFileSync(join(outDir, `${name}.txt`), block.body + '\n');
  console.log(`extracted ${name} (${block.body.length} chars)`);
}
if (missing.length) {
  console.error(`missing prompts: ${missing.join(', ')}`);
  process.exit(1);
}

const examples = [
  { name: 'dt-example', summary: 'Toggle solution: example prompts for the nine methods', count: 9 },
  { name: 'brd-example', summary: 'Toggle example: a step-by-step BRD conversation', count: 13 },
];
for (const { name, summary, count } of examples) {
  const prompts = blocks.filter((block) => block.toggle === summary);
  if (prompts.length !== count) {
    console.error(`expected ${count} text blocks in "${summary}", found ${prompts.length}`);
    process.exit(1);
  }
  // The BRD toggle starts with step 2; its last block is a conditional clarification-limit response.
  prompts.forEach((block, index) => {
    const number = name === 'brd-example' ? index + 2 : index + 1;
    writeFileSync(join(outDir, `${name}-${String(number).padStart(2, '0')}.txt`), block.body + '\n');
  });
}

const solutions = blocks.filter((block) => /Toggle (solution|example)/i.test(block.toggle));
writeFileSync(join(outDir, 'curated-solutions.txt'), solutions.map((block) =>
  `${block.section}\n${block.toggle}\n${block.lead}\n${block.body}`).join('\n\n') + '\n');
writeFileSync(join(outDir, 'replay-policy.txt'), [
  'You are replaying a published workshop example, not choosing your own learner scenario.',
  'Follow the current message and the relevant curated solution in the reference file below.',
  'Do not invent learner answers, stakeholders, research, test results, metrics, approvals, or waivers.',
  'Wait for the next supplied message instead of autonomously progressing through later conversation steps.',
  'If a required answer is absent, record the gap and stop that action; do not bypass evidence or approval gates.',
  'DT examples are sampled or planned, not evidence that full methods are complete. Keep DT coaching writes under .copilot-tracking/ only.',
  'The separate Documentation authoring turn may curate the published delivery brief in docs/project-planning/playlist-design-decisions.md. This is not human approval or proof of completed DT methods.',
  'The later-slice DT choice and docs/project-planning/dt-later-slice.md require a real learner decision. Do not fabricate a choice or approval; the replay skips these interactive turns.',
  'BRD drafting may write its documented file in docs/project-planning/. Do not sign off, approve waivers, or execute a backlog handoff.',
  `Curated reference file: ${join(outDir, 'curated-solutions.txt')}`,
].join('\n') + '\n');
