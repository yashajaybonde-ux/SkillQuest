import { test } from 'node:test';
import assert from 'node:assert/strict';
import { levelFromXp, levelProgress, xpForLevel } from '../src/lib/xp.js';
import { gradeQuiz, gradeHtml, gradeCode } from '../src/lib/grader.js';
import { canonicalJson, hashCredential, newPublicId, PUBLIC_ID_RE, certKey } from '../src/lib/credential.js';
import { dailyQuestIds } from '../src/lib/daily.js';
import { quests } from '../src/seed/data.js';

test('level formula', () => {
  assert.equal(levelFromXp(0), 1);
  assert.equal(levelFromXp(99), 1);
  assert.equal(levelFromXp(100), 2);
  assert.equal(levelFromXp(400), 3);
  assert.equal(xpForLevel(3), 400);
  assert.equal(levelProgress(150).percent, 17);
});

test('quiz grading uses the server key and pass threshold', () => {
  const ch = { pass_percent: 70, questions: [{}, {}, {}, {}] };
  assert.equal(gradeQuiz(ch, { answers: [0, 1, 2, 3] }, [0, 1, 2, 3]).passed, true);
  assert.equal(gradeQuiz(ch, { answers: [0, 1, 2, 3] }, [0, 1, 0, 0]).passed, false);
  assert.equal(gradeQuiz(ch, { answers: [0, 1, 2, 3] }, 'garbage').score, 0);
});

test('html grading reports missing rules', () => {
  const key = { rules: [{ type: 'regex', value: '<h1', message: 'need h1' }, { type: 'contains', value: 'alt=', message: 'need alt' }] };
  assert.equal(gradeHtml(key, '<h1>Hi</h1><img alt="x">').passed, true);
  assert.deepEqual(gradeHtml(key, '<p>no</p>').feedback.failed, ['need h1', 'need alt']);
});

test('every seeded code quest accepts a correct solution and rejects a wrong one', async () => {
  const solutions = {
    sumArray: 'function sumArray(a){return a.reduce((x,y)=>x+y,0)}',
    reverseString: 'function reverseString(s){return s.split("").reverse().join("")}',
    fizzBuzz: 'function fizzBuzz(n){return n%15===0?"FizzBuzz":n%3===0?"Fizz":n%5===0?"Buzz":String(n)}',
    isPalindrome: 'function isPalindrome(t){const s=t.toLowerCase().replace(/[^a-z0-9]/g,"");return s===s.split("").reverse().join("")}',
    groupBy: 'function groupBy(items,key){const o={};for(const i of items){(o[i[key]]=o[i[key]]||[]).push(i)}return o}',
  };
  for (const { quest, key } of quests.filter((q) => q.quest.type === 'code')) {
    const good = await gradeCode(quest.challenge, key, solutions[quest.challenge.fn]);
    assert.equal(good.passed, true, quest.slug);
    const bad = await gradeCode(quest.challenge, key, `function ${quest.challenge.fn}(){ return null }`);
    assert.equal(bad.passed, false, quest.slug);
  }
});

test('code runner survives infinite loops, syntax errors and cannot see secrets', async () => {
  const ch = { fn: 'f' }; const key = { tests: [{ args: [], expected: 1 }] };
  process.env.SUPER_SECRET = 'x';
  assert.equal((await gradeCode(ch, key, 'function f(){ while(true){} }')).passed, false);
  assert.equal((await gradeCode(ch, key, 'function f(){ ')).passed, false);
  assert.equal((await gradeCode(ch, key, 'function f(){ return typeof process === "undefined" ? 1 : 0 }')).passed, true);
  assert.equal((await gradeCode(ch, key, 'function f(){ try { return this.constructor.constructor("return 1")() } catch(e){ return 0 } }')).passed, false);
});

test('credential hashing detects any change and ignores key order', () => {
  const a = { certificateId: 'SQ-1', student: 'Ada', skills: ['JS'] };
  assert.equal(hashCredential(a), hashCredential({ skills: ['JS'], student: 'Ada', certificateId: 'SQ-1' }));
  assert.notEqual(hashCredential(a), hashCredential({ ...a, student: 'Eve' }));
  assert.equal(canonicalJson({ b: 1, a: [2, { d: 1, c: 2 }] }), '{"a":[2,{"c":2,"d":1}],"b":1}');
});

test('certificate IDs are well-formed and map to stable on-chain keys', () => {
  const id = newPublicId();
  assert.match(id, PUBLIC_ID_RE);
  assert.equal(certKey(id), certKey(id.toLowerCase()));
});

test('three daily quests, stable within a day', () => {
  const list = quests.map(({ quest }, i) => ({ id: String(i), slug: quest.slug }));
  const d = new Date('2026-10-16T10:00:00Z');
  assert.equal(dailyQuestIds(list, d).size, 3);
  assert.deepEqual([...dailyQuestIds(list, d)], [...dailyQuestIds(list, new Date('2026-10-16T23:00:00Z'))]);
});
