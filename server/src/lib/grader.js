import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HttpError } from './errors.js';

const runnerPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'runner.js');
const MAX_CODE = 20000;

export function gradeQuiz(challenge, key, answer) {
  const qs = challenge.questions || [];
  const given = Array.isArray(answer) ? answer : [];
  let correct = 0;
  qs.forEach((_, i) => { if (Number.isInteger(given[i]) && given[i] === key.answers?.[i]) correct++; });
  const score = qs.length ? Math.round((correct / qs.length) * 100) : 0;
  return { passed: score >= (challenge.pass_percent ?? 70), score, feedback: { correct, total: qs.length } };
}

export function gradeHtml(key, answer) {
  const code = String(answer ?? '').slice(0, MAX_CODE);
  const rules = key.rules || [];
  const failed = [];
  for (const r of rules) {
    let ok = false;
    try { ok = r.type === 'regex' ? new RegExp(r.value, 'i').test(code) : code.toLowerCase().includes(String(r.value).toLowerCase()); } catch { ok = false; }
    if (!ok) failed.push(r.message);
  }
  const score = rules.length ? Math.round(((rules.length - failed.length) / rules.length) * 100) : 0;
  return { passed: failed.length === 0, score, feedback: { failed } };
}

export function gradeCode(challenge, key, answer) {
  const code = String(answer ?? '');
  if (!code.trim()) return Promise.resolve({ passed: false, score: 0, feedback: { message: 'Write some code first.' } });
  if (code.length > MAX_CODE) throw new HttpError(400, 'Code is too long.');
  const fn = challenge.fn;
  if (!/^[A-Za-z_$][\w$]*$/.test(fn || '')) throw new HttpError(500, 'Quest is misconfigured.');
  const tests = key.tests || [];

  return new Promise((resolve) => {
    // Empty env: the student's code cannot read server secrets. See README "Security notes".
    const child = spawn(process.execPath, [runnerPath], { env: {}, stdio: ['pipe', 'pipe', 'ignore'] });
    let out = '';
    const timer = setTimeout(() => child.kill('SIGKILL'), 5000);
    child.stdout.on('data', (d) => { if (out.length < 100000) out += d; });
    child.on('close', () => {
      clearTimeout(timer);
      try {
        const r = JSON.parse(out);
        if (r.compileError) return resolve({ passed: false, score: 0, feedback: { message: `Your code has an error: ${r.compileError}` } });
        const passedCount = r.results.filter((x) => x.ok).length;
        const score = tests.length ? Math.round((passedCount / tests.length) * 100) : 0;
        resolve({ passed: passedCount === tests.length && tests.length > 0, score, feedback: { passedTests: passedCount, totalTests: tests.length, visible: r.results.map((x, i) => (tests[i]?.visible ? { ...x, args: tests[i].args, expected: tests[i].expected } : { ok: x.ok })) } });
      } catch {
        resolve({ passed: false, score: 0, feedback: { message: 'Your code took too long or crashed. Check for infinite loops.' } });
      }
    });
    child.stdin.end(JSON.stringify({ code, fn, tests }));
  });
}

export async function gradeSubmission(quest, key, answer) {
  if (quest.type === 'quiz') return gradeQuiz(quest.challenge, key, answer);
  if (quest.type === 'html') return gradeHtml(key, answer);
  if (quest.type === 'code') return gradeCode(quest.challenge, key, answer);
  throw new HttpError(500, 'Unknown quest type.');
}
