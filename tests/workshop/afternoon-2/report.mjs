#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.argv[2];
if (!root) {
  throw new Error('Usage: node report.mjs <lab-run-artifact-directory>');
}

const problems = [];
const steps = [];
const labSteps = [];
for (const [name, path] of [
  ['Infrastructure', join(root, 'infra', 'results.jsonl')],
  ['Lab', join(root, 'lab', 'workshop-tester', 'results.jsonl')],
]) {
  if (!existsSync(path)) {
    problems.push(`${name} results were not collected.`);
    continue;
  }
  for (const [index, line] of readFileSync(path, 'utf8').split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    try {
      const entry = JSON.parse(line);
      if (!entry.id || !entry.level || !['pass', 'fail', 'warn', 'skip'].includes(entry.status)) {
        problems.push(`${name} result ${index + 1} is missing required fields.`);
        continue;
      }
      steps.push(entry);
      if (name === 'Lab') labSteps.push(entry);
    } catch {
      problems.push(`${name} result ${index + 1} is not valid JSON.`);
    }
  }
}

const labComplete = existsSync(join(root, 'lab', 'workshop-tester', 'done'))
  && existsSync(join(root, 'lab', 'workshop-tester', 'summary.json'));
if (!labComplete) problems.push('The lab completion marker or summary is missing.');
if (!steps.some(step => step.level === 'infra')) problems.push('No infrastructure steps were collected.');
if (!labSteps.length) problems.push('No lab steps were collected.');
if (labComplete) {
  try {
    const { steps: expected } = JSON.parse(readFileSync(join(root, 'lab', 'workshop-tester', 'summary.json'), 'utf8'));
    if (!Number.isSafeInteger(expected) || expected < 0) {
      problems.push('The lab summary has an invalid expected step count.');
    } else if (labSteps.length !== expected) {
      problems.push(`The lab summary expects ${expected} steps, but ${labSteps.length} were collected.`);
    }
  } catch {
    problems.push('The lab summary is not valid JSON.');
  }
}

const jobResults = [
  ['Lab job', process.env.LAB_RESULT],
  ['Validator agent', process.env.AGENT_RESULT],
  ['Safe outputs', process.env.SAFE_OUTPUTS_RESULT],
  ['Sandbox cleanup', process.env.CLEANUP_RESULT],
];
for (const [name, result] of jobResults) {
  if (result !== 'success') problems.push(`${name} did not finish successfully (${result || 'unknown'}).`);
}

const count = status => steps.filter(step => step.status === status).length;
const verdict = problems.length ? 'Incomplete' : count('fail') ? 'Failed'
  : count('warn') ? 'Needs attention' : 'Passed';
const cell = value => String(value ?? '').replace(/[\r\n\t]+/g, ' ')
  .replace(/[|<>`\\]/g, char => `\\${char}`).slice(0, 180);
const results = new Map();
for (const step of steps) {
  if (!results.has(step.level)) results.set(step.level, []);
  results.get(step.level).push(step);
}

console.log('## Afternoon 2 workshop test report');
console.log(`**${verdict}** — ${steps.length} recorded steps: ${count('pass')} passed, ${count('fail')} failed, ${count('warn')} warned, ${count('skip')} skipped.`);
const url = process.env.RUN_URL;
if (url && /^https:\/\/[^/\s]+\/[^/\s]+\/[^/\s]+\/actions\/runs\/\d+$/.test(url)) {
  console.log(`[Run and downloadable results](${url}#artifacts). The validator's issue or noop contains the guided interpretation when it completed.`);
}
console.log('');
console.log('| Level | Steps | Pass | Fail | Warn | Skip |');
console.log('|---|---:|---:|---:|---:|---:|');
for (const [level, entries] of results) {
  const n = status => entries.filter(entry => entry.status === status).length;
  console.log(`| ${cell(level)} | ${entries.length} | ${n('pass')} | ${n('fail')} | ${n('warn')} | ${n('skip')} |`);
}
console.log('');
console.log('### Jobs and completeness');
for (const [name, result] of jobResults) console.log(`- ${name}: **${cell(result || 'unknown')}**`);
console.log(`- Lab completed: **${labComplete ? 'yes' : 'no'}**`);
for (const problem of problems) console.log(`- ${cell(problem)}`);
console.log('');
console.log('### Failed or warned steps');
const flagged = steps.filter(step => step.status === 'fail' || step.status === 'warn');
if (!flagged.length) {
  console.log('None recorded. Missing or incomplete results are listed above, not counted as passes.');
} else {
  console.log('| Level | Step | Status | Failed checks / note |');
  console.log('|---|---|---|---|');
  for (const step of flagged) {
    const failed = (Array.isArray(step.checks) ? step.checks : [])
      .filter(check => check.pass === false).map(check => check.name).join('; ');
    console.log(`| ${cell(step.level)} | ${cell(step.id)} | ${cell(step.status)} | ${cell(failed || step.notes || `exit ${step.exit_code}`)} |`);
  }
}
